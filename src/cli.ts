import { createContainer, ResolutionMode } from 'awilix'
import * as fakes from './fakes'
import { createTypeSyncer } from './type-syncer'
import { ITypeSyncer, ITypeDefinition } from './types'
import * as chalk from 'chalk'
import * as C from './cli-util'
import { parseArguments } from './cli-util'
import { typed } from './util'
import { createTypeDefinitionSource } from './type-definition-source'
import { createPackageJSONFileService } from './package-json-file-service'

/**
 * Starts the TypeSync CLI.
 */
export async function startCli () {
  try {
    // Awilix is a dependency injection container.
    const container = createContainer({
      resolutionMode: ResolutionMode.CLASSIC
    }).registerFunction({
      typeDefinitionSource: createTypeDefinitionSource,
      packageJSONService: createPackageJSONFileService,
      typeSyncer: createTypeSyncer
    })
    await _runCli(container.resolve<ITypeSyncer>('typeSyncer'))
  } catch (err) {
    C.error(err)
    process.exit(1)
  }
}

async function _runCli (syncer: ITypeSyncer) {
  const { args, flags } = parseArguments(process.argv.slice(2))
  const [filePath = 'package.json'] = args
  if (flags.help) {
    printHelp()
    return
  }

  C.log(`TypeSync v${chalk.white(require('../package.json').version)}`)
  if (flags.dry) {
    C.log('—— DRY RUN — will not modify file ——')
  }
  const result = await C.spinWhile(
    `Syncing type definitions in ${chalk.cyan(filePath)}...`,
    () => syncer.sync(filePath, { dry: flags.dry })
  )

  const formattedTypings = result.newTypings.map(formatPackageName).join('\n')
  C.success(
    result.newTypings.length === 0
      ? `No new typings added, looks like you're all synced up!`
      : (chalk as any)`${result.newTypings.length} typings added:\n${formattedTypings}\n\n✨  Go ahead and run {green npm install} or {green yarn} to install the packages that were added.`
  )
}

function formatPackageName (t: ITypeDefinition) {
  return `${chalk.bold.green('+')}  ${chalk.gray('@types/')}${chalk.bold.blue(t.typingsName)}`
}

function printHelp () {
  console.log((chalk as any)`
{blue.bold typesync} - adds missing TypeScript definitions to package.json

Options
  {magenta.bold --dry}      dry run, won't save the package.json
  {magenta.bold --help}     shows this help menu
  `.trim())
}
