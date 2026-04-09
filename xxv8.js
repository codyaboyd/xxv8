const { runServer } = require('./mechs/pkgBuilder.js');
const { runClient } = require('./mechs/pkgClient.js');
const { runCiBuild } = require('./mechs/pkgCi.js');

function displayUsageAndExit() {
  console.log('Usage:');
  console.log('  ./xxv8 server <portNum>');
  console.log('  ./xxv8 client <path/to/folder/> <ip:port>');
  console.log('  ./xxv8 ci <projectPath> [--entry path/to/entry.js] [--targets csv] [--out-dir dist] [--clean]');
  process.exit(1);
}

function parseCiArgs(args) {
  if (!args.length) {
    throw new Error('Missing <projectPath> for ci command.');
  }

  const options = {
    projectPath: args[0],
    clean: false
  };

  for (let i = 1; i < args.length; i += 1) {
    const token = args[i];

    if (token === '--clean') {
      options.clean = true;
      continue;
    }

    if (token === '--entry' || token === '--targets' || token === '--out-dir') {
      const value = args[i + 1];
      if (!value) {
        throw new Error(`Missing value for ${token}`);
      }

      if (token === '--entry') {
        options.entry = value;
      }

      if (token === '--targets') {
        options.targets = value;
      }

      if (token === '--out-dir') {
        options.outDir = value;
      }

      i += 1;
      continue;
    }

    throw new Error(`Unknown ci option: ${token}`);
  }

  return options;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    displayUsageAndExit();
  }

  const command = args[0];

  if (command === 'server') {
    if (args.length !== 2) {
      displayUsageAndExit();
    }

    const portNum = parseInt(args[1], 10);
    if (Number.isNaN(portNum)) {
      console.log('Error: Invalid port number.');
      process.exit(1);
    }

    runServer(portNum);
    return;
  }

  if (command === 'client') {
    if (args.length !== 3) {
      displayUsageAndExit();
    }

    await runClient(args[1], args[2]);
    return;
  }

  if (command === 'ci') {
    const options = parseCiArgs(args.slice(1));
    await runCiBuild(options);
    return;
  }

  console.log('Error: Invalid command.');
  displayUsageAndExit();
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
