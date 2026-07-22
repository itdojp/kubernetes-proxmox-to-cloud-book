#!/usr/bin/env node
/* Mutation regression for the Issue #20 visual-evidence contract. */
const fs = require('fs');
const path = require('path');
const { validateVisualEvidence } = require('./check-visual-evidence');

const repoRoot = path.resolve(__dirname, '..');
const cacheRoot = path.join(repoRoot, 'node_modules', '.cache');
fs.mkdirSync(cacheRoot, { recursive: true });
const fixtureRoot = fs.mkdtempSync(path.join(cacheRoot, 'kptc-issue-20-visual-'));

function copy(relativePath) {
  const source = path.join(repoRoot, relativePath);
  const target = path.join(fixtureRoot, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(source, target, { recursive: true });
}

for (const item of [
  'docs/assets/images/screenshots',
  'docs/assets/css/main.css',
  'docs/introduction/quickstart.md',
  'docs/chapters/chapter-03/index.md',
  'docs/chapters/chapter-11/index.md',
  'package.json',
  '.github/workflows/book-qa.yml',
]) copy(item);

const manifestPath = path.join(fixtureRoot, 'docs/assets/images/screenshots/manifest.json');
const baselineManifest = fs.readFileSync(manifestPath, 'utf8');
function readManifest() { return JSON.parse(fs.readFileSync(manifestPath, 'utf8')); }
function writeManifest(value) { fs.writeFileSync(manifestPath, JSON.stringify(value, null, 2) + '\n'); }

function expectFailure(name, evidence, mutate, restore) {
  try {
    mutate();
    const errors = validateVisualEvidence(fixtureRoot);
    if (!errors.some((error) => error.includes(evidence))) {
      throw new Error(name + ': expected ' + JSON.stringify(evidence) + ', got:\n' + errors.join('\n'));
    }
  } finally {
    restore();
  }
}

function expectNoFailure(name, evidence, mutate, restore) {
  try {
    mutate();
    const errors = validateVisualEvidence(fixtureRoot);
    if (errors.some((error) => error.includes(evidence))) {
      throw new Error(name + ': unexpected ' + JSON.stringify(evidence) + ':\n' + errors.join('\n'));
    }
  } finally {
    restore();
  }
}

let passed = 0;
try {
  const cases = [
    ['missing manifest entry', 'manifest entry count must be 3',
      () => { const value = readManifest(); value.entries.pop(); writeManifest(value); },
      () => fs.writeFileSync(manifestPath, baselineManifest)],
    ['reviewed digest drift', 'manifest SHA-256 differs from the reviewed raster',
      () => { const value = readManifest(); value.entries[0].sha256 = '0'.repeat(64); writeManifest(value); },
      () => fs.writeFileSync(manifestPath, baselineManifest)],
    ['source provenance drift', 'immutable source path/blob differs',
      () => { const value = readManifest(); value.entries[1].sourceBlobSha = '0'.repeat(40); writeManifest(value); },
      () => fs.writeFileSync(manifestPath, baselineManifest)],
    ['source repository drift', 'source repository/commit differs',
      () => { const value = readManifest(); value.entries[0].sourceRepository = 'example/other'; writeManifest(value); },
      () => fs.writeFileSync(manifestPath, baselineManifest)],
    ['source commit drift', 'source repository/commit differs',
      () => { const value = readManifest(); value.entries[1].sourceCommit = '0'.repeat(40); writeManifest(value); },
      () => fs.writeFileSync(manifestPath, baselineManifest)],
    ['source image digest drift', 'immutable source path/blob differs',
      () => { const value = readManifest(); value.entries[0].sourceSha256 = '0'.repeat(64); writeManifest(value); },
      () => fs.writeFileSync(manifestPath, baselineManifest)],
    ['CI source page drift', 'source run/page differs',
      () => { const value = readManifest(); value.entries[2].sourcePageSha256 = '0'.repeat(64); writeManifest(value); },
      () => fs.writeFileSync(manifestPath, baselineManifest)],
    ['alt loses decision point', 'alt and caption must state the reader decision point',
      () => { const value = readManifest(); value.entries[0].alt = 'ログイン画面'; writeManifest(value); },
      () => fs.writeFileSync(manifestPath, baselineManifest)],
    ['caption loses version', 'caption must include version 9.1.1',
      () => { const value = readManifest(); value.entries[1].caption = value.entries[1].caption.replace('9.1.1', '対象版'); writeManifest(value); },
      () => fs.writeFileSync(manifestPath, baselineManifest)],
  ];
  for (const item of cases) {
    expectFailure(item[0], item[1], item[2], item[3]);
    passed += 1;
  }

  const image = path.join(fixtureRoot, 'docs/assets/images/screenshots/ch03-pve-cluster-join-01.png');
  const baselineImage = fs.readFileSync(image);
  const symlinkTarget = path.join(fixtureRoot, 'outside-screenshot-root.txt');
  expectFailure('tracked image symlink', 'image must be a regular file',
    () => {
      fs.writeFileSync(symlinkTarget, 'must not be read as image evidence\n');
      fs.rmSync(image);
      fs.symlinkSync(symlinkTarget, image);
    },
    () => {
      fs.rmSync(image, { force: true });
      fs.rmSync(symlinkTarget, { force: true });
      fs.writeFileSync(image, baselineImage);
    });
  passed += 1;

  expectNoFailure('exact image-size boundary', 'image exceeds 512000 bytes',
    () => fs.writeFileSync(image, Buffer.concat([baselineImage, Buffer.alloc(500 * 1024 - baselineImage.length)])),
    () => fs.writeFileSync(image, baselineImage));

  expectFailure('raster tamper', 'SHA-256 does not match the published image',
    () => fs.writeFileSync(image, Buffer.concat([baselineImage, Buffer.from('tamper')])),
    () => fs.writeFileSync(image, baselineImage));
  passed += 1;

  const page = path.join(fixtureRoot, 'docs/chapters/chapter-03/index.md');
  const baselinePage = fs.readFileSync(page, 'utf8');
  expectFailure('broken page reference', 'page must reference the screenshot exactly once',
    () => fs.writeFileSync(page, baselinePage.replace('ch03-pve-cluster-join-01.png', 'missing.png')),
    () => fs.writeFileSync(page, baselinePage));
  passed += 1;

  const extra = path.join(fixtureRoot, 'docs/assets/images/screenshots/untracked.PNG');
  expectFailure('unexpected uppercase asset', 'unexpected screenshot asset',
    () => fs.copyFileSync(image, extra),
    () => fs.rmSync(extra, { force: true }));
  passed += 1;

  const css = path.join(fixtureRoot, 'docs/assets/css/main.css');
  const baselineCss = fs.readFileSync(css, 'utf8');
  expectFailure('responsive CSS drift', 'published CSS must keep screenshots responsive',
    () => fs.writeFileSync(css, baselineCss.replace('max-width: 100%;', 'max-width: none;')),
    () => fs.writeFileSync(css, baselineCss));
  passed += 1;

  const packagePath = path.join(fixtureRoot, 'package.json');
  const baselinePackage = fs.readFileSync(packagePath, 'utf8');
  expectFailure('package integration drift', 'package.json test must run check:visual-evidence',
    () => { const value = JSON.parse(baselinePackage); value.scripts.test = value.scripts.test.replace(' && npm run check:visual-evidence', ''); fs.writeFileSync(packagePath, JSON.stringify(value, null, 2) + '\n'); },
    () => fs.writeFileSync(packagePath, baselinePackage));
  passed += 1;

  const workflow = path.join(fixtureRoot, '.github/workflows/book-qa.yml');
  const baselineWorkflow = fs.readFileSync(workflow, 'utf8');
  expectFailure('Book QA integration drift', 'Book QA must run npm test in an unconditional qa job',
    () => fs.writeFileSync(workflow, baselineWorkflow.replace('run: npm test', 'run: npm run check:metadata')),
    () => fs.writeFileSync(workflow, baselineWorkflow));
  passed += 1;

  const finalErrors = validateVisualEvidence(fixtureRoot);
  if (finalErrors.length) throw new Error('restored fixture failed:\n' + finalErrors.join('\n'));
  console.log('Visual-evidence regression passed: ' + passed + '/' + passed + ' negative mutations and 1/1 restored baseline.');
} finally {
  fs.rmSync(fixtureRoot, { recursive: true, force: true });
}
