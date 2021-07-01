/**
 * @author    Yannick Deubel (https://github.com/yandeu)
 * @copyright Copyright (c) 2021 Yannick Deubel
 * @license   {@link https://github.com/yandeu/docker-swarm-visualizer/blob/main/LICENSE LICENSE}
 */

import { Router } from 'express'
import { curlWithCron } from '../lib/cron.js'
import { generateId } from '../lib/misc.js'
import { checkAgentsForNewTasks } from './tasks.js'

const SECRET = generateId()

const router = Router()
export { router as tasksRouter }

let url = ''
let cmd = ''

router.get('/checkAgentsForNewTasks', async (req, res) => {
  // console.log('[manager] checkAgentsForNewTasks')
  const { secret } = req.query
  if (secret === SECRET) checkAgentsForNewTasks()
  return res.send()
})

const main = async () => {
  // k// check every agent for new tasks and process/apply them
  url = `http://127.0.0.1:3500/tasks/checkAgentsForNewTasks?secret=${SECRET}`
  cmd = `curl --silent ${url}`
  await curlWithCron({
    url,
    cron: `* * * * * for i in 0 1 2 3 4; do ${cmd} & sleep 10; done; echo ${cmd}`,
    interval: 10_000
  })
}

main()
