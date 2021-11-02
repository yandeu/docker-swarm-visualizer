/**
 * @author    Yannick Deubel (https://github.com/yandeu)
 * @copyright Copyright (c) 2021 Yannick Deubel
 * @license   {@link https://github.com/yandeu/docker-swarm-visualizer/blob/main/LICENSE LICENSE}
 */

import { DNS } from '../../types'

const agentsDns = async (): Promise<DNS[]> => {
  try {
    const url = '/api/dev/agents/dns'
    const res = await fetch(url)
    const json = await res.json()
    return json
  } catch (err: any) {
    console.error(err.message)
    return []
  }
}

const nodes = async () => {
  try {
    const url = '/api/dev/nodes'
    const res = await fetch(url)
    const json = await res.json()
    return json
  } catch (err: any) {
    console.error(err.message)
    return null
  }
}

const info = async ip => {
  try {
    const url = `/api/dev/${ip}/info`
    const res = await fetch(url)
    const json = await res.json()
    return json
  } catch (err: any) {
    console.error(err.message)
    return null
  }
}

const containers = async ip => {
  try {
    const url = `/api/dev/${ip}/containers`
    const res = await fetch(url)
    const json = await res.json()
    return json
  } catch (err: any) {
    console.error(err.message)
    return null
  }
}

export const get = {
  agentsDns,
  containers,
  nodes,
  info
}
