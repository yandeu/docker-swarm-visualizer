/**
 * @author    Yannick Deubel (https://github.com/yandeu)
 * @copyright Copyright (c) 2021 Yannick Deubel
 * @license   {@link https://github.com/yandeu/docker-swarm-visualizer/blob/main/LICENSE LICENSE}
 */

import { Router } from 'express'
import { curlWithCron } from '../lib/cron.js'
import { generateId } from '../lib/misc.js'
import { checkContainersForTasks, gaterInformationForContainerTasks } from './task.autoscale.js'
import { getTasks } from './task.autoscale.js'

const SECRET = generateId()

const router = Router()

let url = ''
let cmd = ''

const TASK_ENABLED = process.env.VISUALIZER_TASK === 'true' ? true : false
console.log(TASK_ENABLED ? '[agent] tasks are enabled' : '[agent] tasks are disabled')

// at startup
if (TASK_ENABLED) setTimeout(checkContainersForTasks, 5_000)

/** the tasks this node wishes to perform */
router.get('/', (req, res) => {
  if (!TASK_ENABLED) return res.json([])
  return res.json(getTasks())
})

router.get('/checkContainersForTasks', async (req, res) => {
  if (!TASK_ENABLED) return res.send()
  const { secret } = req.query
  if (secret === SECRET) checkContainersForTasks()
  return res.send()
})

router.get('/gaterInformationForContainerTasks', async (req, res) => {
  if (!TASK_ENABLED) return res.send()
  const { secret } = req.query
  if (secret === SECRET) gaterInformationForContainerTasks()
  return res.send()
})

export { router as tasksRouter }

if (TASK_ENABLED) {
  ;(async () => {
    if (process.env.VISUALIZER_TASK_SUBNET === 'true') {
      import('./task.subnet.js')
        .then(module => {
          console.log('[agent] task.subnet.js loaded')
          module.addSubnetLabel().catch(err => {
            console.log('[agent] Something went wrong in [addSubnetLabel()]: ', err.message)
          })
        })
        .catch(err => {
          console.log('[agent] task.subnet.js failed', err.message)
        })
    }

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
  })()
}
