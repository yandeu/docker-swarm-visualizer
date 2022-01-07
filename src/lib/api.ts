/**
 * @author    Yannick Deubel (https://github.com/yandeu)
 * @copyright Copyright (c) 2021 Yannick Deubel
 * @license   {@link https://github.com/yandeu/docker-swarm-visualizer/blob/main/LICENSE LICENSE}
 */

import { docker } from './docker.js'
import { cpuCount, cpuUsage, diskUsage, memUsage } from './misc.js'

export interface Service {
  ID: string
  Version: {
    Index: number
  }
  CreatedAt: string
  UpdatedAt: string
  Spec: {
    Name: string
    TaskTemplate: {
      ContainerSpec: {
        Image: string
        Labels: {}
      }
      Resources: {
        Limits: {}
        Reservations: {}
      }
      RestartPolicy: {
        Condition: string
        MaxAttempts: number
      }
      Placement: {}
      ForceUpdate: number
    }
    Mode: {
      Replicated: {
        Replicas: number
      }
    }
    UpdateConfig: {}
    RollbackConfig: {}
    EndpointSpec: {
      Mode: string
      Ports: []
    }
  }
  Endpoint: {
    Spec: {
      Mode: string
      Ports: []
    }
    Ports: []
    VirtualIPs: []
  }
}

export interface Image {
  Id: string
  Container: string
  Comment: string
  Os: string
  Architecture: string
  Parent: string
  ContainerConfig: {
    Tty: boolean
    Hostname: string
    Domainname: string
    AttachStdout: boolean
    PublishService: string
    AttachStdin: boolean
    OpenStdin: boolean
    StdinOnce: boolean
    NetworkDisabled: boolean
    OnBuild: []
    Image: string
    User: string
    WorkingDir: string
    MacAddress: string
    AttachStderr: boolean
    Labels: {}
    Env: string[]
    Cmd: string[]
  }
  DockerVersion: string
  VirtualSize: number
  Size: number
  Author: string
  Created: string
  GraphDriver: {
    Name: string
    Data: {}
  }
  RepoDigests: string[]
  RepoTags: string[]
  Config: {
    Image: string
    NetworkDisabled: boolean
    OnBuild: []
    StdinOnce: boolean
    PublishService: string
    AttachStdin: boolean
    OpenStdin: boolean
    Domainname: string
    AttachStdout: boolean
    Tty: boolean
    Hostname: string
    Cmd: string[]
    Env: string[]
    Labels: {}
    MacAddress: string
    AttachStderr: boolean
    WorkingDir: string
    User: string
  }
  RootFS: any
}

export interface Node {
  ID: string
  Version: { Index: number }
  CreatedAt: string
  UpdatedAt: string
  Spec: { Availability: string; Name: string; Role: 'manager' | 'worker'; Labels: {} }
  Description: {}
  Status: { State: string; Message: string; Addr: string }
  ManagerStatus: {}
}

export interface Container {
  Id: string
  Names: string[]
  Image: string
  ImageID: string
  Command: string
  Created: number
  State: string
  Status: string
  Ports: { IP: string; PrivatePort: number; PublicPort: number; Type: string }[]
  Labels: object
  SizeRw: number
  SizeRootFs: number
  HostConfig: {}
  NetworkSettings: {}
  Mounts: []
  [key: string]: any
}

export const systemDF = async () => {
  return await docker('system/df')
}

export const nodesInfo = async () => {
  const nodes = (await docker('nodes')) as Node[]

  if (!Array.isArray(nodes)) return []

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
  return (await docker('nodes')) as Node[]
}

export const node = async (id: string) => {
  return (await docker(`nodes/${id}`)) as Node
}

export const containers = async (stats = true): Promise<Container[]> => {
  const containers = (await docker('containers/json?all=true')) as Container[]

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
  return (await docker(`containers/${id}/json`)) as Container
}

export const containerStats = async id => {
  return await docker(`containers/${id}/stats?stream=false`)
}

export const containerRemove = async id => {
  return await docker(`containers/${id}?force=true`, 'DELETE')
}

export const image = async name => {
  return (await docker(`/images/${name}/json`)) as Image
}

export const info = async (
  collectUsage = true
): Promise<{
  NodeID: any
  NodeAddr: any
  NCPU: any
  MemTotal: any
  OperatingSystem: any
  cpuCount?: any
  cpuUsage?: any
  memUsage?: any
  disk?: any
}> => {
  const info: any = await docker('info')

  if (!collectUsage)
    return {
      NodeID: info.Swarm.NodeID,
      NodeAddr: info.Swarm.NodeAddr,
      NCPU: info.NCPU,
      MemTotal: info.MemTotal,
      OperatingSystem: info.OperatingSystem
    }

  return {
    NodeID: info.Swarm.NodeID,
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
  return await docker('swarm')
}

export const services = async () => {
  return (await docker('services')) as Service[]
}

export const service = async (id: string) => {
  return (await docker(`services/${id}`)) as Service
}

export const serviceUpdateImage = async (id: string, image: string, tag: string, digest: string) => {
  // console.log('[manager] serviceUpdateImage', `${image}:${tag}@${digest}`)
  try {
    const service = (await docker(`services/${id}`)) as Service

    if (service) {
      const serviceId = service.ID
      const serviceVersion = service.Version.Index

      // set force update (See: https://github.com/docker/cli/blob/8e08b72450719baed03eed0e0713aae885315bac/cli/command/service/update.go#L490)
      service.Spec.TaskTemplate.ForceUpdate++

      // update image
      service.Spec.TaskTemplate.ContainerSpec.Image = `${image}:${tag}@${digest}`

      await docker(`services/${serviceId}/update?version=${serviceVersion}`, 'POST', service.Spec)
    }
  } catch (error: any) {
    console.log('error', error.message)
  }
}
