import { createContainer, InjectionMode, asFunction } from 'awilix'
import chalk from 'chalk'
import * as path from 'path'
import * as C from './cli-util'
import { ITypeSyncer, ITypeDefinition, ISyncedFile } from './types'
import { createTypeSyncer } from './type-syncer'
import { createTypeDefinitionSource } from './type-definition-source'
import { createPackageJSONFileService } from './package-json-file-service'
import { createGlobber } from './globber'

/**
 * Starts the TypeSync CLI.
 */
export async function startCli() {
  try {
    // Awilix is a dependency injection container.
    const container = createContainer({
      injectionMode: InjectionMode.CLASSIC
    }).register({
      typeDefinitionSource: asFunction(createTypeDefinitionSource).singleton(),
      packageJSONService: asFunction(createPackageJSONFileService).singleton(),
      globber: asFunction(createGlobber).singleton(),
      typeSyncer: asFunction(createTypeSyncer)
    })
    await run(container.resolve<ITypeSyncer>('typeSyncer'))
  } catch (err) {
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
    () => syncer.sync(filePath, { dry: flags.dry })
  )

  const syncedFilesOutput = result.syncedFiles
    .map(renderSyncedFile)
    .join('\n\n')
  const totalNewTypings = result.syncedFiles
    .map(f => f.newTypings.length)
    .reduce((accum, next) => accum + next, 0)
  C.success(
    totalNewTypings === 0
      ? `No new typings added, looks like you're all synced up!`
      : chalk`${totalNewTypings.toString()} new typings added.\n\n${syncedFilesOutput}\n\n✨  Go ahead and run {green npm install} or {green yarn} to install the packages that were added.`
  )
}

/**
 * Renders a type definition.
 * @param typeDef
 * @param isLast
 */
function renderTypeDef(typeDef: ITypeDefinition, isLast: boolean) {
  const treeNode = isLast ? '└─' : '├─'
  return chalk`${treeNode} {gray @types/}{bold.blue ${typeDef.typingsName}}`
}

/**
 * Renders a synced file.
 *
 * @param file
 */
function renderSyncedFile(file: ISyncedFile) {
  const badge =
    file.newTypings.length === 0
      ? chalk`{blue.bold (no new typings added)}`
      : chalk`{green.bold (${file.newTypings.length.toString()} new typings added)}`

  const dirName = path.basename(path.dirname(path.resolve(file.filePath)))
  const title = chalk`📦 ${file.package.name || dirName} {gray.italic — ${
    file.filePath
  }} ${badge}`

  const nl = '\n'
  return (
    title +
    nl +
    file.newTypings
      .map(t =>
        renderTypeDef(t, file.newTypings[file.newTypings.length - 1] === t)
      )
      .join(nl)
  )
}

/**
 * Prints the help text.
 */
function printHelp() {
  console.log(
    chalk`
{blue.bold typesync} - adds missing TypeScript definitions to package.json

Options
  {magenta.bold --dry}      dry run, won't save the package.json
  {magenta.bold --help}     shows this help menu
  `.trim()
  )
}
