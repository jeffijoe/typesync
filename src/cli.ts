import { createContainer, InjectionMode, asFunction } from 'awilix'
import chalk from 'chalk'
import * as path from 'path'
import * as C from './cli-util'
import { ITypeSyncer, ITypeDefinition, ISyncedFile } from './types'
import { createTypeSyncer } from './type-syncer'
import { createTypeDefinitionSource } from './type-definition-source'
import { createPackageJSONFileService } from './package-json-file-service'
import { createConfigService } from './config-service'
import { createGlobber } from './globber'
import { createPackageSource } from './package-source'

/**
 * Starts the TypeSync CLI.
 */
export async function startCli() {
  try {
    // Awilix is a dependency injection container.
    const container = createContainer({
      injectionMode: InjectionMode.CLASSIC,
    }).register({
      typeDefinitionSource: asFunction(createTypeDefinitionSource).singleton(),
      packageJSONService: asFunction(createPackageJSONFileService).singleton(),
      packageSource: asFunction(createPackageSource).singleton(),
      configService: asFunction(createConfigService).singleton(),
      globber: asFunction(createGlobber).singleton(),
      typeSyncer: asFunction(createTypeSyncer),
    })
    await run(container.resolve<ITypeSyncer>('typeSyncer'))
  } catch (err: any) {
    C.error(err)
    process.exitCode = 1
  }
}

/**
 * Actual CLI runner. Uses the `syncer` instance to sync.
 * @param syncer
 */
async function run(syncer: ITypeSyncer) {
  const { args, flags } = C.parseArguments(process.argv.slice(2))
  const [filePath = 'package.json'] = args
  if (flags.help) {
    printHelp()
    return
  }

  C.log(chalk`TypeSync v{white ${require('../package.json').version}}`)
  if (flags.dry) {
    C.log('—— DRY RUN — will not modify file ——')
  }
  const result = await C.spinWhile(
    `Syncing type definitions in ${chalk.cyan(filePath)}...`,
    () => syncer.sync(filePath, flags)
  )

  const syncedFilesOutput = result.syncedFiles
    .map(renderSyncedFile)
    .join('\n\n')
  const totals = result.syncedFiles
    .map((f) => ({
      newTypings: f.newTypings.length,
      removedTypings: f.removedTypings.length,
    }))
    .reduce(
      (accum, next) => ({
        newTypings: accum.newTypings + next.newTypings,
        removedTypings: accum.removedTypings + next.removedTypings,
      }),
      { newTypings: 0, removedTypings: 0 }
    )
  if (
    flags.dry === 'fail' &&
    totals.newTypings > 0 &&
    totals.removedTypings > 0
  ) {
    throw new Error('Typings changed, check failed.')
  }
  C.success(
    totals.newTypings === 0
      ? `No new typings added, looks like you're all synced up!${
          totals.removedTypings > 0
            ? chalk` {gray.italic Also removed ${totals.removedTypings.toString()} unused typings, no big deal.}`
            : ''
        }`
      : chalk`${totals.newTypings.toString()} new typings added${
          totals.removedTypings > 0
            ? chalk` {italic (${totals.removedTypings.toString()} unused removed)}`
            : ''
        }.\n\n${syncedFilesOutput}\n\n✨  Go ahead and run {green npm install} or {green yarn} to install the packages that were added.`
  )
}

/**
 * Renders a type definition.
 * @param typeDef
 * @param isLast
 */
function renderTypeDef(
  typeDef: ITypeDefinition & { action: string },
  isLast: boolean
) {
  const treeNode = isLast ? '└─' : '├─'
  return chalk`${treeNode} ${
    typeDef.action === 'add' ? chalk`{green.bold +}` : chalk`{red.bold -}`
  } {gray @types/}${
    typeDef.action === 'add'
      ? chalk`{bold.blue ${typeDef.typingsName}}`
      : chalk`{bold.yellow ${typeDef.typingsName}} {gray.italic (unused)}`
  }`
}

/**
 * Renders a synced file.
 *
 * @param file
 */
function renderSyncedFile(file: ISyncedFile) {
  const badge =
    file.newTypings.length === 0 && file.removedTypings.length === 0
      ? chalk`{blue.bold (no new typings added)}`
      : chalk`{green.bold (${file.newTypings.length.toString()} new typings added, ${file.removedTypings.length.toString()} unused typings removed)}`

  const dirName = path.basename(path.dirname(path.resolve(file.filePath)))
  const title = chalk`📦 ${file.package.name || dirName} {gray.italic — ${
    file.filePath
  }} ${badge}`

  const nl = '\n'
  const combined = [
    ...file.newTypings.map((t) => ({ ...t, action: 'add' })),
    ...file.removedTypings.map((t) => ({ ...t, action: 'remove' })),
  ]
  const rendered =
    title +
    nl +
    combined
      .map((t) => renderTypeDef(t, combined[combined.length - 1] === t))
      .join(nl)

  return rendered
}

/**
 * Prints the help text.
 */
function printHelp() {
  console.log(
    chalk`
{blue.bold typesync} - adds missing TypeScript definitions to package.json

Options
  {magenta.bold --dry}                                   dry run, won't save the package.json
  {magenta.bold --ignoredeps=<deps|dev|peer|optional>}   ignores dependencies in the specified sections (comma separate for multiple). Example: {magenta ignoredeps=dev,peer}
  {magenta.bold --help}                                  shows this help menu
  `.trim()
  )
}
