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
      const data = await axios.get(typedefsUrl).then(x => x.data as any[])

      return data.map<ITypeDefinition>((d: any) => ({
        typingsName: d.t,
        isGlobal: d.g && d.g.length > 0
      }))
    }
  }
}
