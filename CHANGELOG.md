# Changelog

## 1.0.0

### Features

- **Context menu commands** — "Open npm Page in Browser", "Open npm Page in VS Code", and "Go to package.json Dependency"
- **CodeLens** — Inline links above import statements to open packages on npm or in VS Code
- **Hover provider** — Hover over imports for package info and quick action links
- **Status bar** — Shows the current package name when the cursor is on an import line
- **Smart module detection** — ESM `import`, CommonJS `require()`, dynamic `import()`, and re-exports
- **Multi-line import support** — Resolves module names from within multi-line import blocks
- **Module classification** — Detects and labels Node.js built-ins, relative imports, and TypeScript path aliases
- **Scoped packages** — Handles `@scope/package` and deep imports
- **Configurable** — Toggle CodeLens, hover, and status bar; choose default action; set custom registry URL
