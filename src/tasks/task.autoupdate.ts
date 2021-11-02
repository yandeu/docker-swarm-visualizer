/**
 * @author    Yannick Deubel (https://github.com/yandeu)
 * @copyright Copyright (c) 2021 Yannick Deubel
 * @license   {@link https://github.com/yandeu/docker-swarm-visualizer/blob/main/LICENSE LICENSE}
 */

import { services as getServices, serviceUpdateImage, Image } from '../lib/api.js'
import { Registry } from '../lib/registry.js'

export const checkImageUpdate = async () => {
  const tmp = await getServices()
  if (!tmp) return

  const AUTOUPDATE_LABEL = 'visualizer.autoupdate'

  const services = tmp
    .map(s => ({
      ID: s.ID,
      Labels: s.Spec.TaskTemplate.ContainerSpec.Labels,
      Image: s.Spec.TaskTemplate.ContainerSpec.Image
    }))
    .filter(s => {
      return (
        s.Labels &&
        Object.keys(s.Labels).some(key => new RegExp(AUTOUPDATE_LABEL).test(key)) &&
        s.Labels[AUTOUPDATE_LABEL] === 'true'
      )
    })

  for (const service of services) {
    try {
      const { Image, ID } = service

      // TODO(yandeu): Let the user chose which registry and the auth
      const REGISTRY = 'DOCKER' // or 'GITHUB'

      // parse local digest
      const [_, IMG, TAG, localDigest] = /([\w\/-]+):([\w-]+)@(sha256:.+)/.exec(Image) as any
      const IMAGE = /\//.test(IMG) ? IMG : `library/${IMG}`

      // get digest of remote images
      const registry = new Registry(REGISTRY)
      console.log(IMAGE, TAG)
      registry.requestImage(IMAGE, TAG)
      const auth = await registry.Auth()
      const remoteDigest = await registry.getDigest(auth)
      registry.Clear()

      // check if digest of remote image is different from the local one
      // console.log({ localDigest, remoteDigest })
      if (localDigest && remoteDigest && localDigest !== remoteDigest) serviceUpdateImage(ID, IMAGE, TAG, remoteDigest)
    } catch (error: any) {
      console.log('Error while autoupdate', error.message)
    }
  }
}
