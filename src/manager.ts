/**
 * @author    Yannick Deubel (https://github.com/yandeu)
 * @copyright Copyright (c) 2021 Yannick Deubel
 * @license   {@link https://github.com/yandeu/docker-swarm-visualizer/blob/main/LICENSE LICENSE}
 */

import express from 'express'
import { nodesInfo, systemDF, containerStats } from './lib/api.js'
import { fetch } from './lib/fetch.js'
import { resolve, join } from 'path'
import bodyParser from 'body-parser'

const app = express()
const port = process.env.PORT || 3500

app.use(bodyParser.json())

import axios from 'axios'
import { agentDNSLookup } from './lib/dns.js'
import { exec } from './lib/exec.js'

// tasks (beta)
import './tasks/manager.js'
import { tasksRouter } from './tasks/manager.js'
app.use('/tasks', tasksRouter)

app.use(express.static(join(resolve(), 'dist/www'), { extensions: ['html'] }))

const deployStack = async (name: string, stack: string) => {
  try {
    stack = stack.replace(/'/gm, '"')

    const reg = /^(\S*?)\.?stack\.?(\S*?)\.ya?ml$/

    const arr = reg.exec(name)
    if (!arr) throw new Error('Invalid stack name')

    name = arr[1] || arr[2]
    if (!name) throw new Error('Invalid stack name')

    // while developing on windows
    const cmd = ` printf '${stack}' | docker stack deploy --compose-file - ${name}`
    const result = await exec(cmd)

    return { status: 200, msg: result }
  } catch (error: any) {
    return { status: 400, msg: error.message }
  }
}

const createSecret = async (name: string, secret: string) => {
  try {
    const reg = /^(\S+)(\.txt|\.json)$/

    const arr = reg.exec(name)
    if (!arr) throw new Error('Secret has to be a .txt or .json file')

    name = arr[1]
    if (!name) throw new Error('Secret has to be a .txt or .json file')

    const result = await exec(` printf '${secret}' | docker secret create ${name} -`)

    return { status: 200, msg: result }
  } catch (error: any) {
    return { status: 400, msg: error.message }
  }
}

app.post('/upload', async (req, res) => {
  console.log('UPLOAD')

  let { name, stack, secret } = req.body as { name: string; stack: string; secret: string }
  if (/\.ya?ml$/.test(name)) {
    const s = await deployStack(name, stack)
    return res.status(s.status).json(s)
  } else if (/\.txt$|\.json$/.test(name)) {
    const s = await createSecret(name, secret)
    return res.status(s.status).json(s)
  } else return res.status(400).json({ msg: 'Bad Request', status: 400 })
})

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
  } catch (error: any) {
    res.status(500).send(error.message)
  }
})

app.get('/api/dev/system/df', async (req, res) => {
  const system = await systemDF()
  try {
    return res.json(system)
  } catch (err: any) {
    return res.status(500).send(err.message)
  }
})

app.get('/api/dev/nodes', async (req, res) => {
  const nodes = await nodesInfo()
  try {
    return res.json(nodes)
  } catch (err: any) {
    return res.status(500).send(err.message)
  }
})

app.get('/api/dev/agents/dns', async (req, res) => {
  try {
    const dns = await agentDNSLookup()
    return res.json(dns)
  } catch (err: any) {
    return res.status(500).send(err.message)
  }
})

app.get('/api/dev/container/:hash', async (req, res) => {
  try {
    const { hash } = req.params
    const _container = await containerStats(hash)
    return res.json(_container)
  } catch (err: any) {
    return res.status(500).send(err.message)
  }
})

app.get('/api/dev/:node/info', async (req, res) => {
  try {
    const { node } = req.params
    const result = await fetch(`http://${node}:9501/info`)()
    return res.json(result)
  } catch (err: any) {
    return res.status(500).send(err.message)
  }
})

app.get('/api/dev/:node/containers', async (req, res) => {
  try {
    const { node } = req.params
    const result = await fetch(`http://${node}:9501/containers`)()
    return res.json(result)
  } catch (err: any) {
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
  } catch (err: any) {
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
