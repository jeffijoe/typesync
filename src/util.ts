/**
 * Returns unique items.
 *
 * @param source The source to filter
 */
export function uniq<T> (source: Array<T>): Array<T> {
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
export function filterMap <T, R> (
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
export function mergeObjects<T> (source: Array<T>): T {
  return source.reduce((accum: any, next: any) => ({ ...accum, ...next }), {})
}

/**
 * Returns the assumed types package name.
 * @param name Package name
 */
export function typed (name: string, urlEncode = false): string {
  return `@types${urlEncode ? '%2F' : '/'}${name}`
}
