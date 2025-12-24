#!/usr/bin/env node
/**
 * convert-ts-to-txt.js
 *
 * Usage (from project root):
 *   node scripts/convert-ts-to-txt.js
 *
 * Options (simple CLI):
 *   --src <dir>       Source root to scan (default: "src")
 *   --out <dir>       Output folder to place .txt files (default: "exported_txt")
 *   --ext <ext>       Output extension (default: ".txt")
 *   --preserve        Preserve directory structure under output folder (default: true)
 *   --dry             Dry run (log operations but don't write files)
 *
 * Notes:
 *  - Skips common folders: node_modules, .git, dist, .next, .turbo
 *  - Will recreate output folder if it already exists (it will delete it first).
 *  - Ensure you have a backup or use git — this script only reads .ts files and writes copies.
 */

const fs = require('fs').promises;
const path = require('path');

const argv = process.argv.slice(2);
function getArg(name, fallback) {
  const idx = argv.indexOf('--' + name);
  if (idx === -1) return fallback;
  const val = argv[idx + 1];
  if (!val || val.startsWith('--')) return fallback;
  return val;
}
function hasFlag(name) {
  return argv.includes('--' + name);
}

(async () => {
  try {
    const srcRoot = path.resolve(process.cwd(), getArg('src', 'src'));
    const outRoot = path.resolve(process.cwd(), getArg('out', 'exported_txt'));
    const outExt = getArg('ext', '.txt').startsWith('.') ? getArg('ext', '.txt') : '.' + getArg('ext', '.txt');
    const preserve = !hasFlag('no-preserve'); // default preserve = true
    const dryRun = hasFlag('dry');

    const excludeDirs = new Set(['node_modules', '.git', 'dist', '.next', '.turbo', 'build', 'out', 'coverage', '.vite']);

    async function rmDirIfExists(dir) {
      try {
        const stat = await fs.stat(dir);
        if (stat && stat.isDirectory()) {
          // remove recursively
          await fs.rm(dir, { recursive: true, force: true });
        }
      } catch (e) {
        // doesn't exist: ignore
      }
    }

    async function ensureDir(dir) {
      await fs.mkdir(dir, { recursive: true });
    }

    async function walkAndCollectTsFiles(dir, relativeBase = '') {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const files = [];
      for (const ent of entries) {
        const name = ent.name;
        if (excludeDirs.has(name)) continue;
        const fullPath = path.join(dir, name);
        const relPath = path.join(relativeBase, name);
        if (ent.isDirectory()) {
          files.push(...(await walkAndCollectTsFiles(fullPath, relPath)));
        } else if (ent.isFile()) {
          if (name.endsWith('.ts')) {
            // optionally skip generated prisma client from node_modules or prisma client in src? keep it if in src.
            files.push({ fullPath, relPath });
          }
        }
      }
      return files;
    }

    // Guard: ensure srcRoot exists
    try {
      await fs.access(srcRoot);
    } catch (e) {
      console.error(`Source directory does not exist: ${srcRoot}`);
      process.exit(1);
    }

    console.log(`Source root: ${srcRoot}`);
    console.log(`Output root: ${outRoot}`);
    console.log(`Output extension: ${outExt}`);
    console.log(`Preserve structure under output: ${preserve}`);
    console.log(dryRun ? 'DRY RUN: No files will be written.' : 'Will write files.');

    // Prepare output folder
    if (!dryRun) {
      await rmDirIfExists(outRoot);
      await ensureDir(outRoot);
    } else {
      console.log(`[dry] Would remove and recreate: ${outRoot}`);
    }

    const tsFiles = await walkAndCollectTsFiles(srcRoot);
    console.log(`Found ${tsFiles.length} .ts files under ${srcRoot}`);

    for (const { fullPath, relPath } of tsFiles) {
      const relDir = path.dirname(relPath);
      const baseName = path.basename(relPath, '.ts');
      const outDir = preserve ? path.join(outRoot, relDir) : outRoot;
      const outFile = path.join(outDir, baseName + outExt);

      console.log(`${dryRun ? '[dry]' : ''} Convert: ${fullPath} -> ${outFile}`);

      if (!dryRun) {
        await ensureDir(outDir);
        const content = await fs.readFile(fullPath, 'utf8');
        // Optionally you can add a header identifying origin and timestamp:
        const header = `/*\n * Source: ${path.relative(process.cwd(), fullPath)}\n * Exported: ${new Date().toISOString()}\n */\n\n`;
        await fs.writeFile(outFile, header + content, 'utf8');
      }
    }

    console.log('Done.');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();