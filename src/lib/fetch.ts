/**
 * @author    Yannick Deubel (https://github.com/yandeu)
 * @copyright Copyright (c) 2021 Yannick Deubel
 * @license   {@link https://github.com/yandeu/docker-swarm-visualizer/blob/main/LICENSE LICENSE}
 */

import axios from 'axios'

export const fetch = url => async () => {
  const res = await axios.get(url, { timeout: 10_000 })
  return res.data
}
