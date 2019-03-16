import { AxiosResponse } from 'axios'
import * as zlip from 'zlib'

/**
 * Unzips a gzip-encoded response.
 *
 * @param response
 */
export function unzipResponse(response: AxiosResponse) {
  return new Promise<Array<any>>(resolve => {
    const unzip = zlip.createGunzip()
    let json = ''
    unzip.on('data', chunk => (json += chunk.toString()))
    unzip.on('end', () => resolve(JSON.parse(json)))
    response.data.pipe(unzip)
  })
}
