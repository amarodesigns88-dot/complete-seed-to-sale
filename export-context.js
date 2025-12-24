// export-context.js
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.resolve(__dirname, 'exported_context');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

ensureDir(OUTPUT_DIR);

// Helper to copy the first existing candidate path
function copyFirstExisting(candidates, destFilename) {
  for (const p of candidates) {
    const abs = path.resolve(__dirname, p);
    if (fs.existsSync(abs)) {
      fs.copyFileSync(abs, path.join(OUTPUT_DIR, destFilename));
      console.log(`Copied ${p} -> ${path.join('exported_context', destFilename)}`);
      return true;
    }
  }
  console.log(`None of the candidate paths for ${destFilename} were found:`);
  candidates.forEach((c) => console.log(`  - ${c}`));
  return false;
}

// 1. Copy project_state.md if exists
const projectStateCandidates = ['project_state.md', 'docs/project_state.md'];
copyFirstExisting(projectStateCandidates, 'project_state.md');

// 2. Copy Prisma schema (try several common locations).
const prismaOverride = process.env.PRISMA_SCHEMA_PATH;
if (prismaOverride) {
  const abs = path.resolve(__dirname, prismaOverride);
  if (fs.existsSync(abs)) {
    const destName = path.basename(prismaOverride);
    fs.copyFileSync(abs, path.join(OUTPUT_DIR, destName));
    console.log(`Copied overridden Prisma path ${prismaOverride} -> ${path.join('exported_context', destName)}`);
  } else {
    console.log(`PRISMA_SCHEMA_PATH set to "${prismaOverride}" but file not found.`);
  }
} else {
  const prismaCandidates = [
    'prisma/schema.prisma',
    'src/prisma/schema.prisma',
    'src/prisma/prisma.service.ts',
    'src/prisma/prisma.service.js',
  ];
  copyFirstExisting(prismaCandidates, 'prisma_file');
}

// 3. Copy OpenAPI spec if exists (try multiple common filenames)
const openApiCandidates = [
  'docs/api-spec.yaml',
  'docs/api-spec.yml',
  'docs/openapi.yaml',
  'docs/openapi.yml',
  'openapi.yaml',
  'openapi.yml',
  'docs/api-spec.json',
  'openapi.json',
];
copyFirstExisting(openApiCandidates, 'api-spec');

// 4. Copy other helpful files (examples)
const extraCandidates = [
  'README.md',
  'package.json',
  'src/prisma/seed.ts',
  'src/prisma/seed.js',
  'project_state.md',
  'docs/roadmap.md',
];

extraCandidates.forEach((p) => {
  const abs = path.resolve(__dirname, p);
  if (fs.existsSync(abs)) {
    fs.copyFileSync(abs, path.join(OUTPUT_DIR, path.basename(p)));
    console.log(`Copied ${p} -> ${path.join('exported_context', path.basename(p))}`);
  }
});

console.log('Context export complete. Check the exported_context folder.');
console.log('Tip: set PRISMA_SCHEMA_PATH env var to explicitly point to your Prisma schema or service, e.g.:');
console.log('  PRISMA_SCHEMA_PATH=src/prisma/schema.prisma npm run export-context');