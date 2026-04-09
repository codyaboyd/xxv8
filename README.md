# xxv8

`xxv8` is a JavaScript binary build wrapper around [`pkg`](https://github.com/vercel/pkg).

It supports:

1. A **server/client** workflow for remote compilation.
2. A **CI-first local build command** (`ci`) that is easy to plug into CI/CD pipelines.

---

## Why the `ci` command?

The `ci` command is optimized for pipelines:

- Non-interactive and deterministic CLI flags
- Predictable output layout under a single output folder
- Explicit failure codes for failed builds (so pipelines fail correctly)
- Configurable entrypoint, targets, and output directory

---

## Requirements

- Node.js 18+
- npm

Install dependencies:

```bash
npm install
```

---

## CLI Usage

```bash
node xxv8.js server <port>
node xxv8.js client <path/to/commonjs/project> <host:port>
node xxv8.js ci <projectPath> [--entry path/to/entry.js] [--targets csv] [--out-dir dist] [--clean]
```

### `ci` command options

- `--entry`: Relative path from `projectPath` to your entry file.
  - If omitted, xxv8 resolves in this order: `package.json#bin`, then `package.json#main`, then `index.js`.
- `--targets`: Comma-separated pkg targets.
  - Default:
    - `node18-x64-linux`
    - `node18-arm64-linux`
    - `node18-x64-macos`
    - `node18-arm64-macos`
    - `node18-x64-win`
    - `node18-arm64-win`
- `--out-dir`: Output directory (default: `<projectPath>/dist`)
- `--clean`: Empties output directory before building

### CI build examples

Build current project for all default targets:

```bash
node xxv8.js ci . --clean
```

Build a specific entrypoint to Linux only:

```bash
node xxv8.js ci . --entry src/cli.js --targets node18-x64-linux,node18-arm64-linux --out-dir artifacts --clean
```

---

## CI/CD Integration

`package.json` includes a ready script:

```bash
npm run ci:build
```

This runs:

```bash
node xxv8.js ci . --clean
```

### GitHub Actions example

```yaml
name: Build binaries

on:
  push:
    branches: [main]
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install deps
        run: npm ci

      - name: Build binaries
        run: npm run ci:build

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: xxv8-binaries
          path: dist/
```

---

## Server/Client mode (legacy workflow)

Start server:

```bash
node xxv8.js server 3000
```

Send project to server:

```bash
node xxv8.js client ./my-project 127.0.0.1:3000
```

The client writes `compiled_binaries.zip` in the current working directory.

---

## License

This project is licensed under the terms in [LICENSE](LICENSE).
