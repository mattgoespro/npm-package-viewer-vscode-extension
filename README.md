# NPM Package Viewer

Open npm package pages directly from your import statements — in your default browser or inside VS Code.

## Features

### 📦 Context Menu & Commands

Right-click on any import line to access the **NPM Package Viewer** submenu:

- **Open npm Page in Browser** — Opens the package on npmjs.com in your default browser
- **Open npm Page in VS Code** — Opens the package page in an embedded VS Code browser tab
- **Go to package.json Dependency** — Jumps to the package entry in your project's `package.json`

All commands are also available via the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`).

### 🔍 CodeLens

Inline "Open on npm ↗" and "View in VS Code" links appear above every import statement. Node.js built-in modules are labelled accordingly.

### 💬 Hover Information

Hover over any import to see the package name with quick-action links.

### 📊 Status Bar

The current package name is shown in the status bar when your cursor is on an import line. Click it to open the package.

### 🧠 Smart Module Detection

- **Supported syntaxes**: ESM `import`, CommonJS `require()`, dynamic `import()`, re-exports `export ... from`
- **Multi-line imports**: Resolves the module name even when the cursor is inside a multi-line import block
- **Scoped packages**: Handles `@scope/package` and deep imports like `lodash/fp`
- **Graceful classification**:
  - Node.js built-ins (`node:fs`, `path`) → informational message
  - Relative imports (`./utils`) → informational message
  - TypeScript path aliases (from `tsconfig.json` `paths`) → informational message
  - Everything else → opens on npm

## Supported Languages

- JavaScript (`.js`)
- TypeScript (`.ts`)
- JSX (`.jsx`)
- TSX (`.tsx`)

## Supported Import Syntaxes

| Syntax | Example |
|--------|---------|
| ESM default import | `import lodash from "lodash"` |
| ESM named import | `import { useState } from "react"` |
| ESM namespace import | `import * as fs from "node:fs"` |
| ESM side-effect import | `import "reflect-metadata"` |
| ESM type import | `import type { FC } from "react"` |
| Dynamic import | `const m = await import("chalk")` |
| CommonJS require | `const express = require("express")` |
| Re-export | `export { foo } from "bar"` |

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `npmPackageViewer.defaultAction` | `"browser"` | Default action: `"browser"` or `"webview"` |
| `npmPackageViewer.registryUrl` | `"https://www.npmjs.com"` | Base URL of the npm registry to link to |
| `npmPackageViewer.showCodeLens` | `true` | Show CodeLens above import lines |
| `npmPackageViewer.showHover` | `true` | Show hover information on import lines |
| `npmPackageViewer.showStatusBarItem` | `true` | Show package name in the status bar |

## License

MIT
