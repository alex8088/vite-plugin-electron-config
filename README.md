# vite-plugin-electron-config

<p>
  <img src="https://img.shields.io/badge/electron->13.0.0-9feaf9.svg" alt="electron" />
  <img src="https://img.shields.io/badge/vite->2.0.0-747bff.svg" alt="vite" />
</p>

> Electron plugin for Vite

---

## Features

- 🏠Presets for main process:
  - **target**: `node*`, automatically match node target of `Electron`. For example, the node target of Electron 17 is `node16.13`
  - **lib.entry**: `{index|main}.{js|ts|mjs|cjs}`(relative to root from vite config file), empty string if not found
  - **lib.formats**: `cjs`
  - **rollupOptions.external**: `electron` and all builtin modules, and it will merge automatically with the external module ids added by user
- 🔗Presets for preload script:
  - **target**: the same as `main`
  - **lib.entry**: `{index|preload}.{js|ts|mjs|cjs}`(relative to root from vite config file), empty string if not found
  - **lib.formats**: `cjs`
  - **rollupOptions.external**: the same as `main`
- 🌴Presets for renderer process:
  - **target**: `chrome*`, automatically match chrome target of `Electron`. For example, the chrome target of Electron 17 is `chrome98`
  - **polyfillModulePreload**: `false`, there is no need to polyfill `Module Preload` for the Electron renderer
  - **rollupOptions.external**: the same as `main`
- 🔧Resolved config checking

## Install

```sh
npm i vite-plugin-electron-config -D
```

## Usage

### Main Process

```js
import { defineConfig } from 'vite'
import { electronMain } from 'vite-plugin-electron-config'

export default defineConfig({
  plugins: [electronMain()]
})
```

### Preload Script

```js
import { defineConfig } from 'vite'
import { electronPreload } from 'vite-plugin-electron-config'

export default defineConfig({
  plugins: [electronPreload()]
})
```

### Renderer Process

```js
import { defineConfig } from 'vite'
import { electronRenderer } from 'vite-plugin-electron-config'

export default defineConfig({
  plugins: [electronRenderer()]
})
```

## Recommended

[electron-vite](https://github.com/alex8088/electron-vite), an Electron CLI integrated with Vite, make you easy to use Vite.

## License

[MIT](./LICENSE) License © 2022 Alex Wei
