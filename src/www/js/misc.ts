/**
 * @author    Yannick Deubel (https://github.com/yandeu)
 * @copyright Copyright (c) 2021 Yannick Deubel
 * @license   {@link https://github.com/yandeu/docker-swarm-visualizer/blob/main/LICENSE LICENSE}
 */

export const toPercent = value => {
  return (value * 100).toFixed(2) + '%'
}

export const toMb = value => {
  return Math.round(value / 1000 / 1000)
}

export const toMiB = value => {
  return Math.round(value / 1024 / 1024)
}

export const toGb = value => {
  return (value / 1000 / 1000 / 1000).toFixed(3)
}

export const toGiB = value => {
  return (value / 1024 / 1024 / 1024).toFixed(3)
}

export const ipToId = id => {
  return id.replace(/\./gm, '-')
}

export const addOrangeCircle = ip => {
  const id = ipToId(ip)

  const nodeHTML = document.getElementById(id)
  if (!nodeHTML) return

  const circle = nodeHTML.querySelector('.circle')
  if (!circle) return

  circle.classList.remove('blink')
  circle.classList.replace('yellow', 'orange')
}

export const calculateCPUUsage = Stats => {
  //
  // https://github.com/moby/moby/blob/eb131c5383db8cac633919f82abad86c99bffbe5/cli/command/container/stats_helpers.go#L175-L188
  // https://stackoverflow.com/questions/35692667/in-docker-cpu-usage-calculation-what-are-totalusage-systemusage-percpuusage-a

  let cpuPercent = 0.0

  try {
    const cpuDelta = Stats.cpu_stats.cpu_usage.total_usage - Stats.precpu_stats.cpu_usage.total_usage

    const systemDelta = Stats.cpu_stats.system_cpu_usage - Stats.precpu_stats.system_cpu_usage

    if (systemDelta > 0.0 && cpuDelta > 0.0) cpuPercent = (cpuDelta / systemDelta) * Stats.cpu_stats.online_cpus * 100.0

    return cpuPercent.toFixed(0) + '%'
  } catch (error) {
    return cpuPercent.toFixed(0) + '%'
  }
}
