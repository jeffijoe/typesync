import axios from 'axios'

const client = axios.create({
  baseURL: 'https://registry.npmjs.org',
})

/**
 * Simple wrapper around the NPM API.
 */
export const npmClient = {
  getPackageManifest: async (name: string) =>
    client.get(name).then((r) => r.data),
}
