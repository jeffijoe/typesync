import { ITypeDefinitionSource, ITypeDefinition } from './types'
import axios from 'axios'

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
          timeout: 60000,
          timeoutErrorMessage:
            'Timed out while trying to fetch the type definitions.',
        })
        .then((x) => x.data as any[])

      /* istanbul ignore next */
      if (!Array.isArray(data)) {
        throw new Error(
          'The type definitions endpoint did not return the expected shape.'
        )
      }

      return data.map<ITypeDefinition>((d: any) => ({
        typingsName: d.t,
        isGlobal: d.g && d.g.length > 0,
      }))
    },
  }
}
