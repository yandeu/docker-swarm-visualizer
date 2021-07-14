import { Registry } from '../dist/lib/registry.js'

const image = 'library/ubuntu'

const registry = new Registry('DOCKER')

await registry.requestImage(image)

const auth = await registry.Auth()

console.log(await registry.getDigest(auth))
console.log(await registry.getManifest(auth))
console.log(await registry.get(auth, `${image}/tags/list`))
