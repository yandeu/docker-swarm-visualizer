/**
 * @author    Yannick Deubel (https://github.com/yandeu)
 * @copyright Copyright (c) 2021 Yannick Deubel
 * @license   {@link https://github.com/yandeu/docker-swarm-visualizer/blob/main/LICENSE LICENSE}
 */

import { exec } from 'child_process'

export const isAlpine = async (): Promise<boolean> => {
  return new Promise(resolve => {
    exec('cat /etc/alpine-release', (error, stdout, stderr) => {
      if (error) return resolve(false)
      return resolve(true)
    })
  })
}
