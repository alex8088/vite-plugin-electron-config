import path from 'path'
import * as fs from 'fs'
import { builtinModules, createRequire } from 'module'
import { Plugin, mergeConfig, searchForWorkspaceRoot } from 'vite'

export interface ElectronPluginOptions {
  /**
   * Project root directory. Can be an absolute path,
   * or a path relative from the location of the
   * `package.json` file itself.
   */
  workspaceRoot?: string
}

function findLibEntry(root: string, scope: string): string {
  for (const name of ['index', scope]) {
    for (const ext of ['js', 'ts', 'mjs', 'cjs']) {
      const entryFile = path.resolve(root, `${name}.${ext}`)
      if (fs.existsSync(entryFile)) {
        return entryFile
      }
    }
  }
  return ''
}

function processEnvDefine(): Record<string, string> {
  return {
    'process.env': `process.env`,
    'global.process.env': `global.process.env`,
    'globalThis.process.env': `globalThis.process.env`
  }
}

export function electronMain(options?: ElectronPluginOptions): Plugin[] {
  return [
    {
      name: 'vite:electron-main-preset-config',
      apply: 'build',
      enforce: 'pre',
      config(config): void {
        const root = config.root || process.cwd()
        const workspaceRoot =
          options?.workspaceRoot || searchForWorkspaceRoot(root)

        let nodeTarget = ''
        if (workspaceRoot) {
          const electornVer = getElectronMainVer(workspaceRoot)
          nodeTarget = getElectronNodeTarget(electornVer)
        }

        const defaultConfig = {
          build: {
            target: nodeTarget,
            lib: {
              entry: findLibEntry(root, 'main'),
              formats: ['cjs']
            },
            rollupOptions: {
              external: [
                'electron',
                ...builtinModules.flatMap((m) => [m, `node:${m}`])
              ],
              output: {
                entryFileNames: '[name].js'
              }
            },
            minify: false
          }
        }

        const buildConfig = mergeConfig(defaultConfig.build, config.build || {})
        config.build = buildConfig

        config.define = config.define || {}
        config.define = { ...processEnvDefine(), ...config.define }
      }
    },
    {
      name: 'vite:electron-main-resolved-config',
      apply: 'build',
      enforce: 'post',
      configResolved(config): void {
        const build = config.build
        if (!build.target) {
          throw new Error(
            'build target required for the electron main Vite config'
          )
        } else {
          const targets = Array.isArray(build.target)
            ? build.target
            : [build.target]
          if (targets.some((t) => !t.startsWith('node'))) {
            throw new Error(
              'the electron main Vite config build target must be node'
            )
          }
        }

        const lib = build.lib
        if (!lib) {
          throw new Error(
            'build lib field required for the electron main Vite config'
          )
        } else {
          if (!lib.entry) {
            throw new Error(
              'build entry field required for the electron main Vite config'
            )
          }
          if (!lib.formats) {
            throw new Error(
              'build format field required for the electron main Vite config'
            )
          } else if (!lib.formats.includes('cjs')) {
            throw new Error(
              'the electron main Vite config build lib format must be cjs'
            )
          }
        }
      }
    }
  ]
}

export function electronPreload(options?: ElectronPluginOptions): Plugin[] {
  return [
    {
      name: 'vite:electron-preload-preset-config',
      apply: 'build',
      enforce: 'pre',
      config(config): void {
        const root = config.root || process.cwd()
        const workspaceRoot =
          options?.workspaceRoot || searchForWorkspaceRoot(root)

        let nodeTarget = ''
        if (workspaceRoot) {
          const electornVer = getElectronMainVer(workspaceRoot)
          nodeTarget = getElectronNodeTarget(electornVer)
        }

        const defaultConfig = {
          build: {
            target: nodeTarget,
            rollupOptions: {
              external: [
                'electron',
                ...builtinModules.flatMap((m) => [m, `node:${m}`])
              ],
              output: {
                entryFileNames: '[name].js'
              }
            },
            minify: false
          }
        }

        const build = config.build || {}
        const rollupOptions = build.rollupOptions || {}
        if (!rollupOptions.input) {
          defaultConfig.build['lib'] = {
            entry: findLibEntry(root, 'preload'),
            formats: ['cjs']
          }
        } else {
          if (!rollupOptions.output) {
            defaultConfig.build.rollupOptions.output['format'] = 'cjs'
          }
        }

        const buildConfig = mergeConfig(defaultConfig.build, config.build || {})
        config.build = buildConfig

        config.define = config.define || {}
        config.define = { ...processEnvDefine(), ...config.define }
      }
    },
    {
      name: 'vite:electron-preload-resolved-config',
      apply: 'build',
      enforce: 'post',
      configResolved(config): void {
        const build = config.build
        if (!build.target) {
          throw new Error(
            'build target required for the electron preload Vite config'
          )
        } else {
          const targets = Array.isArray(build.target)
            ? build.target
            : [build.target]
          if (targets.some((t) => !t.startsWith('node'))) {
            throw new Error(
              'the electron preload Vite config build target must be node'
            )
          }
        }

        const lib = build.lib
        if (!lib) {
          const rollupOptions = build.rollupOptions
          if (!rollupOptions?.input) {
            throw new Error(
              'build lib field required for the electron preload Vite config'
            )
          } else {
            const output = rollupOptions?.output
            if (output) {
              const formats = Array.isArray(output) ? output : [output]
              if (!formats.some((f) => f !== 'cjs')) {
                throw new Error(
                  'the electron preload Vite config output format must be cjs'
                )
              }
            }
          }
        } else {
          if (!lib.entry) {
            throw new Error(
              'build entry field required for the electron preload Vite config'
            )
          }
          if (!lib.formats) {
            throw new Error(
              'build format field required for the electron preload Vite config'
            )
          } else if (!lib.formats.includes('cjs')) {
            throw new Error(
              'the electron preload Vite config lib format must be cjs'
            )
          }
        }
      }
    }
  ]
}

export function electronRenderer(options?: ElectronPluginOptions): Plugin[] {
  return [
    {
      name: 'vite:electron-renderer-preset-config',
      enforce: 'pre',
      config(config): void {
        const root = config.root || process.cwd()
        const workspaceRoot =
          options?.workspaceRoot || searchForWorkspaceRoot(root)

        let chromeTarget = ''
        if (workspaceRoot) {
          const electornVer = getElectronMainVer(workspaceRoot)
          chromeTarget = getElectronChromeTarget(electornVer)
        }

        config.base = config.mode === 'production' ? './' : config.base

        const defaultConfig = {
          build: {
            target: chromeTarget,
            polyfillModulePreload: false,
            rollupOptions: {
              external: [...builtinModules.flatMap((m) => [m, `node:${m}`])]
            },
            minify: false
          }
        }

        const buildConfig = mergeConfig(defaultConfig.build, config.build || {})
        config.build = buildConfig
      }
    },
    {
      name: 'vite:electron-renderer-resolved-config',
      enforce: 'post',
      configResolved(config): void {
        if (config.base !== './' && config.base !== '/') {
          config.logger.warn(
            'should not set base field for the electron renderer Vite config'
          )
        }

        const build = config.build
        if (!build.target) {
          throw new Error(
            'build target required for the electron renderer Vite config'
          )
        } else {
          const targets = Array.isArray(build.target)
            ? build.target
            : [build.target]
          if (targets.some((t) => !t.startsWith('chrome'))) {
            throw new Error(
              'the electron renderer Vite config build target must be chrome'
            )
          }
        }

        const rollupOptions = build.rollupOptions
        if (!rollupOptions.input) {
          config.logger.error('index.html file is not found')
          throw new Error(
            'build rollupOptions input field required for the electron renderer Vite config'
          )
        }
      }
    }
  ]
}

function getElectronMainVer(root: string): string {
  let mainVer = process.env.ELECTRON_MAIN_VER || ''
  if (!mainVer) {
    const electronModulePath = path.resolve(root, 'node_modules', 'electron')
    const pkg = path.join(electronModulePath, 'package.json')
    if (fs.existsSync(pkg)) {
      const require = createRequire(import.meta.url)
      const version = require(pkg).version
      mainVer = version.split('.')[0]
      process.env.ELECTRON_MAIN_VER = mainVer
    }
  }
  return mainVer
}

function getElectronNodeTarget(electronVer: string): string {
  const nodeVer = {
    '18': '16.13',
    '17': '16.13',
    '16': '16.9',
    '15': '16.5',
    '14': '14.17',
    '13': '14.17',
    '12': '14.16',
    '11': '12.18'
  }
  if (electronVer && parseInt(electronVer) > 10) {
    return 'node' + nodeVer[electronVer]
  }
  return ''
}

function getElectronChromeTarget(electronVer: string): string {
  const chromeVer = {
    '18': '100',
    '17': '98',
    '16': '96',
    '15': '94',
    '14': '93',
    '13': '91',
    '12': '89',
    '11': '87'
  }
  if (electronVer && parseInt(electronVer) > 10) {
    return 'chrome' + chromeVer[electronVer]
  }
  return ''
}
