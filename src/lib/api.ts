/**
 * @author    Yannick Deubel (https://github.com/yandeu)
 * @copyright Copyright (c) 2021 Yannick Deubel
 * @license   {@link https://github.com/yandeu/docker-swarm-visualizer/blob/main/LICENSE LICENSE}
 */

import { docker } from './docker.js'
import os from 'os'
import { cpuCount, cpuUsage, diskUsage, memUsage } from './misc.js'

export const systemDF = async () => {
  return await docker('system/df')
}

export const nodesInfo = async () => {
  const nodes: any = await docker('nodes')
  return nodes.map(node => {
    return {
      ID: node.ID,
      Version: node.Version.Index,
      Addr: node.Status.Addr,
      Role: node.Spec.Role,
      Availability: node.Spec.Availability,
      State: node.Status.State
    }
  })
}

export const nodes = async () => {
  return await docker('nodes')
}

export const containers = async (stats = true) => {
  const containers: any = await docker('containers/json?all=true')

  if (stats) {
    const promises: any[] = []

    for (const value of containers) {
      const stats = containerStats(value.Id)
      promises.push(stats)
    }

    const results: any = await Promise.allSettled(promises)
    results.forEach((res, index) => {
      containers[index] = { ...containers[index], Stats: res.value }
    })
  }

  return containers
}

export const container = async id => {
  return await docker(`containers/${id}/json`)
}

export const containerStats = async id => {
  return await docker(`containers/${id}/stats?stream=false`)
}

export const containerRemove = async id => {
  return await docker(`containers/${id}?force=true`, 'DELETE')
}

export const info = async () => {
  const info: any = await docker('info')

  return {
    NodeAddr: info.Swarm.NodeAddr,
    NCPU: info.NCPU,
    MemTotal: info.MemTotal,
    OperatingSystem: info.OperatingSystem,
    cpuCount: await cpuCount(),
    cpuUsage: await cpuUsage(),
    memUsage: await memUsage(),
    disk: await diskUsage()
  }
}

export const swarm = async () => {
  const swarm = await docker('swarm')
  return swarm
}

export const services = async () => {
  const services = await docker('services')
  // console.log('services: ', services)
  return services
}
