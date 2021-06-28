import type { DNS } from '../types.js'

import dns from 'dns'

export const agentDNSLookup = (): Promise<DNS[]> => {
  // We send ['127.0.0.1'] when we (most probably) are developing the app locally.

  return new Promise(resolve => {
    dns.lookup('tasks.agent', { all: true }, (err, addresses, family) => {
      if (addresses) {
        const addr = addresses.map(a => a.address)
        return resolve(addr.length > 0 ? addr : ['127.0.0.1'])
      }
      return resolve(['127.0.0.1'])
    })
  })
}
