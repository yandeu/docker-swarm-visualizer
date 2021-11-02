/**
 * @author    Yannick Deubel (https://github.com/yandeu)
 * @copyright Copyright (c) 2021 Yannick Deubel
 * @license   {@link https://github.com/yandeu/docker-swarm-visualizer/blob/main/LICENSE LICENSE}
 */

import type { CPUUsage, Tasks, AutoscalerSettings } from '../types.js'

import { containers, containerStats } from '../lib/api.js'
import { docker } from '../lib/docker.js'
import { agentDNSLookup } from '../lib/dns.js'
import { fetch } from '../lib/fetch.js'

const CPU_USAGE: any = {}
const LABEL_VISUALIZER = /^visualizer\./

let CONTAINERS_WITH_TASKS: any[] = []
let TASKS: any[] = []
let DEBUG = false

export const getTasks = () => TASKS

export const executeTask = async (service: any, task: Tasks) => {
  if (DEBUG) console.log('[executeTask]')

  const { name, autoscaler = { min: 1, max: 2 } } = task
  const { min, max } = autoscaler

  if (DEBUG) console.log('Task, Try:', name)

  if (name !== 'SCALE_UP' && name !== 'SCALE_DOWN') return

  const serviceId = service.ID
  const serviceVersion = service.Version.Index

  // update the service specs
  service.Spec.Mode.Replicated.Replicas += name === 'SCALE_UP' ? 1 : -1

  if (name === 'SCALE_DOWN' && service.Spec.Mode.Replicated.Replicas < min) return
  if (name === 'SCALE_UP' && service.Spec.Mode.Replicated.Replicas > max) return

  if (DEBUG) console.log('Task, Do:', name)

  try {
    await docker(`services/${serviceId}/update?version=${serviceVersion}`, 'POST', service.Spec)
  } catch (error: any) {
    console.log('error', error.message)
  }
}

/**
 * Check one per minute which containers have tasks
 */
export const checkContainersForTasks = async () => {
  if (DEBUG) console.log('[checkContainersForTasks]')

  let _containers: any = await containers(false)

  CONTAINERS_WITH_TASKS = _containers
    // only "running" containers
    .filter(c => c.State === 'running')
    // only containers with at least one label starting with "visualizer."
    .filter(c => Object.keys(c.Labels).some(key => LABEL_VISUALIZER.test(key)))
    // return container id and all its labels
    .map(c => ({
      id: c.Id,
      labels: c.Labels
    }))
}

/**
 * Gather information about container tasks
 */
export const gaterInformationForContainerTasks = async () => {
  if (DEBUG) console.log('[gaterInformationForContainerTasks]')

  const batch = CONTAINERS_WITH_TASKS.map(async container => {
    const _stats: any = await containerStats(container.id)

    if (_stats && _stats.cpu_stats && _stats.precpu_stats && _stats.memory_stats) {
      const stats = {
        cpu_stats: _stats.cpu_stats,
        precpu_stats: _stats.precpu_stats,
        memory_stats: _stats.memory_stats
      }
      const cpuUsage = calculateCPUUsageOneMinute({ Id: container.id, Stats: stats })
      return { ...container, cpuUsage }
    }

    return container
  })

  const result: any[] = await Promise.all(batch)

  // TODO(yandeu): Decide what to do
  // publish each task only once per 5 Minute?

  const tasks: Tasks[] = []
  result.forEach(r => {
    const cpuUsage = r.cpuUsage as CPUUsage

    // service
    const service = r.labels['com.docker.swarm.service.name']

    // autoscaler
    const cpuUp = parseFloat(r.labels['visualizer.autoscale.up.cpu'])
    const cpuDown = parseFloat(r.labels['visualizer.autoscale.down.cpu'])
    const max = parseInt(r.labels['visualizer.autoscale.max'])
    const min = parseInt(r.labels['visualizer.autoscale.min'])

    // updates
    // TODO

    const autoscaler: AutoscalerSettings = { min, max, up: { cpu: cpuUp }, down: { cpu: cpuDown } }

    if (cpuUsage && cpuUsage.cpu >= 0 && service && max > 0 && min > 0) {
      if (cpuUsage.cpu > cpuUp * 100) {
        tasks.push({ name: 'SCALE_UP', service: service, autoscaler, cpuUsage })
      }
      if (cpuUsage.cpu < cpuDown * 100) {
        tasks.push({ name: 'SCALE_DOWN', service: service, autoscaler, cpuUsage })
      }
    }
  })

  // console.log('agent, tasks:', tasks.length)

  TASKS = tasks
}

export const calculateCPUUsageOneMinute = (container): CPUUsage => {
  if (DEBUG) console.log('[calculateCPUUsageOneMinute]')

  const { Stats, Id } = container

  if (!CPU_USAGE[Id]) CPU_USAGE[Id] = []

  let cpuPercent = 0.0

  CPU_USAGE[Id].push({
    time: new Date().getTime(),
    usage: Stats.precpu_stats.cpu_usage.total_usage,
    systemUsage: Stats.precpu_stats.system_cpu_usage
  })

  try {
    const cpuDelta = Stats.cpu_stats.cpu_usage.total_usage - CPU_USAGE[Id][0].usage

    const systemDelta = Stats.cpu_stats.system_cpu_usage - CPU_USAGE[Id][0].systemUsage

    if (systemDelta > 0.0 && cpuDelta > 0.0) cpuPercent = (cpuDelta / systemDelta) * Stats.cpu_stats.online_cpus * 100.0

    // 2 time 10 seconds = 20 seconds
    // give the average of 20 second cpu
    if (CPU_USAGE[Id].length > 2) {
      const data = { cpu: cpuPercent, time: new Date().getTime() - CPU_USAGE[Id][0].time }
      CPU_USAGE[Id].shift()
      return data
    }

    return { cpu: -1, time: -1 }
  } catch (error) {
    return { cpu: -1, time: -1 }
  }
}

export const checkAgentsForNewTasks = async () => {
  if (DEBUG) console.log('[checkAgentsForNewTasks]')

  const tasks: { [key: string]: Tasks[] } = {}

  const dns = await agentDNSLookup()
  if (dns.length === 0) return tasks

  const agents: Tasks[][] = await Promise.all(dns.map(addr => fetch(`http://${addr}:9501/tasks`)()))

  // console.log('check tasks', agents?.length)

  agents.forEach(agentTasks => {
    agentTasks.forEach(task => {
      const { service } = task
      if (!tasks[service]) tasks[service] = [task]
      else tasks[service].push(task)
    })
  })

  // first task of first agent
  // console.log(agents[0][0])

  // console.log('tasks', tasks)

  // NOTE:
  // We need a agent quorum to perform a task (> 50%)

  Object.keys(tasks).forEach(async key => {
    // console.log('new tasks', Object.keys(tasks).length)
    const task = tasks[key]

    const scaleUp = task.filter(t => t.name === 'SCALE_UP')
    const scaleDown = task.filter(t => t.name === 'SCALE_DOWN')

    const service: any = await docker(`services/${task[0].service}`)
    const replicas = service?.Spec?.Mode?.Replicated?.Replicas as number

    if (typeof replicas === 'number' && replicas > 0) {
      let ratio

      ratio = scaleUp.length / replicas
      if (ratio - 0.5 > 0) executeTask(service, scaleUp[0])

      ratio = scaleDown.length / replicas
      if (ratio - 0.5 > 0) executeTask(service, scaleDown[0])
    }
  })

  // console.log(service.Spec.Mode.Replicated.Replicas)

  // TODO(yandeu): If some agents request some tasks, process them.
}
