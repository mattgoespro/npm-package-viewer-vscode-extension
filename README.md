# NPM Package Viewer

A Visual Studio Code extension that lets you open the npm package page for any module import — right from the editor context menu.

## Features

- **Open in Browser** — Opens the npm page for the module on the current line in your default browser.
- **Open in VS Code** — Opens the npm page in a VS Code webview panel alongside your code.
- **Smart detection** — Recognizes ESM `import`, CommonJS `require()`, dynamic `import()`, and `export ... from` re-exports.
- **Graceful handling** of non-npm modules:
  - **Node.js built-ins** (e.g., `node:fs`, `path`) — shows an informational message.
  - **Relative imports** (e.g., `./utils`) — shows an informational message.
  - **TypeScript path aliases** (e.g., `@app/services`) — detects aliases from `tsconfig.json` paths.
- Supports **JavaScript**, **TypeScript**, **JSX**, and **TSX** files.
- Handles **scoped packages** (`@scope/package`) and **deep imports** (`lodash/fp`).

## Usage

1. Place your cursor on a line that contains a module import or require statement.
2. Right-click to open the context menu.
3. Look for the **NPM Package Viewer** submenu.
4. Choose **Open npm Page in Browser** or **Open npm Page in VS Code**.

You can also invoke these commands from the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):
- `NPM Package Viewer: Open npm Page in Browser`
- `NPM Package Viewer: Open npm Page in VS Code`

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

## Development

```bash
npm install
npm run build    # Bundle with esbuild
npm run watch    # Watch mode
npm run lint     # Type-check
npm test         # Run tests in VS Code Extension Host
```

Press **F5** in VS Code to launch the Extension Development Host for debugging.

## License

MIT
