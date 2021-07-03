/**
 * @author    Yannick Deubel (https://github.com/yandeu)
 * @copyright Copyright (c) 2021 Yannick Deubel
 * @license   {@link https://github.com/yandeu/docker-swarm-visualizer/blob/main/LICENSE LICENSE}
 */

import { request } from 'http'
import { stat, readFile } from 'fs/promises'

/** Check if running on a Docker Container. */
export const isDocker = async () => {
  // https://stackoverflow.com/a/25518345
  const env = (await stat('/.dockerenv').catch(e => {})) ? true : false
  // https://stackoverflow.com/a/20012536
  const group = await ((await readFile('/proc/1/cgroup', 'utf8').catch(e => {})) || ([] as any)).includes('/docker/')

  return env || group
}

// access socket via node.js http
export const docker = (path, method = 'GET', body: any = false) => {
  const options: any = {
    path: '/v1.41/' + path.replace(/^\//, ''),
    method: method
  }

  let postData

  if (body) {
    postData = JSON.stringify(body)
    options.headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  }

  if (process.platform === 'win32') {
    options.socketPath = '\\\\.\\pipe\\docker_engine'
  } else {
    options.socketPath = '/var/run/docker.sock'
  }

  return new Promise((resolve, reject) => {
    var req = request(options, res => {
      var data = ''
      res.on('data', chunk => {
        data += chunk
      })
      res.on('end', () => {
        try {
          const json = JSON.parse(data.toString())
          return resolve(json)
        } catch (error) {
          return resolve(data.toString())
        }
      })
    })
    req.on('error', e => {
      console.log(`problem with request: ${e.message}`)
      console.log(e.stack)
      return reject(e)
    })
    if (postData) req.write(postData)
    req.end()
  })
}

// access socket via curl (node exec)
// export const docker = async api => {
//   try {
//     const cmd = process.platform === 'win32' ? 'wsl curl' : 'curl' // use wsl on windows
//     const res = await exec(`${cmd} --unix-socket /var/run/docker.sock "http://127.0.0.1/v1.41/${api.replace(/^\//, '')}"`)
//     if (res) return JSON.parse(res)
//     return {}
//   } catch (err) {
//     console.log(err.message)
//     return res || {}
//   }
// }
