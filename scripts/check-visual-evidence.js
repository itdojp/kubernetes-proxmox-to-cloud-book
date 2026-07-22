#!/usr/bin/env node
/* Fail-closed contract for Issue #20 P0 visual evidence. */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const EXPECTED = [
  {
    id: 'quickstart-pve-login',
    page: 'docs/introduction/quickstart.md',
    file: 'docs/assets/images/screenshots/quickstart-pve-login-01.png',
    figureId: 'visual-evidence-quickstart-pve-login',
    sha256: '683adceb5bb8b5bf0f146e25a4204a3972bc5df8d553a4de25d797942246db7d',
    sourceKind: 'actual-web-ui',
    sourcePath: 'images/part1/ch3/10-webui-first-login.png',
    sourceBlobSha: '286c983cec79884c923eed26d5870c6c226a3a79',
  },
  {
    id: 'ch03-pve-cluster-join',
    page: 'docs/chapters/chapter-03/index.md',
    file: 'docs/assets/images/screenshots/ch03-pve-cluster-join-01.png',
    figureId: 'visual-evidence-ch03-pve-cluster-join',
    sha256: '3ea62fefb76661d5fd19457464ffe27f010f70851c38ff10c85043335b237e96',
    sourceKind: 'actual-web-ui-crop',
    sourcePath: 'images/part3/ch7/03-join-cluster-wizard.png',
    sourceBlobSha: '77135f5bdd947f312b13f190951ae178cbfe57e3',
  },
  {
    id: 'ch11-book-qa-success',
    page: 'docs/chapters/chapter-11/index.md',
    file: 'docs/assets/images/screenshots/ch11-book-qa-success-01.png',
    figureId: 'visual-evidence-ch11-book-qa-success',
    sha256: 'ef09fb5029dc1127f91cb4d6685273a3edc9fdc2dae0677eb33a2f295801410a',
    sourceKind: 'actual-public-ci-ui-crop',
    sourceRunId: 29922510576,
  },
];
const SCREENSHOT_ROOT = 'docs/assets/images/screenshots';
const MANIFEST_PATH = 'docs/assets/images/screenshots/manifest.json';
const MAX_IMAGE_BYTES = 500 * 1024;
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function count(text, value) {
  return text.split(value).length - 1;
}

function readJson(file, errors, label) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    errors.push(label + ' is not readable JSON: ' + error.message);
    return {};
  }
}

function pngDimensions(buffer) {
  if (buffer.length < 33 || !buffer.subarray(0, 8).equals(PNG_SIGNATURE)) return null;
  if (buffer.readUInt32BE(8) !== 13 || buffer.subarray(12, 16).toString('ascii') !== 'IHDR') return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function listImageFiles(root) {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(root, entry.name);
    if (entry.isDirectory()) return listImageFiles(absolute);
    return /\.(?:png|webp)$/i.test(entry.name) ? [absolute] : [];
  });
}

function qaJobBlock(workflow) {
  const lines = workflow.replace(/\r\n/g, '\n').split('\n');
  const start = lines.findIndex((line) => /^  qa:\s*$/.test(line));
  if (start < 0) return null;
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^  [A-Za-z0-9_-]+:\s*$/.test(lines[index])) {
      end = index;
      break;
    }
  }
  return lines.slice(start, end).join('\n');
}

function validateVisualEvidence(repoRoot = path.resolve(__dirname, '..')) {
  const errors = [];
  const manifest = readJson(path.join(repoRoot, MANIFEST_PATH), errors, 'visual-evidence manifest');
  const entries = Array.isArray(manifest.entries) ? manifest.entries : [];

  if (manifest.schemaVersion !== 1 || manifest.issue !== 20) errors.push('manifest must identify schemaVersion 1 and Issue 20');
  if (!/Actual UI output only/.test(manifest.policy || '') || !/fabricated operational state is prohibited/.test(manifest.policy || '')) {
    errors.push('manifest policy must require actual UI output and prohibit fabricated evidence');
  }
  if (manifest.captureTimezone !== 'Asia/Tokyo (UTC+09:00)') errors.push('manifest capture timezone must remain Asia/Tokyo');
  if (entries.length !== EXPECTED.length) errors.push('manifest entry count must be ' + EXPECTED.length);

  const ids = new Set();
  const hashes = new Set();
  const expectedFiles = new Set();
  entries.forEach((entry, index) => {
    const expected = EXPECTED[index];
    const label = entry.id || 'entry[' + index + ']';
    if (!entry.id || ids.has(entry.id)) errors.push(label + ': duplicate or missing id');
    ids.add(entry.id);
    if (!expected || entry.id !== expected.id || entry.page !== expected.page || entry.file !== expected.file) {
      errors.push(label + ': id/page/file/order differs from the fixed P0 inventory');
      return;
    }
    expectedFiles.add(entry.file);
    if (entry.sha256 !== expected.sha256) errors.push(label + ': manifest SHA-256 differs from the reviewed raster');
    if (entry.sourceKind !== expected.sourceKind) errors.push(label + ': source kind differs from the reviewed provenance');
    if (expected.sourcePath && (entry.sourcePath !== expected.sourcePath || entry.sourceBlobSha !== expected.sourceBlobSha)) {
      errors.push(label + ': immutable source path/blob differs from the reviewed provenance');
    }
    if (expected.sourceRunId && entry.sourceRunId !== expected.sourceRunId) errors.push(label + ': source run differs from the reviewed provenance');
    if (!/^https:\/\/github\.com\/itdojp\//.test(entry.sourceUrl || entry.sourceRunUrl || '')) errors.push(label + ': immutable public source URL is required');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.capturedAt || '') || !entry.dateBasis) errors.push(label + ': capture date and date basis are required');
    if (!entry.environment || !entry.versions || Object.keys(entry.versions).length === 0) errors.push(label + ': environment and versions are required');
    if (!entry.alt || !entry.alt.includes('判断点') || !entry.caption || !entry.caption.includes('判断:')) {
      errors.push(label + ': alt and caption must state the reader decision point');
    }
    if (!entry.caption || !entry.caption.includes(entry.capturedAt + ' JST') || !entry.caption.includes('対象OS/製品:') || !entry.caption.includes('公開確認:')) {
      errors.push(label + ': caption must include date/JST, OS/product, and publication inspection');
    }
    for (const version of Object.values(entry.versions || {})) {
      if (!entry.caption || !entry.caption.includes(String(version))) errors.push(label + ': caption must include version ' + version);
    }
    if (!Array.isArray(entry.excludedFields) || !entry.visualInspection) errors.push(label + ': exclusion and visual-inspection evidence are required');
    const inspectable = JSON.stringify({ alt: entry.alt, caption: entry.caption, visualInspection: entry.visualInspection });
    for (const match of inspectable.matchAll(/\b(?:\d{1,4}\.){3}\d{1,4}\b/g)) {
      if (match[0].split('.').every((part) => Number(part) <= 255)) errors.push(label + ': IPv4 address remains in public metadata');
    }
    for (const pair of [
      ['email address', /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/],
      ['GitHub token', /(?:ghp_|github_pat_)[A-Za-z0-9_]+/i],
      ['known local identity', /(?:devuser|ootakazuhiko|GMKP-OOTA)/i],
      ['absolute home path', /\/home\/[A-Za-z0-9._-]+/],
    ]) {
      if (pair[1].test(inspectable)) errors.push(label + ': ' + pair[0] + ' remains in public metadata');
    }

    const imagePath = path.join(repoRoot, entry.file);
    let buffer;
    try {
      const stat = fs.lstatSync(imagePath);
      if (!stat.isFile() || stat.isSymbolicLink()) errors.push(label + ': image must be a regular file');
      buffer = fs.readFileSync(imagePath);
    } catch (error) {
      errors.push(label + ': image is missing or unreadable');
      return;
    }
    if (buffer.length >= MAX_IMAGE_BYTES) errors.push(label + ': image exceeds ' + MAX_IMAGE_BYTES + ' bytes');
    const dimensions = pngDimensions(buffer);
    if (!dimensions) errors.push(label + ': image is not a valid PNG with IHDR');
    else if (entry.width !== dimensions.width || entry.height !== dimensions.height || entry.bytes !== buffer.length) {
      errors.push(label + ': dimensions or byte size differs from the manifest');
    }
    const digest = crypto.createHash('sha256').update(buffer).digest('hex');
    if (digest !== entry.sha256) errors.push(label + ': SHA-256 does not match the published image');
    if (hashes.has(digest)) errors.push(label + ': duplicate raster hash');
    hashes.add(digest);

    let page;
    try {
      page = fs.readFileSync(path.join(repoRoot, entry.page), 'utf8').replace(/\r\n/g, '\n');
    } catch (error) {
      errors.push(label + ': referenced page is missing');
      return;
    }
    const basename = path.basename(entry.file);
    const source = "{{ '/assets/images/screenshots/" + basename + "' | relative_url }}";
    const marker = '<figure id="' + expected.figureId + '">\n'
      + '  <img src="' + source + '" alt="' + entry.alt + '">\n'
      + '  <figcaption>' + entry.caption + '</figcaption>\n'
      + '</figure>';
    if (count(page, basename) !== 1) errors.push(label + ': page must reference the screenshot exactly once');
    if (count(page, marker) !== 1) errors.push(label + ': figure, alt, and immediate caption must exactly match the manifest');
  });

  const inventory = listImageFiles(path.join(repoRoot, SCREENSHOT_ROOT))
    .map((file) => path.relative(repoRoot, file).split(path.sep).join('/')).sort();
  const expectedInventory = [...expectedFiles].sort();
  for (const file of inventory) if (!expectedFiles.has(file)) errors.push('unexpected screenshot asset: ' + file);
  for (const file of expectedInventory) if (!inventory.includes(file)) errors.push('manifest references missing screenshot asset: ' + file);

  try {
    const css = fs.readFileSync(path.join(repoRoot, 'docs/assets/css/main.css'), 'utf8');
    const rule = css.match(/\.page-content img,\s*\.page-content svg,\s*\.page-content video\s*\{([^}]*)\}/);
    if (!rule || !/max-width:\s*100%;/.test(rule[1]) || !/height:\s*auto;/.test(rule[1])) errors.push('published CSS must keep screenshots responsive');
  } catch (error) {
    errors.push('published CSS is missing');
  }

  const packageJson = readJson(path.join(repoRoot, 'package.json'), errors, 'package.json');
  if (packageJson.scripts && packageJson.scripts['check:visual-evidence'] !== 'node scripts/check-visual-evidence.js && node scripts/check-visual-evidence-regression.js') {
    errors.push('package.json must define the complete check:visual-evidence contract');
  }
  if (!packageJson.scripts || !packageJson.scripts.test || !packageJson.scripts.test.includes('npm run check:visual-evidence')) {
    errors.push('package.json test must run check:visual-evidence');
  }
  try {
    const workflow = fs.readFileSync(path.join(repoRoot, '.github/workflows/book-qa.yml'), 'utf8');
    const qa = qaJobBlock(workflow);
    if (!qa || /^    (?:if|continue-on-error)\s*:/m.test(qa) || !/^\s+- name: Local npm QA\s*\n\s+run: npm test\s*$/m.test(qa)) {
      errors.push('Book QA must run npm test in an unconditional qa job');
    }
  } catch (error) {
    errors.push('Book QA workflow is missing');
  }
  return errors;
}

if (require.main === module) {
  const errors = validateVisualEvidence();
  if (errors.length) {
    console.error('Visual-evidence contract failed (' + errors.length + '):');
    for (const error of errors) console.error('- ' + error);
    process.exit(1);
  }
  console.log('Visual-evidence contract passed: ' + EXPECTED.length + ' P0 actual-UI screenshots with provenance, masking metadata, references, and responsive publication.');
}

module.exports = { validateVisualEvidence };
