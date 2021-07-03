import { docker } from '../dist/lib/docker.js'
import { executeTask } from '../dist/tasks/task.autoscale.js'

const serviceID = 'oqjuq4qzfmw9'

const service = await docker(`services/${serviceID}`)
const replicas = service?.Spec?.Mode?.Replicated?.Replicas

if (typeof replicas === 'number' && replicas > 0) {
  let ratio

  ratio = 1
  if (ratio - 0.5 > 0) executeTask(service, { name: 'SCALE_UP', autoscaler: { min: 1, max: 20 } })
}
