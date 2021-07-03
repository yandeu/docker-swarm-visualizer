/**
 * @author    Yannick Deubel (https://github.com/yandeu)
 * @copyright Copyright (c) 2021 Yannick Deubel
 * @license   {@link https://github.com/yandeu/docker-swarm-visualizer/blob/main/LICENSE LICENSE}
 */

import axios from 'axios'

// echo -n 'username:password' | base64
// hub.docker.io:hub.docker.io
// github.com:GITHUB_ACCESS_TOKEN

// enter auth without keeping in history
// read: https://stackoverflow.com/a/8473153/12656855
//  printf "This is a secret" | docker secret create my_secret_data -
//  echo -n 'username:password' | base64 | docker secret create visualizer_registry_login -

/** GitHub without Auth */
// registry = new Registry('GITHUB')

/** GitHub with Auth */
// registry = new Registry('GITHUB', 'dXNlcm5hbWU6cGFzc3dvcmQ=')

/** Docker without Auth */
// registry = new Registry(REGISTRY)

/** Docker with Auth */
// registry = new Registry(REGISTRY, 'dXNlcm5hbWU6cGFzc3dvcmQ=')

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

const catchme = e => console.log(e.message)
const btoa = data => Buffer.from(data).toString('base64')

export class Registry {
  images: any[] = []
  BASIC_AUTH: string

  constructor(public REGISTRY, AUTH = '') {
    this.BASIC_AUTH = 'Basic ' + AUTH
  }

  requestImage(IMAGE, TAG = 'latest') {
    this.images.push({ IMAGE, TAG })
    return this
  }

  async getDigest(auth) {
    const { token, access_token } = auth.data

    const img = this.images[0]
    const res = await axios
      .head(`${CONFIG[this.REGISTRY].REGISTRY_URL}/${img.IMAGE}/manifests/${img.TAG}`, {
        headers: {
          Authorization: `Bearer ${access_token ?? token}`,
          Accept: 'application/vnd.docker.distribution.manifest.v2+json'
        }
      })
      .catch(e => console.log(e.message))

    if (res) return res.headers['docker-content-digest']
  }

  async Auth() {
    const withCredentials = this.BASIC_AUTH.length > 6
    if (this.REGISTRY === 'DOCKER') return await this.DockerAuth(withCredentials)
    if (this.REGISTRY === 'GITHUB') return await this.GithubAuth(withCredentials)
  }

  async DockerAuth(withCredentials) {
    let query = `?service=${CONFIG.DOCKER.SERVICE}&scope=`
    this.images.forEach(image => (query += `repository:${image.IMAGE}:pull`))
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
    let query = `?service=${CONFIG.GITHUB.SERVICE}&scope=`
    this.images.forEach(image => (query += `repository:${image.IMAGE}:pull `))
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
