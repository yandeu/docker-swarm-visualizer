/**
 * @author    Yannick Deubel (https://github.com/yandeu)
 * @copyright Copyright (c) 2021 Yannick Deubel
 * @license   {@link https://github.com/yandeu/docker-swarm-visualizer/blob/main/LICENSE LICENSE}
 */

import { exec } from 'child_process'

import pkg from 'node-os-utils'
const { mem, cpu } = pkg

export const generateId = () => Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2)

// node-os-utils: examples
// console.log('cors:', cpu.count(), 'CPU%', await cpu.usage())
// const memory = await mem.used()
// console.log(memory, 'MEM%', ~~((memory.usedMemMb / memory.totalMemMb) * 100))

/** Does obviously not work on Windows. */
export const diskUsage = () => {
  return new Promise((resolve, reject) => {
    exec('df -h', (error, stdout, stderr) => {
      if (error) return resolve({})

      const mountedOnRoot = stdout.split('\n').filter(l => /\s\/$/.test(l))[0]
      const match: any = mountedOnRoot.match(/[0-9]+\.?[0-9]*\S?/gm)

      if (match.length !== 4) return resolve({})

      const result = { Size: match[0], Used: match[1], Available: match[2], Percent: match[3] }

      return resolve(result)
    })
  })
}

export const memUsage = async () => {
  const memory = await mem.used()
  return ~~((memory.usedMemMb / memory.totalMemMb) * 100)
}

export const cpuCount = () => {
  return cpu.count()
}

export const cpuUsage = async () => {
  return await cpu.usage()
}
