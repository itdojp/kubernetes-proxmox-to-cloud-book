#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const REQUIRED_MARKERS = {
  'docs/index.md': [
    '情報の確認日**は 2026-05-23（Asia/Tokyo）',
    '確認日時点の現行版**は 2026-05-21 公開の Proxmox VE 9.2',
    '本書で実機検証した版**は記録がないため、検証済み版を主張しません',
  ],
  'docs/appendices/version-matrix/index.md': [
    '情報の確認日',
    '確認日時点の現行版',
    '本書で検証した版',
    'Proxmox VE 9.2（2026-05-21 公開）',
    '実機検証した版の記録なし（検証済みとは扱わない）',
    'proxmox-virtual-environment-9-2',
  ],
};

const STALE_CURRENT_91_PATTERNS = [
  /Proxmox VE 9\.1[^\n]{0,80}(?:が利用可能|が現行版|を現行版|を最新(?:版)?)/,
  /Proxmox VE 9\.1[^\n]{0,120}(?:現行版|最新(?:版)?)/,
  /(?:確認日時点|確認時点|2026-05-23 時点)[^\n]{0,120}(?:現行版|最新(?:版)?|利用可能)[^\n]{0,80}(?:Proxmox VE )?9\.1/,
  /(?:確認日時点|確認時点|2026-05-23 時点)[^\n]{0,120}(?:Proxmox VE )?9\.1[^\n]{0,80}(?:公式確認|利用可能|現行版|最新(?:版)?)/,
];

function collectMarkdownFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === '_site') return [];
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectMarkdownFiles(entryPath);
    return entry.isFile() && entry.name.endsWith('.md') ? [entryPath] : [];
  });
}

function checkSnapshot(contents) {
  const errors = [];

  for (const [relPath, markers] of Object.entries(REQUIRED_MARKERS)) {
    const content = contents[relPath];
    if (typeof content !== 'string') {
      errors.push(`${relPath} could not be read.`);
      continue;
    }
    for (const marker of markers) {
      if (!content.includes(marker)) {
        errors.push(`${relPath} is missing required marker: ${marker}`);
      }
    }
  }

  for (const [relPath, content] of Object.entries(contents)) {
    for (const pattern of STALE_CURRENT_91_PATTERNS) {
      if (pattern.test(content)) {
        errors.push(`${relPath} retains stale wording that presents Proxmox VE 9.1 as current.`);
        break;
      }
    }
  }

  return errors;
}

function readContents() {
  const candidates = [path.join(repoRoot, 'README.md'), ...collectMarkdownFiles(path.join(repoRoot, 'docs'))]
    .filter((filePath) => fs.existsSync(filePath));
  return Object.fromEntries(candidates.map((filePath) => [
    path.relative(repoRoot, filePath).split(path.sep).join('/'),
    fs.readFileSync(filePath, 'utf8'),
  ]));
}

function runSelfTest() {
  for (const staleWording of [
    '2026-05-23 時点では Proxmox VE 9.1 を公式確認。',
    'Proxmox VE 9.1 は、2026-05-23 時点の現行版です。',
  ]) {
    const staleContents = readContents();
    staleContents['docs/appendices/version-matrix/index.md'] = (staleContents['docs/appendices/version-matrix/index.md'] || '')
      + `\n${staleWording}\n`;
    const staleErrors = checkSnapshot(staleContents);
    if (!staleErrors.some((error) => error.includes('presents Proxmox VE 9.1 as current'))) {
      console.error(`❌ Proxmox version snapshot self-test failed: stale wording was not rejected: ${staleWording}`);
      process.exit(1);
    }
  }

  const historicalContents = readContents();
  historicalContents['README.md'] = `${historicalContents['README.md'] || ''}\nProxmox VE 9.1 は歴史的な検証対象として記録する。\n`;
  const historicalErrors = checkSnapshot(historicalContents);
  if (historicalErrors.length > 0) {
    console.error(`❌ Proxmox version snapshot self-test failed: historical 9.1 wording was rejected:\n- ${historicalErrors.join('\n- ')}`);
    process.exit(1);
  }

  console.log('✅ Proxmox version snapshot self-test passed (stale current wording rejected; historical wording accepted).');
}

function main() {
  if (process.argv.includes('--self-test')) {
    runSelfTest();
    return;
  }

  const errors = checkSnapshot(readContents());
  if (errors.length > 0) {
    console.error('❌ Proxmox version snapshot check failed:');
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }
  console.log('✅ Proxmox version snapshot check passed.');
}

main();
