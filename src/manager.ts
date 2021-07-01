/**
 * @author    Yannick Deubel (https://github.com/yandeu)
 * @copyright Copyright (c) 2021 Yannick Deubel
 * @license   {@link https://github.com/yandeu/docker-swarm-visualizer/blob/main/LICENSE LICENSE}
 */

import express from 'express'
import { nodesInfo, systemDF, containerStats } from './lib/api.js'
import { fetch } from './lib/fetch.js'
import { resolve, join } from 'path'

const app = express()
const port = process.env.PORT || 3500

import axios from 'axios'
import { agentDNSLookup } from './lib/dns.js'

// tasks (beta)
import { tasksRouter } from './tasks/manager.js'
const tasks = process.env.TASKS
setTimeout(() => console.log(tasks ? '[manager] tasks are enabled' : '[manager] tasks are disabled'))
if (tasks === 'true') setTimeout(() => import('./tasks/manager.js'))
app.use('/tasks', tasksRouter)

app.use(express.static(join(resolve(), 'dist/www'), { extensions: ['html'] }))

app.get('/api', (req, res) => {
  const routes = app._router.stack
    .filter(layer => typeof layer.route != 'undefined' && layer.route)
    .map(layer => ({ path: layer.route.path, methods: Object.keys(layer.route.methods) }))
    .filter(route => route.path !== '/api' && route.path !== '*')
    .sort((a, b) => {
      if (a.path < b.path) return -1
      if (a.path > b.path) return 1
      return 0
    })

  const json = JSON.stringify(routes, null, 2)

  res.send(`<pre><code>${json}</code></pre>`)
})

app.delete('/api/dev/agent/:ip/containers/:id', async (req, res) => {
  try {
    const { ip, id } = req.params
    const response = await axios.delete(`http://${ip}:9501/containers/${id}`)
    res.send(response.data)
  } catch (error) {
    res.status(500).send(error.message)
  }
})

app.get('/api/dev/system/df', async (req, res) => {
  const system = await systemDF()
  try {
    return res.json(system)
  } catch (err) {
    return res.status(500).send(err.message)
  }
})

app.get('/api/dev/nodes', async (req, res) => {
  const nodes = await nodesInfo()
  try {
    return res.json(nodes)
  } catch (err) {
    return res.status(500).send(err.message)
  }
})

app.get('/api/dev/agents/dns', async (req, res) => {
  try {
    const dns = await agentDNSLookup()
    return res.json(dns)
  } catch (err) {
    return res.status(500).send(err.message)
  }
})

app.get('/api/dev/container/:hash', async (req, res) => {
  try {
    const { hash } = req.params
    const _container = await containerStats(hash)
    return res.json(_container)
  } catch (err) {
    return res.status(500).send(err.message)
  }
})

app.get('/api/dev/:node/info', async (req, res) => {
  try {
    const { node } = req.params
    const result = await fetch(`http://${node}:9501/info`)()
    return res.json(result)
  } catch (err) {
    return res.status(500).send(err.message)
  }
})

app.get('/api/dev/:node/containers', async (req, res) => {
  try {
    const { node } = req.params
    const result = await fetch(`http://${node}:9501/containers`)()
    return res.json(result)
  } catch (err) {
    return res.status(500).send(err.message)
  }
})

app.get('/api/dev', async (req, res) => {
  const nodes = await nodesInfo()
  const addrs = nodes.map(n => n.Addr)

  const promises: any[] = []

  addrs.forEach(addr => promises.push(fetch(`http://${addr}:9501/`)()))

  try {
    const results = await Promise.allSettled(promises)
    return res.json({ nodes, results })
  } catch (err) {
    return res.status(500).send(err.message)
  }
})

app.get('/healthcheck', (req, res) => {
  res.send('OK')
})

app.get('*', (req, res) => {
  return res.status(404).send('nothing here')
})

app.listen(port, () => {
  console.log(`[manager] listening at http://127.0.0.1:${port}`)
})
