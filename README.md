# xxv8
Vercel pkg cross-platform CommonJS compilation server. JS-to-Binary

# Setup
npm install

*Compile to Binary*

npx pkg xxv8.js -t node18-x64/arm64-macos/windows/linux

Examples:

npx pkg xxv8.js -t node18-x64-linux

npx pkg xxv8.js -t node18-arm64-macos

# Usage
*If not compiled*

node xxv8.js server port#

node xxv8.js client /path/to/commonjs/project ip:port

*If compiled*

./xxv8 server port#

./xxv8 client /path/to/commonjs/project ip:port
