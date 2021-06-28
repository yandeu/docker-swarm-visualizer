/**
 * @author    Yannick Deubel (https://github.com/yandeu)
 * @copyright Copyright (c) 2021 Yannick Deubel
 * @license   {@link https://github.com/yandeu/docker-swarm-visualizer/blob/main/LICENSE LICENSE}
 */

import { exec as _exec, spawn } from 'child_process'

export const exec = cmd => {
  return new Promise((resolve, reject) => {
    _exec(`${cmd}`, (err, stdout, stderr) => {
      if (err) {
        return reject(err)
      }
      return resolve(stdout)
    })
  })
}
