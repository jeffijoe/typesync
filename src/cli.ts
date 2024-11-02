import * as path from 'node:path'
import { asFunction, createContainer, InjectionMode } from 'awilix'
import chalk from 'chalk'
import * as C from './cli-util'
import { createConfigService } from './config-service'
import { createGlobber } from './globber'
import { createPackageJSONFileService } from './package-json-file-service'
import { createPackageSource } from './package-source'
import { createTypeSyncer } from './type-syncer'
import type {
  IPackageTypingDescriptor,
  ISyncedFile,
  ITypeSyncer,
} from './types'
import { createWorkspaceResolverService } from './workspace-resolver'
import * as fsUtils from './fs-utils'

/**
 * Starts the TypeSync CLI.
 */
export async function startCli() {
  try {
    // Awilix is a dependency injection container.
    const container = createContainer({
      injectionMode: InjectionMode.CLASSIC,
    }).register({
      packageJSONService: asFunction(createPackageJSONFileService).singleton(),
      workspaceResolverService: asFunction(() =>
        createWorkspaceResolverService(fsUtils),
      ).singleton(),
      packageSource: asFunction(createPackageSource).singleton(),
      configService: asFunction(createConfigService).singleton(),
      globber: asFunction(createGlobber).singleton(),
      typeSyncer: asFunction(createTypeSyncer),
    })
    await run(container.resolve<ITypeSyncer>('typeSyncer'))
  } catch (err) {
    C.error(err as any)
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
    () => syncer.sync(filePath, flags),
  )

  const syncedFilesOutput = result.syncedFiles
    .map(renderSyncedFile)
    .join('\n\n')
  const totals = result.syncedFiles.reduce(
    (accum, f) => ({
      newTypings: accum.newTypings + f.newTypings.length,
    }),
    { newTypings: 0 },
  )

  const syncMessage = chalk`\n\n${syncedFilesOutput}\n\n✨  Run {green typesync} again without the {gray --dry} flag to update your {gray package.json}.`
  if (flags.dry === 'fail' && totals.newTypings > 0) {
    C.error('Typings changed; check failed.')
    C.log(syncMessage)
    process.exitCode = 1
    return
  }
  C.success(
    totals.newTypings === 0
      ? `No new typings to add, looks like you're all synced up!`
      : flags.dry
        ? chalk`${totals.newTypings.toString()} new typings can be added.${syncMessage}`
        : chalk`${totals.newTypings.toString()} new typings added.\n\n${syncedFilesOutput}\n\n✨  Go ahead and run {green npm install}, {green yarn}, or {green pnpm i} to install the packages that were added.`,
  )
}

/**
 * Renders a type definition.
 * @param typeDef
 * @param isLast
 */
function renderTypeDef(typeDef: IPackageTypingDescriptor, isLast: boolean) {
  const treeNode = isLast ? '└─' : '├─'
  return chalk`${treeNode} ${chalk`{green.bold +}`} {gray @types/}${chalk`{bold.blue ${typeDef.typingsName}}`}`
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
  const title = chalk`📦 ${file.package.name ?? dirName} {gray.italic — ${
    file.filePath
  }} ${badge}`

  const nl = '\n'
  const combined = [...file.newTypings.map((t) => ({ ...t, action: 'add' }))]
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
  `.trim(),
  )
}
