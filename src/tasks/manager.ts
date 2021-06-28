/**
 * @author    Yannick Deubel (https://github.com/yandeu)
 * @copyright Copyright (c) 2021 Yannick Deubel
 * @license   {@link https://github.com/yandeu/docker-swarm-visualizer/blob/main/LICENSE LICENSE}
 */

import { checkAgentsForNewTasks } from './tasks.js'

// check every agent for new tasks and process/apply them
setInterval(checkAgentsForNewTasks, 10_000)
