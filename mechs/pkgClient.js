const http = require('http');
const archiver = require('archiver');
const fs = require('fs-extra');
const path = require('path');
const FormData = require('form-data');

function getTempZipPath() {
  return path.join(process.cwd(), 'temp_project.zip');
}

function getBinPath() {
  return path.join(process.cwd(), 'compiled_binaries.zip');
}

async function zipDirectory(source, out) {
  console.log('Starting directory zip operation...');
  const archive = archiver('zip', { zlib: { level: 9 } });
  const stream = fs.createWriteStream(out);

  return new Promise((resolve, reject) => {
    archive
      .directory(source, false)
      .on('error', reject)
      .pipe(stream);

    stream.on('close', () => {
      console.log('Directory successfully zipped.');
      resolve();
    });
    archive.finalize();
  });
}

async function sendProjectToServer(zipPath, serverAddress) {
  console.log('Sending zipped project to server...');
  const formData = new FormData();
  formData.append('projectZip', fs.createReadStream(zipPath));
  const headers = formData.getHeaders();

  const options = {
    method: 'POST',
    headers,
    hostname: serverAddress.split(':')[0],
    port: serverAddress.split(':')[1] || 80,
    path: '/compile'
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      if (res.statusCode !== 200) {
        let errorBody = '';
        res.on('data', (chunk) => {
          errorBody += chunk.toString();
        });
        res.on('end', () => {
          reject(new Error(`Server returned ${res.statusCode}: ${errorBody || 'Unknown error'}`));
        });
        return;
      }

      const outputPath = getBinPath();
      console.log('Receiving compiled binaries from server...');
      const writer = fs.createWriteStream(outputPath);

      res.pipe(writer);
      writer.on('finish', () => {
        console.log('Compiled binaries successfully received.');
        resolve();
      });
      writer.on('error', reject);
    });

    req.on('error', reject);

    formData.pipe(req);
  });
}

module.exports.runClient = async function runClient(folderPath, serverAddress) {
  if (!folderPath || !serverAddress) {
    throw new Error('Both folderPath and serverAddress must be specified');
  }

  const tempZipPath = getTempZipPath();

  await zipDirectory(folderPath, tempZipPath);
  await sendProjectToServer(tempZipPath, serverAddress);

  console.log('Cleaning up temporary zip file...');
  await fs.remove(tempZipPath);

  console.log('Compiled binaries received and saved as "compiled_binaries.zip".');
};
