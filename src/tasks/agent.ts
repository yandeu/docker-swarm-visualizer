/**
 * @author    Yannick Deubel (https://github.com/yandeu)
 * @copyright Copyright (c) 2021 Yannick Deubel
 * @license   {@link https://github.com/yandeu/docker-swarm-visualizer/blob/main/LICENSE LICENSE}
 */

import { Router } from 'express'
import { curlWithCron } from '../lib/cron.js'
import { generateId } from '../lib/misc.js'
import { checkContainersForTasks, gaterInformationForContainerTasks } from './tasks.js'
import { getTasks } from './tasks.js'

const SECRET = generateId()

const router = Router()
export { router as tasksRouter }

let url = ''
let cmd = ''

// at startup
setTimeout(checkContainersForTasks, 1_000)

/** the tasks this node wishes to perform */
router.get('/', (req, res) => {
  return res.json(getTasks())
})

router.get('/checkContainersForTasks', async (req, res) => {
  // console.log('[agent] checkContainersForTasks')
  const { secret } = req.query
  if (secret === SECRET) checkContainersForTasks()
  return res.send()
})

router.get('/gaterInformationForContainerTasks', async (req, res) => {
  // console.log('[agent] gaterInformationForContainerTasks')
  const { secret } = req.query
  if (secret === SECRET) gaterInformationForContainerTasks()
  return res.send()
})

const main = async () => {
  // keep track which containers have tasks
  url = `http://127.0.0.1:9501/tasks/checkContainersForTasks?secret=${SECRET}`
  cmd = `curl --silent ${url}`
  await curlWithCron({ url, cron: `* * * * * ${cmd}`, interval: 60_000 })

  // collect and process tasks from containers
  url = `http://127.0.0.1:9501/tasks/gaterInformationForContainerTasks?secret=${SECRET}`
  cmd = `curl --silent ${url}`
  await curlWithCron({
    url,
    cron: `* * * * * for i in 0 1 2; do ${cmd} & sleep 15; done; echo ${cmd}`,
    interval: 15_000
  })
}

main()
