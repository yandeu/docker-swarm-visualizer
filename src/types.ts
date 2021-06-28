/** The Internal IP of a Agent. */
export type DNS = string

/** The name of a Docker Service. */
export type ServiceName = string

export interface CPUUsage {
  cpu: number
  time: number
}

export interface AutoscalerSettings {
  min: number
  max: number
  up: { cpu: number }
  down: { cpu: number }
}

export interface Tasks {
  /** For what Service is this task. */
  service: ServiceName
  /** What is the task?  */
  name: 'SCALE_UP' | 'SCALE_DOWN'
  /** Current CPU usage. */
  cpuUsage: CPUUsage
  /** Autoscaler options (if available). */
  autoscaler?: AutoscalerSettings
}
