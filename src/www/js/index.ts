/**
 * @author    Yannick Deubel (https://github.com/yandeu)
 * @copyright Copyright (c) 2021 Yannick Deubel
 * @license   {@link https://github.com/yandeu/docker-swarm-visualizer/blob/main/LICENSE LICENSE}
 */

import { toPercent, toMb, toGb, ipToId, addOrangeCircle, toGiB } from './misc.js'
import { get } from './get.js'
import { elements } from './elements.js'

const nodesHTML = document.getElementById('nodes')

const addNodes = async nodes => {
  // create nodes
  nodes.forEach(node => {
    const nodeHTML: any = elements.node(node).trim()
    const template: any = document.createElement('template')
    template.innerHTML = nodeHTML

    const html: any = template.content.firstChild

    // do add if it does not already exist
    if (!document.getElementById(html.id)) {
      if (nodesHTML) {
        nodesHTML.appendChild(html)

        // open uploader
        const uploadAction = html?.querySelector('.upload-action')
        if (uploadAction) {
          const listener = () => {
            const dropWrapper = document.getElementById('drop-wrapper')
            if (dropWrapper) dropWrapper.classList.toggle('is-hidden')
          }
          uploadAction.removeEventListener('click', listener)
          uploadAction.addEventListener('click', listener)
        }
      }
    }
  })

  return nodes
}

const addContainersToNode = async (NodeAddrID, ip, MemTotal) => {
  // fill nodes with containers
  // const batch = ips.map(async ip => {
  const containers = await get.containers(ip)
  if (!containers) return

  const sortRunningOnTop = (a, b) => {
    if (a.State === b.State) return 0
    if (a.State === 'running') return -1
    else return 1
  }

  let _containers: any[] = []

  containers.sort(sortRunningOnTop).forEach(container => {
    _containers.push(elements.container(container, MemTotal))
  })

  // filter out manually deleted containers (in this case c would be 'DELETED')
  _containers = _containers.filter(c => typeof c !== 'string')

  elements.complete.node(NodeAddrID, ip, _containers)

  return
}

const main = async () => {
  const nodes = await get.nodes()
  if (!nodes) return

  await addNodes(nodes)

  // array of all "ready"-node addresses (ip)
  let nodeAddresses = nodes.filter(n => n.State === 'ready').map(n => n.Addr)

  // get agents/dns (ip of the agents inside the visualizer overlay network)
  const ips = await get.agentsDns()
  if (ips.length === 0) return

  // console.log('nodeAddresses', nodeAddresses)
  // console.log("Agent IP's", ips)

  // (for each node)
  const batch = ips.map(async ip => {
    // get more info about that node
    const info = await get.info(ip)
    if (!info) return

    // check nodeAddress as fetched
    const index = nodeAddresses.indexOf(info.NodeAddr)
    if (index > -1) nodeAddresses.splice(index, 1)

    // update stats of node
    const { NodeAddr, MemTotal, cpuCount, cpuUsage, disk, memUsage, OperatingSystem } = info
    const NodeAddrID = ipToId(NodeAddr)
    const nodeHTML = document.getElementById(NodeAddrID)
    if (nodeHTML) {
      // replace os
      const os = nodeHTML.querySelector('.os')
      if (os) os.innerHTML = OperatingSystem

      // replace usage
      const usage = nodeHTML.querySelector('.usage')
      if (usage) usage.innerHTML = `${toGiB(MemTotal)}G / ${cpuCount} Cors / ${disk?.Size}`

      // replace usage_percent
      const usage_percent = nodeHTML.querySelector('.usage_percent')
      if (usage_percent) usage_percent.innerHTML = `${memUsage}% / ${cpuUsage}% / ${disk?.Percent}`
    }

    // add containers
    await addContainersToNode(NodeAddrID, ip, MemTotal)

    return
  })
  await Promise.all(batch)

  // the remaining nodes that could somehow not be accessed (maybe they are restarting or not yet marked as "down")
  nodeAddresses.forEach(ip => {
    addOrangeCircle(ip)
  })
}
main()

setInterval(() => {
  main()
}, 5000)
