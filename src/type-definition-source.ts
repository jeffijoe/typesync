import { ITypeDefinitionSource } from './types'
import axios, { AxiosResponse } from 'axios'
import { typed } from './util'
import * as zlip from 'zlib'

const typedefsUrl = 'https://typespublisher.blob.core.windows.net/typespublisher/data/search-index-min.json'

const npmClient = axios.create({
  baseURL: 'https://registry.npmjs.org'
})

export function createTypeDefinitionSource(): ITypeDefinitionSource {
  return {
    fetch: () => {
      return axios
        .get(typedefsUrl, {
          responseType: 'stream'
        })
        .then(unzipResponse)
        .then(data =>
          data.map((d: any) => ({
            typingsName: d.t
          }))
        )
    },
    getLatestTypingsVersion: (typingsPackageName: string) => {
      return npmClient
        .get(`${typed(typingsPackageName, true)}`)
        .then(r => r.data['dist-tags'].latest)
    }
  }
}

function unzipResponse(response: AxiosResponse) {
  return new Promise<Array<any>>(resolve => {
    const unzip = zlip.createGunzip()
    let json = ''
    unzip.on('data', chunk => (json += chunk.toString()))
    unzip.on('end', () => resolve(JSON.parse(json)))
    response.data.pipe(unzip)
  })
}
