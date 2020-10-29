import axios from 'axios'
import child from 'child_process'
import { promisify } from 'util'
import { memoizeAsync } from './util'

const execAsync = promisify(child.exec)

/**
 * Read registry from npm config.
 */
export async function getNpmRegistry() {
  const { stdout } = await execAsync('npm config get registry')
  /* istanbul ignore next */
  return stdout.trim() || 'https://registry.npmjs.org'
}

const getClient = memoizeAsync(async () => {
  const registryUrl = await getNpmRegistry()
  return axios.create({ baseURL: registryUrl })
})

/**
 * Simple wrapper around the NPM API.
 */
export const npmClient = {
  getPackageManifest: async (name: string) => {
    const client = await getClient()
    return client.get(name).then((r) => r.data)
  },
}
