# xxv8

`xxv8` is a simple **client/server wrapper around `pkg`** that helps you compile a JavaScript project into platform-specific binaries.

At a high level:

1. The **client** zips a project directory and uploads it.
2. The **server** receives the zip and runs `pkg` for multiple targets.
3. The server returns a `compiled_binaries.zip` archive containing the generated executables.

## Features

- Minimal CLI with two commands: `server` and `client`
- Automatically zips and uploads a project from the client
- Compiles for these targets on the server:
  - `node18-x64-linux`
  - `node18-arm64-linux`
  - `node18-x64-macos`
  - `node18-arm64-macos`
  - `node18-x64-win`
  - `node18-arm64-win`
- Returns all compiled artifacts in a single archive

## Requirements

- Node.js (18+ recommended)
- npm
- Network connectivity between client and server

## Installation

```bash
npm install
```

## CLI Usage

Run as a Node script:

```bash
node xxv8.js server <port>
node xxv8.js client <path/to/commonjs/project> <host:port>
```

If you package `xxv8` itself as a binary (optional):

```bash
./xxv8 server <port>
./xxv8 client <path/to/commonjs/project> <host:port>
```

### Examples

Start server on port 3000:

```bash
node xxv8.js server 3000
```

Send a local project to that server:

```bash
node xxv8.js client ./my-project 127.0.0.1:3000
```

After a successful run, the client writes:

- `compiled_binaries.zip` in the current working directory.

## How compilation currently works

On upload, the server:

1. Extracts the project archive.
2. Finds JavaScript files in the extracted root folder.
3. Picks the **first `.js` file** found as the entrypoint.
4. Runs `pkg` against each target.
5. Zips the output folders and streams them back to the client.

## Optional: package xxv8 itself

You can compile this tool to a standalone executable with `pkg`:

```bash
npx pkg xxv8.js -t node18-x64-linux
```

Or build multiple targets:

```bash
npx pkg xxv8.js -t node18-x64/arm64-macos/windows/linux
```

## Troubleshooting

- **"Invalid command" or usage shown**: verify command order and required arguments.
- **Client cannot connect**: check host/port and firewall rules.
- **No binaries returned**: ensure the uploaded project includes a `.js` file at the extracted root.
- **Large projects fail**: verify available disk space and memory on the server.

## License

This project is licensed under the terms in [LICENSE](LICENSE).
