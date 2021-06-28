import axios from 'axios'
import { exec } from './dist/lib/exec.js'
import { docker } from './dist/lib/docker.js'


const catchme = (e => console.log(e.message))
const btoa = data => Buffer.from(data).toString('base64')


// echo -n 'username:password' | base64
// hub.docker.io:hub.docker.io
// github.com:GITHUB_ACCESS_TOKEN

const CONFIG = {
  DOCKER: {
    AUTH_URL: `https://auth.docker.io/token`,
    SERVICE: 'registry.docker.io',
    REGISTRY_URL: 'https://index.docker.io/v2'
  },
  GITHUB: {
    AUTH_URL: `https://ghcr.io/token`,
    SERVICE: 'ghcr.io',
    REGISTRY_URL: 'https://ghcr.io/v2'
  }
}



export class Registry {

  images = []

  /**
   * 
   * @param REGISTRY 'DOCKER' | 'GITHUB'
   * @param USERNAME echo -n 'username:password' | base64
   */
  constructor(REGISTRY, AUTH = '') {
    this.REGISTRY = REGISTRY
    this.BASIC_AUTH = 'Basic ' + AUTH
  }



  Image(IMAGE, TAG = 'latest') {
    this.images.push({ IMAGE, TAG })
    return this
  }


  /**
   * 
   * @param IMAGE 'library/ubuntu'
   * @param TAG 'latest'
   */
  async Digests(auth) {

    const { token, access_token } = auth.data

    const digests = []

    for (const img of this.images) {
      const image = await axios
        .get(`${CONFIG[this.REGISTRY].REGISTRY_URL}/${img.IMAGE}/manifests/${img.TAG}`, {
          headers: {
            Authorization: `Bearer ${access_token ?? token}`,
            Accept: 'application/vnd.docker.distribution.manifest.v2+json'
          }
        })
        .catch(e => console.log(e.message))

      digests.push({ digest: image.data.config.digest, image: img.IMAGE, tag: img.TAG })
    }

    return digests
  }

  async Auth() {
    const withCredentials = this.BASIC_AUTH.length > 6
    if (this.REGISTRY === 'DOCKER') return await this.DockerAuth(withCredentials)
    if (this.REGISTRY === 'GITHUB') return await this.GithubAuth(withCredentials)
  }

  async DockerAuth(withCredentials) {


    // TODO(yandeu): I guess, I should limit the length of the get request
    let query = `?service=${CONFIG.DOCKER.SERVICE}&scope=`
    this.images.forEach(image => query += `repository:${image.IMAGE}:pull`)
    const url = `${CONFIG.DOCKER.AUTH_URL}${query}`

    // console.log('withCredentials', withCredentials)
    // console.log('url', url)

    if (!withCredentials) return await axios.get(url).catch(catchme)

    return await axios
      .get(url, {
        headers: {
          Authorization: this.BASIC_AUTH
        }
      })
      .catch(catchme)

    // const params = new URLSearchParams()
    // params.append('grant_type', 'password')
    // params.append('service', CONFIG.DOCKER.SERVICE)
    // params.append('scope', `repository:${this.IMAGE}:pull`)
    // params.append('client_id', 'test')
    // params.append('username', this.USERNAME)
    // params.append('password', this.PASSWORD)
    // return await axios.post(CONFIG.DOCKER.AUTH_URL, params, {
    //   headers: {
    //     'Content-Type': 'application/x-www-form-urlencoded'
    //   }
    // }).catch(catchme)

  }

  Clear() {
    this.images = []
  }

  async GithubAuth(withCredentials) {

    // TODO(yandeu): I guess, I should limit the length of the get request
    let query = `?service=${CONFIG.GITHUB.SERVICE}&scope=`
    this.images.forEach(image => query += `repository:${image.IMAGE}:pull `)
    const url = `${CONFIG.GITHUB.AUTH_URL}${query}`


    if (!withCredentials) return await axios.get(url).catch(catchme)

    return await axios
      .get(url, {
        headers: {
          Authorization: this.BASIC_AUTH
        }
      })
      .catch(catchme)
  }
}




const main = async () => {

  let registry
  let digest = ''
  let digests = []
  let auth = {}



  // get id of local image (digest)
  const image = await docker('/images/library/ubuntu:latest/json').catch(catchme)
  console.log(image.Id) // this is the digest


  // get digest of remove images
  registry = new Registry('DOCKER')
  registry.Image('library/ubuntu')
  auth = await registry.Auth()
  digests = await registry.Digests(auth)
  registry.Clear()
  console.log('digests', digests)


  /** GitHub without Auth */
  // registry = new Registry('GITHUB')

  /** GitHub with Auth */
  // registry = new Registry('GITHUB', 'dXNlcm5hbWU6cGFzc3dvcmQ=')

  /** Docker without Auth */
  // registry = new Registry('DOCKER')

  /** Docker with Auth */
  // registry = new Registry('DOCKER', 'dXNlcm5hbWU6cGFzc3dvcmQ=')



  /** FORCE UPDATE SERVICE (if needed) */
  // const serviceId = 'oqjuq4qzfmw9'
  // // get service
  // const Service = await docker(`/services/${serviceId}`).catch(catchme)
  // if (Service) {
  //   console.log('Updating', serviceId)
  //   // set force update (See: https://github.com/docker/cli/blob/8e08b72450719baed03eed0e0713aae885315bac/cli/command/service/update.go#L490)
  //   Service.Spec.TaskTemplate.ForceUpdate++
  //   // update service
  //   await docker(`/services/${serviceId}/update?version=${Service.Version.Index}`, 'POST', Service.Spec).catch(catchme)
  // }

}

main()
