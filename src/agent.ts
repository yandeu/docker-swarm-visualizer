/**
 * @author    Yannick Deubel (https://github.com/yandeu)
 * @copyright Copyright (c) 2021 Yannick Deubel
 * @license   {@link https://github.com/yandeu/docker-swarm-visualizer/blob/main/LICENSE LICENSE}
 */

import express from 'express'
import { containers, info, containerRemove, container, containerStats } from './lib/api.js'
const app = express()
const port = process.env.PORT || 9501

// tasks (beta)
import './tasks/agent.js'
import { tasksRouter } from './tasks/agent.js'
app.use('/tasks', tasksRouter)

app.get('/', async (req, res) => {
  const _containers = await containers()
  const _info = await info()
  const doc = { info: _info, containers: _containers }
  res.json(doc)
})

app.get('/info', async (req, res) => {
  const _info = await info()
  res.json(_info)
})

app.get('/containers', async (req, res) => {
  const _containers = await containers()

  // remove what we do not need (for now)
  _containers.forEach(container => {
    ;['Command', 'HostConfig', 'Image', 'ImageID', 'Mounts', 'NetworkSettings', 'Ports'].forEach(key => {
      delete container[key]
    })

    // if the container includes Stats, remove what we do yet need
    if (container.Stats) {
      ;['blkio_stats', 'id', 'name', 'networks', 'num_procs', 'pids_stats', 'preread', 'read', 'storage_stats'].forEach(
        key => {
          delete container.Stats[key]
        }
      )
    }
  })

  res.json(_containers)
})

app.delete('/containers/:id', async (req, res) => {
  try {
    const { id } = req.params

    // you can only delete containers that are not running
    const _container: any = await container(id)
    if (_container.State.Status === 'running') throw new Error('Container is still running.')

    const json = await containerRemove(id)
    res.send(json)
  } catch (error: any) {
    res.status(500).send(error.message)
  }
})

app.get('/healthcheck', (req, res) => {
  res.send('OK')
})

app.get('*', (req, res) => {
  return res.status(404).send('nothing here')
})

app.listen(port, () => {
  console.log(`[agent] listening at http://127.0.0.1:${port}`)
})
