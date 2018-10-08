/**
 * Returns unique items.
 *
 * @param source The source to filter
 */
export function uniq<T>(source: Array<T>): Array<T> {
  const seen: T[] = []
  for (const s of source) {
    if (seen.includes(s)) {
      continue
    }
    seen.push(s)
  }

  return seen
}

/**
 * Does a `map` and a `filter` in one pass.
 *
 * @param source The source to filter and map
 * @param iteratee The iteratee.
 */
export function filterMap<T, R>(
  source: Array<T>,
  iteratee: (item: T, index: number) => R | false
): Array<R> {
  const result: Array<R> = []
  let index = 0
  for (const item of source) {
    const mapped = iteratee(item, index++)
    if (mapped === false) continue
    result.push(mapped)
  }

  return result
}

/**
 * Merges a sequence of objects into a single object using `reduce`.
 *
 * @param source An array of objects to merge.
 */
export function mergeObjects<T>(source: Array<T>): T {
  return source.reduce((accum: any, next: any) => ({ ...accum, ...next }), {})
}

/**
 * Returns the assumed types package name.
 * @param name Package name
 */
export function typed(name: string, urlEncode = false): string {
  return `@types${urlEncode ? '%2F' : '/'}${name}`
}

/**
 * Orders an object.
 * @param source
 */
export function orderObject<T>(source: T): T {
  const keys = Object.keys(source).sort()
  const result: any = {}
  for (const key of keys) {
    result[key] = (source as any)[key]
  }

  return result as T
}

/**
 * Promisifies the specified function.
 *
 * @param fn
 */
export function promisify(fn: Function) {
  return function promisified(...args: any[]) {
    return new Promise<any>((resolve, reject) => {
      fn(...args, function callback(err: any, result: any) {
        // Edge case with `fs.exists`.
        if (arguments.length === 1 && typeof err === 'boolean') {
          return resolve(err)
        }
        return !err ? resolve(result) : reject(err)
      })
    })
  }
}

/**
 * Flattens a 2-dimensional array.
 *
 * @param source
 */
export function flatten<T>(source: Array<Array<T>>): Array<T> {
  const result: Array<T> = []
  for (const items of source) {
    for (const item of items) {
      result.push(item)
    }
  }
  return result
}

/**
 * Async memoize.
 *
 * @param fn
 */
export function memoizeAsync<T, U extends any[], V>(
  fn: (...args: U) => Promise<V>
) {
  const cache = new Map<any, Promise<V>>()

  async function run(...args: U): Promise<V> {
    try {
      return await fn(...args)
    } catch (err) {
      cache.delete(args[0])
      throw err
    }
  }

  return async function(...args: U): Promise<V> {
    const key = args[0]
    if (cache.has(key)) {
      return cache.get(key)!
    }

    const p = run(...args)
    cache.set(key, p)
    return p
  }
}
