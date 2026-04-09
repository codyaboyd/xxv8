const fs = require('fs-extra');
const path = require('path');
const { exec } = require('pkg');

const DEFAULT_TARGETS = [
  'node18-x64-linux',
  'node18-arm64-linux',
  'node18-x64-macos',
  'node18-arm64-macos',
  'node18-x64-win',
  'node18-arm64-win'
];

function parseTargets(rawTargets) {
  if (!rawTargets) {
    return DEFAULT_TARGETS;
  }

  return rawTargets
    .split(',')
    .map((target) => target.trim())
    .filter(Boolean);
}

async function resolveEntrypoint(projectPath, explicitEntry) {
  if (explicitEntry) {
    const explicitPath = path.resolve(projectPath, explicitEntry);
    if (!await fs.pathExists(explicitPath)) {
      throw new Error(`Entrypoint not found: ${explicitEntry}`);
    }
    return explicitPath;
  }

  const packageJsonPath = path.join(projectPath, 'package.json');
  if (await fs.pathExists(packageJsonPath)) {
    const packageJson = await fs.readJson(packageJsonPath);

    if (typeof packageJson.bin === 'string') {
      return path.resolve(projectPath, packageJson.bin);
    }

    if (packageJson.bin && typeof packageJson.bin === 'object') {
      const firstBin = Object.values(packageJson.bin).find((value) => typeof value === 'string');
      if (firstBin) {
        return path.resolve(projectPath, firstBin);
      }
    }

    if (typeof packageJson.main === 'string') {
      return path.resolve(projectPath, packageJson.main);
    }
  }

  const fallback = path.join(projectPath, 'index.js');
  if (!await fs.pathExists(fallback)) {
    throw new Error('Could not determine entrypoint. Provide --entry <relative-path>.');
  }

  return fallback;
}

function outputPathForTarget(outDir, target, entrypointPath) {
  const [runtime, arch, platform] = target.split('-');
  if (!runtime || !arch || !platform) {
    throw new Error(`Invalid target format: ${target}`);
  }

  const outputName = path.basename(entrypointPath, path.extname(entrypointPath));
  return path.join(outDir, platform, arch, outputName);
}

module.exports.runCiBuild = async function runCiBuild(options) {
  const projectPath = path.resolve(options.projectPath || '.');
  const outDir = path.resolve(options.outDir || path.join(projectPath, 'dist'));
  const targets = parseTargets(options.targets);

  if (!await fs.pathExists(projectPath)) {
    throw new Error(`Project path does not exist: ${projectPath}`);
  }

  const entrypoint = await resolveEntrypoint(projectPath, options.entry);

  if (options.clean) {
    await fs.emptyDir(outDir);
  } else {
    await fs.ensureDir(outDir);
  }

  console.log(`[CI] Project path: ${projectPath}`);
  console.log(`[CI] Entrypoint: ${entrypoint}`);
  console.log(`[CI] Output directory: ${outDir}`);
  console.log(`[CI] Targets: ${targets.join(', ')}`);

  for (const target of targets) {
    const outputFileName = outputPathForTarget(outDir, target, entrypoint);
    await fs.ensureDir(path.dirname(outputFileName));

    const args = [entrypoint, '--target', target, '--output', outputFileName];
    console.log(`[CI] Running pkg: ${args.join(' ')}`);
    await exec(args);
  }

  console.log('[CI] Build completed successfully.');
};
