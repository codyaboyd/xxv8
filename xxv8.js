const { runServer } = require('./mechs/pkgBuilder.js');
const { runClient } = require('./mechs/pkgClient.js');

// Function to display usage information and exit
function displayUsageAndExit() {
  console.log("Usage:");
  console.log("  ./xxv8 server <portNum>");
  console.log("  ./xxv8 client <path/to/folder/> <ip:port>");
  process.exit(1);
}

// Main function to handle CLI logic
function main() {
  const args = process.argv.slice(2);
  
  // Check if any arguments are provided
  if (args.length === 0) {
    displayUsageAndExit();
  }

  const command = args[0];

  if (command === 'server') {
    // Validate and run the server
    if (args.length !== 2) {
      displayUsageAndExit();
    }
    const portNum = parseInt(args[1], 10);
    if (isNaN(portNum)) {
      console.log("Error: Invalid port number.");
      process.exit(1);
    }
    runServer(portNum);
  } else if (command === 'client') {
    // Validate and run the client
    if (args.length !== 3) {
      displayUsageAndExit();
    }
    const folderPath = args[1];
    const ipPort = args[2];
    runClient(folderPath, ipPort);
  } else {
    console.log("Error: Invalid command.");
    displayUsageAndExit();
  }
}

// Execute the main function
main();

