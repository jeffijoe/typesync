/**
 * Returns unique items.
 *
 * @param source The source to filter
 */
export function uniq<T>(source: Array<T>): Array<T> {
  return [...new Set(source)]
}

/**
 * Remove blank attributes in a object.
 *
 * @param source
 */
export function shrinkObject<T extends object>(source: T): Partial<T> {
  const object: Partial<T> = {}

  for (const key in source) {
    if (source[key] !== undefined) {
      object[key] = source[key]
    }
  }

  return object
}

/**
 * Merges a sequence of objects into a single object using `reduce`.
 *
 * @param source An array of objects to merge.
 */
export function mergeObjects<T>(source: Array<T>): T {
  return source.reduce((accum, next) => ({ ...accum, ...next }), {} as T)
}

/**
 * Returns the assumed types package name.
 * @param name Package name
 */
export function typed(name: string): string {
  // If the package is scoped, the typings scheme is slightly different.
  if (/^@.*?\//i.test(name)) {
    const splat = name.split('/')
    return `@types/${splat[0].slice(1)}__${splat[1]}`
  }

  return `@types/${name}`
}

/**
 * Returns the assumed code package name based on a types package name.
 * @param name
 */
export function untyped(name: string): string {
  const prefix = '@types/'
  if (!name.startsWith(prefix)) {
    return name
  }
  name = name.substring(prefix.length)
  const splat = name.split('__')
  if (splat.length === 2) {
    return `@${splat[0]}/${splat[1]}`
  }
  return name
}

/**
 * Orders an object.
 * @param source
 */
export function orderObject<T extends Record<string | number | symbol, U>, U>(
  source: T,
  comparer?: (a: string, b: string) => number,
): T {
  const keys = Object.keys(source).sort(comparer)
  const result: Record<string, U> = {}
  for (const key of keys) {
    result[key] = source[key]
  }

  return result as T
}

/**
 * Async memoize.
 *
 * @param fn
 */
export function memoizeAsync<U extends Array<W>, V, W>(
  fn: (...args: U) => Promise<V>,
) {
  const cache = new Map<W, Promise<V>>()

  async function run(...args: U): Promise<V> {
    try {
      return await fn(...args)
    } catch (err) {
      cache.delete(args[0])
      throw err
    }
  }

  return async function (...args: U): Promise<V> {
    const key = args[0]
    if (cache.has(key)) {
      return await (cache.get(key)!)
    }

    const p = run(...args)
    cache.set(key, p)
    return await p
  }
}
