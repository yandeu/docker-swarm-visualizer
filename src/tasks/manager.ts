/**
 * @author    Yannick Deubel (https://github.com/yandeu)
 * @copyright Copyright (c) 2021 Yannick Deubel
 * @license   {@link https://github.com/yandeu/docker-swarm-visualizer/blob/main/LICENSE LICENSE}
 */

import { Router } from 'express'
import { curlWithCron } from '../lib/cron.js'
import { generateId } from '../lib/misc.js'
import { checkAgentsForNewTasks } from './task.autoscale.js'

const SECRET = generateId()

const router = Router()

let url = ''
let cmd = ''

const TASK_ENABLED = process.env.VISUALIZER_TASK === 'true' ? true : false
console.log(TASK_ENABLED ? '[manager] tasks are enabled' : '[manager] tasks are disabled')

router.get('/checkAgentsForNewTasks', async (req, res) => {
  if (!TASK_ENABLED) return res.send()
  const { secret } = req.query
  if (secret === SECRET) checkAgentsForNewTasks()
  return res.send()
})

router.get('/checkForImageUpdate', async (req, res) => {
  if (!TASK_ENABLED) return res.send()
  const { secret } = req.query
  if (secret === SECRET)
    import('./task.autoupdate.js').then(module => {
      module.checkImageUpdate()
    })
  return res.send()
})

export { router as tasksRouter }

if (TASK_ENABLED) {
  ;(async () => {
    if (process.env.VISUALIZER_TASK_AUTOUPDATE === 'true') {
      let cron = process.env.VISUALIZER_TASK_AUTOUPDATE_CRON
      if (!cron || cron.split(' ').length !== 5) {
        cron = '0 */6 * * *'
        console.log('VISUALIZER_TASK_AUTOUPDATE_CRON is invalid or not present. Fallback to', cron)
      } else {
        console.log('Starting VISUALIZER_TASK_AUTOUPDATE with cron', cron)
      }

      // k// check every agent for new tasks and process/apply them
      url = `http://127.0.0.1:3500/tasks/checkForImageUpdate?secret=${SECRET}`
      cmd = `curl --silent ${url}`
      await curlWithCron({
        url,
        cron: cron,
        interval: -1
      })
    }

    if (process.env.VISUALIZER_TASK_AUTOSCALE === 'true') {
      // k// check every agent for new tasks and process/apply them
      url = `http://127.0.0.1:3500/tasks/checkAgentsForNewTasks?secret=${SECRET}`
      cmd = `curl --silent ${url}`
      await curlWithCron({
        url,
        cron: `* * * * * for i in 0 1 2 3 4; do ${cmd} & sleep 10; done; echo ${cmd}`,
        interval: 10_000
      })
    }
  })()
}
