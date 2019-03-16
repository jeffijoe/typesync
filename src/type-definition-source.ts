import { ITypeDefinitionSource } from './types'
import axios from 'axios'
import { unzipResponse } from './response-util'

const typedefsUrl =
  'https://typespublisher.blob.core.windows.net/typespublisher/data/search-index-min.json'

/**
 * Used to pull definitions.
 */
export function createTypeDefinitionSource(): ITypeDefinitionSource {
  return {
    /**
     * Fetches available type defs.
     */
    fetch: async () => {
      const data = await axios
        .get(typedefsUrl, {
          responseType: 'stream'
        })
        .then(unzipResponse)

      return data.map((d: any) => ({
        typingsName: d.t
      }))
    }
  }
}
