/**
 * @author    Yannick Deubel (https://github.com/yandeu)
 * @copyright Copyright (c) 2021 Yannick Deubel
 * @license   {@link https://github.com/yandeu/docker-swarm-visualizer/blob/main/LICENSE LICENSE}
 */

/**
 * @description
 * Automatically add a node label based on in which subnet the node is.
 * 
 * @version
 * Works only in Node.js >= v15.0.0
 * 
 * @example
 * 
# whatever service you want to deploy
services:
  nginx:
    image: nginx:latest
    ports:
      - 8080:80
    deploy:
      placement:
        preferences:
          # spread this service out over the "subnet" label
          spread:
            - node.labels.subnet 

# the visualizer_agent service
services
  agent:
    labels:    
      - visualizer.subnet.az1=172.31.0.0/20
      - visualizer.subnet.az2=172.31.16.0/20
      - visualizer.subnet.az3=172.31.32.0/20

if the node has the internal IP 127.31.18.5, the label "az2" should be added to that node.

 */

import net from 'net'
import { containers as getContainers, info, node } from '../lib/api.js'
import { docker } from '../lib/docker.js'

export const addSubnetLabel = async () => {
  const { NodeAddr, NodeID } = await info()

  let containers = await getContainers(false)
  containers = containers.filter(c => 'visualizer.agent' in c.Labels && c.State === 'running')
  if (containers.length === 0) return

  // check if there are any subnet labels
  const subnetRegex = /^visualizer.subnet./
  const subnets = Object.entries(containers[0].Labels)
    .filter(([key]) => subnetRegex.test(key))
    .map(entry => `${entry[0].replace(subnetRegex, '')}=${entry[1]}`)

  // const subnets = ['az1=172.31.0.0/20', 'az2=172.31.16.0/20', 'az3=172.31.32.0/20']
  console.log('available subnets', subnets)

  let found
  while (subnets.length > 0 && !found) {
    const subnet = subnets.pop() as string
    const reg = /(\w+)=([\d\.]+)\/([\d]+)/gm

    try {
      const [_, label, ip, prefix] = reg.exec(subnet) as any

      const list = new net.BlockList()
      list.addSubnet(ip, parseInt(prefix))
      const match = list.check(NodeAddr)

      if (match) found = label
    } catch (error: any) {
      console.log(error.message)
    }
  }

  if (found) {
    // get current node spec
    let { Spec, Version } = await node(NodeID)

    // update current node spec
    Spec.Labels = { ...Spec.Labels, subnet: found }
    await docker(`nodes/${NodeID}/update?version=${Version.Index}`, 'POST', Spec)

    console.log('node subnet is:', found)

    // this node should now have a label called "subnet"

    // VERIFY (DEV)
    // let { Spec: tmp } = await node(NodeID)
    // console.log(tmp)
  }
}
