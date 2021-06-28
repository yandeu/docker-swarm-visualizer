import { readFile, writeFile } from 'fs/promises'
import { exec } from 'child_process'
import { isDocker } from './docker'

const cronRoot = '/var/spool/cron/crontabs/root'

export const startCrond = async (): Promise<boolean> => {
  // start crond in background
  return new Promise((resolve, reject) => {
    exec('crond', (error, stdout, stderr) => {
      if (error) return reject(false)
      return resolve(true)
    })
  })
}

export const addCronJob = async (job: string) => {
  if (!job) job = '* * * * * for i in 0 1 2; do echo "test" & sleep 15; done; echo "test"'

  const file = await readFile(cronRoot, { encoding: 'utf-8' })

  // let job = '* * * * * echo "test"'
  for (let i = 0; i < 5; i++) {
    job = job.replace(' ', '\t')
  }

  const updatedFile = file.split('\n').concat(job).join('\n')

  await writeFile(cronRoot, updatedFile, { encoding: 'utf-8' })
}
