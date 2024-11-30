import chalk from 'chalk'
import { oraPromise } from 'ora'
import type { ICLIArguments } from './types'

/**
 * Like regular console.log, but better.
 * @param message
 */
export function log(message: string): void {
  console.log(`${chalk.white('»')}  ${chalk.gray(message)}`)
}

/**
 * Makes success feel even sweeter.
 * @param text
 */
export function success(text: string): void {
  console.log(`${chalk.green('✔')}  ${chalk.white(text)}`)
}

/**
 * Logs an error all pretty.
 * @param err
 */
export function error(err: Error | string): void {
  const msg = err instanceof Error ? err.message : err
  const stack = err instanceof Error ? `\nStack:\n${err.stack}` : ''
  console.log(`${chalk.red('✖')}  ${chalk.bgRed(chalk.white(msg))}${stack}`)
}

/**
 * Spins while doing work. Stops when done.
 * @param text
 * @param fn
 */
export async function spinWhile<T>(
  text: string,
  fn: () => Promise<T>,
): Promise<T> {
  return await oraPromise(fn(), {
    text: ` ${chalk.gray(text)}`,
  })
}

/**
 * Super simple argument parser.
 * @param argv
 */
export function parseArguments(argv: Array<string>): ICLIArguments {
  const flags: ICLIArguments['flags'] = {}
  const args: Array<string> = []
  for (const arg of argv) {
    if (arg.startsWith('--')) {
      if (arg.includes('=')) {
        const idx = arg.indexOf('=')
        const afterEq = arg.substring(idx + 1)
        flags[arg.substring(2, idx)] = afterEq
      } else {
        flags[arg.substring(2)] = true
      }
    } else {
      args.push(arg)
    }
  }
  return { flags, args }
}
