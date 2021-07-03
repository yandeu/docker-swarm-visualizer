import { readFile, writeFile } from 'fs/promises'
import { exec } from 'child_process'
import { isDocker } from './docker.js'
import { fetch } from './fetch.js'
import { isAlpine } from './alpine.js'

const cronRoot = '/var/spool/cron/crontabs/root'

export const shouldUseCrone = async () => {
  return (await isDocker()) && (await isAlpine()) && (await startCrond())
}

const startCrond = async (): Promise<boolean> => {
  // start crond in background
  return new Promise(resolve => {
    exec('crond', (error, stdout, stderr) => {
      if (error) return resolve(false)
      return resolve(true)
    })
  })
}

const addCronJob = async (job: string) => {
  if (!job) job = '* * * * * for i in 0 1 2; do echo "test" & sleep 15; done; echo "test"'

  const file = await readFile(cronRoot, { encoding: 'utf-8' })

  // let job = '* * * * * echo "test"'
  for (let i = 0; i < 5; i++) {
    job = job.replace(' ', '\t')
  }

  const updatedFile = file.split('\n').concat(job).join('\n')

  await writeFile(cronRoot, updatedFile, { encoding: 'utf-8' })
}

// @ts-ignore
const USE_CRON = await shouldUseCrone()
console.log('USE_CRON', USE_CRON)

export interface CurlWithCronOptions {
  url: string
  cron: string
  interval: number
}

/** Add a Cron Job to cURL a url (fallback to setInterval() for local development) */
export const curlWithCron = async (options: CurlWithCronOptions) => {
  const { url, cron, interval } = options

  if (USE_CRON) await addCronJob(cron)
  else if (typeof interval === 'number' && interval > 0) setInterval(fetch(url), interval)
}
