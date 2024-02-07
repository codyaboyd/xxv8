const express = require('express');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('pkg');
const archiver = require('archiver');

function getExtractedPath() {
    return path.join(process.cwd(), 'extracted');
}

function getOutputPath() {
    return path.join(process.cwd(), 'output');
}

function getUploadPath() {
    return path.join(process.cwd(), 'uploads');
}

async function ensureUploadsDir() {
    let uploadDir = getUploadPath();
    try {
        await fs.ensureDir(uploadDir);
        console.log("[INIT] Ensured 'uploads' directory exists.");
    } catch (err) {
        console.error("[ERROR] Could not ensure 'uploads' directory:", err);
    }
}

async function extract(src, dest) {
    console.log("[EXTRACT] Source:", src);
    console.log("[EXTRACT] Destination:", dest);

    return new Promise((resolve, reject) => {
        const zip = new ADMZip(src);
        zip.extractAllToAsync(dest, true, (error) => {
            if (error) {
                console.error("[EXTRACT] Extraction error:", error);
                reject(error);
            } else {
                console.log("[EXTRACT] Completed extraction");
                resolve();
            }
        });
    });
}

async function archiveDirectoryAsync(source, res) {
    return new Promise((resolve, reject) => {
        console.log("[ARCHIVE] Archiving directory:", source);

        const archive = archiver('zip', { zlib: { level: 9 } });

        res.on('finish', function() {
            console.log("[ARCHIVE] Archive sent to client");
            resolve();
        });

        archive.on('error', function(err) {
            reject(err);
        });

        archive.pipe(res);
        archive.directory(source, false);
        archive.finalize();
    });
}

module.exports.runServer = function(port) {
    ensureUploadsDir(); // Ensure the uploads directory exists
    let uploadDir = getUploadPath();
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            console.log("[UPLOAD] File storage destination set");
            cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
            console.log("[UPLOAD] File storage filename set");
            cb(null, Date.now() + '-' + file.originalname);
        }
    });

    const upload = multer({ storage: storage });
    const app = express();

    app.post('/compile', upload.single('projectZip'), async (req, res) => {
        const zipFilePath = req.file.path;
        const extractedPath = getExtractedPath();
        const outputPath = getOutputPath();

        console.log("[COMPILE] Received zip at:", zipFilePath);

        try {
            await fs.ensureDir(extractedPath);
            await fs.emptyDir(extractedPath);
            await extract(zipFilePath, extractedPath);

            const jsFiles = fs.readdirSync(extractedPath).filter(file => file.endsWith('.js'));
            if (!jsFiles.length) {
                throw new Error('No JS files found in the uploaded project.');
            }
            const mainScript = jsFiles[0];

            const platforms = ['linux', 'macos', 'win'];
            const architectures = ['x64', 'arm64'];

            for (const platform of platforms) {
                for (const arch of architectures) {
                    const target = `node18-${arch}-${platform}`;
                    const outputFileName = path.join(outputPath, `${platform}-${arch}`, mainScript.replace('.js', ''));
                    const args = [path.join(extractedPath, mainScript), '--target', target, '--output', outputFileName];
                    console.log(`[PKG] Running pkg with args: ${args.join(' ')}`);
                    await exec(args);
                }
            }

            console.log("[COMPILE] Packaging completed binaries...");
            await archiveDirectoryAsync(outputPath, res);

            await Promise.all([
                fs.remove(zipFilePath),
                fs.remove(extractedPath),
                fs.remove(outputPath),
            ]);
            console.log("[CLEANUP] Removed temporary files.");

        } catch (error) {
            console.error("[ERROR]", error);
            if (!res.headersSent) {
                res.status(500).send('Server error: ' + error.message);
            }
        }
    });

    app.listen(port, () => {
        console.log(`Server listening on port ${port}...`);
    });
};
