#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function findRepoRoot(startDir) {
  let current = path.resolve(startDir);
  while (true) {
    if (fs.existsSync(path.join(current, 'book-config.json')) && fs.existsSync(path.join(current, 'package.json'))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      throw new Error('Repository root with book-config.json and package.json was not found.');
    }
    current = parent;
  }
}

const repoRoot = findRepoRoot(process.cwd());
const repoRootReal = fs.realpathSync(repoRoot);
const errors = [];

const FIGURE_INDEX_ROUTE = '/appendices/figure-index/';
const FIGURE_INVENTORY = [
  {
    chapterRoute: '/chapters/chapter-01/',
    anchor: 'figure-01-responsibility-flow',
    title: '図1：責務とデータフロー（概念）',
    asset: 'docs/assets/images/figures/01-responsibility-flow.svg',
  },
  {
    chapterRoute: '/chapters/chapter-01/',
    anchor: 'figure-02-lab-production-comparison',
    title: '図2：アーキテクチャ比較（検証 vs 本番）',
    asset: 'docs/assets/images/figures/02-lab-production-comparison.svg',
  },
  {
    chapterRoute: '/chapters/chapter-02/',
    anchor: 'figure-03-promotion-model',
    title: '図3：検証→本番の昇格（promotion）モデル（概念）',
    asset: 'docs/assets/images/figures/03-promotion-model.svg',
  },
  {
    chapterRoute: '/chapters/chapter-02/',
    anchor: 'figure-04-configuration-differences',
    title: '図4：差分吸収（base + overlays / values）（概念）',
    asset: 'docs/assets/images/figures/04-configuration-differences.svg',
  },
  {
    chapterRoute: '/chapters/chapter-03/',
    anchor: 'figure-05-lab-layers',
    title: '図5：検証環境のレイヤ（概念）',
    asset: 'docs/assets/images/figures/05-lab-layers.svg',
  },
];

function addError(message) {
  errors.push(message);
}

function readText(relPath) {
  return fs.readFileSync(path.join(repoRoot, relPath), 'utf8');
}

function readJson(relPath) {
  try {
    return JSON.parse(readText(relPath));
  } catch (err) {
    addError(`${relPath} must be readable JSON: ${err.message}`);
    return {};
  }
}

function isInside(base, target) {
  const rel = path.relative(base, target);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

function resolveRepoPath(relPath, label, options = {}) {
  if (typeof relPath !== 'string' || relPath.trim() === '') {
    addError(`${label} must be a non-empty relative path.`);
    return null;
  }
  if (path.isAbsolute(relPath)) {
    addError(`${label} must be relative, got absolute path: ${relPath}`);
    return null;
  }

  const absPath = path.resolve(repoRoot, relPath);
  if (!isInside(repoRoot, absPath)) {
    addError(`${label} escapes repository root: ${relPath}`);
    return null;
  }

  if (options.mustExist) {
    try {
      fs.lstatSync(absPath);
    } catch (err) {
      addError(`${label} target not found: ${relPath}`);
      return null;
    }

    let realPath;
    try {
      realPath = fs.realpathSync(absPath);
    } catch (err) {
      addError(`${label} cannot be resolved: ${relPath} (${err.message})`);
      return null;
    }

    if (!isInside(repoRootReal, realPath)) {
      addError(`${label} resolves outside repository root: ${relPath} -> ${realPath}`);
      return null;
    }

    if (options.file && !fs.statSync(absPath).isFile()) {
      addError(`${label} must point to a file: ${relPath}`);
      return null;
    }
  }

  return absPath;
}

function parseScalar(rawValue) {
  const value = String(rawValue || '').trim();
  if (value === '') return '';
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }
  if (value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1).replace(/''/g, "'");
  }
  return value;
}

function parseTopLevelYaml(text) {
  const values = {};
  for (const line of text.split(/\r?\n/)) {
    if (/^\s/.test(line) || /^\s*(#|$)/.test(line)) continue;
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (rawValue.trim() === '') continue;
    values[key] = parseScalar(rawValue);
  }
  return values;
}

function parseFrontMatter(markdown, relPath) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) {
    addError(`${relPath} is missing YAML front matter.`);
    return { data: {}, body: markdown };
  }
  return {
    data: parseTopLevelYaml(match[1]),
    body: markdown.slice(match[0].length),
  };
}

function parseNavigationYaml(text) {
  const result = {};
  let currentSection = null;
  let currentItem = null;

  for (const line of text.split(/\r?\n/)) {
    if (/^\s*(#|$)/.test(line)) continue;

    const sectionMatch = line.match(/^([A-Za-z0-9_-]+):\s*$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1];
      result[currentSection] = [];
      currentItem = null;
      continue;
    }

    if (!currentSection) continue;

    const titleMatch = line.match(/^\s*-\s+title:\s*(.+)$/);
    if (titleMatch) {
      currentItem = { title: parseScalar(titleMatch[1]) };
      result[currentSection].push(currentItem);
      continue;
    }

    const pathMatch = line.match(/^\s+path:\s*(.+)$/);
    if (pathMatch && currentItem) {
      currentItem.path = parseScalar(pathMatch[1]);
    }
  }

  return result;
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    addError(`${label} mismatch: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertContains(haystack, needle, label) {
  if (!haystack.includes(needle)) {
    addError(`${label} does not contain ${JSON.stringify(needle)}.`);
  }
}

function acceptablePageTitles(entry) {
  const titles = [entry.title];
  if (entry.section === 'appendices' && entry.title.startsWith('付録：')) {
    titles.push(entry.title.replace(/^付録：/, ''));
  }
  return titles;
}

function canonicalRepoSlug(repositoryUrl) {
  const match = String(repositoryUrl || '').match(/github\.com[:/]([^/]+\/[^/.]+)(?:\.git)?$/);
  return match ? match[1] : null;
}

function normalizeHomepage(value) {
  const raw = String(value || '');
  return raw.endsWith('/') ? raw : `${raw}/`;
}

function pagesCoordinates(homepage) {
  try {
    const parsed = new URL(homepage);
    const pathname = parsed.pathname.endsWith('/') ? parsed.pathname.slice(0, -1) : parsed.pathname;
    return {
      url: parsed.origin,
      baseurl: pathname === '/' ? '' : pathname,
    };
  } catch (err) {
    addError(`book-config.json homepage must be a valid URL: ${homepage}`);
    return null;
  }
}

function collectEntries(config) {
  const structure = config.structure || {};
  const entries = [];
  for (const section of ['introduction', 'chapters', 'appendices', 'afterword']) {
    const items = structure[section] || [];
    if (!Array.isArray(items)) {
      addError(`book-config.json structure.${section} must be an array.`);
      continue;
    }
    for (const item of items) {
      entries.push({ ...item, section });
    }
  }
  return entries;
}

function docsCandidatesForPath(routePath, label) {
  if (typeof routePath !== 'string' || routePath.trim() === '') {
    addError(`${label} must be a non-empty route path.`);
    return [];
  }
  if (!routePath.startsWith('/')) {
    addError(`${label} must start with '/': ${routePath}`);
    return [];
  }
  if (/^https?:\/\//.test(routePath) || routePath.includes('://')) {
    addError(`${label} must be an internal route path: ${routePath}`);
    return [];
  }

  const withoutQuery = routePath.split(/[?#]/, 1)[0];
  const segments = withoutQuery.split('/').filter(Boolean);
  if (segments.some((segment) => segment === '..' || segment === '.')) {
    addError(`${label} must not contain relative path segments: ${routePath}`);
    return [];
  }

  if (!withoutQuery.endsWith('/')) {
    addError(`${label} should use a directory-style permalink ending with '/': ${routePath}`);
  }

  if (segments.length === 0) {
    return ['docs/index.md'];
  }

  return [
    path.join('docs', ...segments) + '.md',
    path.join('docs', ...segments, 'index.md'),
  ];
}

function resolveDocsPage(routePath, label) {
  const candidates = docsCandidatesForPath(routePath, label);
  for (const candidate of candidates) {
    const abs = resolveRepoPath(candidate, `${label} candidate`, { mustExist: false });
    if (!abs) continue;
    if (!fs.existsSync(abs)) continue;
    return resolveRepoPath(candidate, `${label} target`, { mustExist: true, file: true });
  }
  addError(`${label} target page not found for route ${routePath}; tried ${candidates.join(', ')}`);
  return null;
}

function validateMetadata(config, pkg, lockRoot, docsConfig, indexFrontMatter, readme) {
  const repoSlug = canonicalRepoSlug(config.repository && config.repository.url);
  if (!repoSlug) {
    addError('book-config.json repository.url must be a GitHub repository URL.');
    return;
  }
  const repoName = repoSlug.split('/')[1];
  const pages = pagesCoordinates(config.homepage);

  assertEqual(pkg.name, repoName, 'package.json name');
  assertEqual(pkg.version, config.version, 'package.json version');
  assertEqual(pkg.description, config.description, 'package.json description');
  assertEqual(pkg.author, config.author, 'package.json author');
  assertEqual(pkg.license, config.license, 'package.json license');
  assertEqual(pkg.repository && pkg.repository.type, 'git', 'package.json repository.type');
  assertEqual(pkg.repository && pkg.repository.url, config.repository.url, 'package.json repository.url');
  assertEqual(normalizeHomepage(pkg.homepage), config.homepage, 'package.json homepage');
  assertEqual(pkg.bugs && pkg.bugs.url, `https://github.com/${repoSlug}/issues`, 'package.json bugs.url');

  assertEqual(lockRoot.name, pkg.name, 'package-lock root name');
  assertEqual(lockRoot.version, pkg.version, 'package-lock root version');
  assertEqual(lockRoot.license, pkg.license, 'package-lock root license');

  assertEqual(docsConfig.title, config.title, 'docs/_config.yml title');
  assertEqual(docsConfig.description, config.description, 'docs/_config.yml description');
  assertEqual(docsConfig.author, config.author, 'docs/_config.yml author');
  assertEqual(docsConfig.version, config.version, 'docs/_config.yml version');
  assertEqual(docsConfig.lang, config.language, 'docs/_config.yml lang');
  assertEqual(docsConfig.repository, repoSlug, 'docs/_config.yml repository');
  assertEqual(docsConfig.repository_branch, config.repository.branch, 'docs/_config.yml repository_branch');
  assertEqual(docsConfig.repository_docs_path, 'docs', 'docs/_config.yml repository_docs_path');
  if (pages) {
    assertEqual(docsConfig.url, pages.url, 'docs/_config.yml url');
    assertEqual(docsConfig.baseurl, pages.baseurl, 'docs/_config.yml baseurl');
  }

  assertEqual(indexFrontMatter.layout, 'book', 'docs/index.md front matter layout');
  assertEqual(indexFrontMatter.title, config.title, 'docs/index.md front matter title');
  assertEqual(indexFrontMatter.description, config.description, 'docs/index.md front matter description');
  assertEqual(indexFrontMatter.author, config.author, 'docs/index.md front matter author');
  assertEqual(indexFrontMatter.version, config.version, 'docs/index.md front matter version');

  assertContains(readme, config.homepage, 'README.md online URL');
  assertContains(readme, 'npm run check:metadata', 'README.md quality gate');
  assertContains(readme, 'npm test', 'README.md test command');
}

function validateEntries(entries) {
  const seenIds = new Set();
  const seenPaths = new Set();

  for (const entry of entries) {
    const label = `book-config.json structure.${entry.section}.${entry.id || '<missing-id>'}`;
    if (!entry.id) {
      addError(`${label} is missing id.`);
    } else {
      if (seenIds.has(entry.id)) addError(`${label} id is duplicated: ${entry.id}`);
      seenIds.add(entry.id);
    }

    if (!entry.path) {
      addError(`${label}.path is missing.`);
      continue;
    }
    if (seenPaths.has(entry.path)) addError(`${label}.path is duplicated: ${entry.path}`);
    seenPaths.add(entry.path);

    const docsAbs = resolveDocsPage(entry.path, `${label}.path`);
    if (!docsAbs) continue;

    const relPath = path.relative(repoRoot, docsAbs);
    const parsed = parseFrontMatter(fs.readFileSync(docsAbs, 'utf8'), relPath);
    assertEqual(parsed.data.layout, 'book', `${relPath} front matter layout`);
    const pageTitles = acceptablePageTitles(entry);
    if (!pageTitles.includes(parsed.data.title)) {
      addError(`${relPath} front matter title mismatch: expected one of ${JSON.stringify(pageTitles)}, got ${JSON.stringify(parsed.data.title)}`);
    }
  }
}

function validateNavigation(config, nav) {
  const expected = {};
  for (const section of ['introduction', 'chapters', 'appendices', 'afterword']) {
    expected[section] = Array.isArray(config.structure && config.structure[section])
      ? config.structure[section]
      : [];
  }
  const expectedSections = new Set(Object.keys(expected));

  for (const section of Object.keys(nav)) {
    if (!expectedSections.has(section)) {
      addError(`docs/_data/navigation.yml has unexpected section: ${section}`);
    }
  }

  for (const section of Object.keys(expected)) {
    const actualItems = nav[section] || [];
    const expectedItems = expected[section];
    assertEqual(actualItems.length, expectedItems.length, `docs/_data/navigation.yml ${section} item count`);
    const max = Math.min(actualItems.length, expectedItems.length);
    for (let i = 0; i < max; i += 1) {
      assertEqual(actualItems[i].title, expectedItems[i].title, `docs/_data/navigation.yml ${section}[${i}].title`);
      assertEqual(actualItems[i].path, expectedItems[i].path, `docs/_data/navigation.yml ${section}[${i}].path`);
      resolveDocsPage(actualItems[i].path, `docs/_data/navigation.yml ${section}[${i}].path`);
    }
  }
}

function validateRequiredAssets() {
  const requiredAssets = [
    'docs/assets/css/main.css',
    'docs/assets/css/syntax-highlighting.css',
    'docs/assets/js/theme.js',
    'docs/assets/js/search.js',
    'docs/assets/js/code-copy-lightweight.js',
  ];
  for (const relPath of requiredAssets) {
    resolveRepoPath(relPath, `required asset ${relPath}`, { mustExist: true, file: true });
  }
}

function validateFigureIndex(config, entries, nav, indexBody) {
  const modules = config.ux && config.ux.modules;
  if (!modules || modules.figureIndex !== true) {
    addError('book-config.json ux.modules.figureIndex must be true when the figure index is published.');
  }

  const configuredFigures = entries.filter((entry) => entry.id === 'figure-index');
  assertEqual(configuredFigures.length, 1, 'book-config.json figure-index configured item count');
  if (configuredFigures.length === 1) {
    assertEqual(configuredFigures[0].path, FIGURE_INDEX_ROUTE, 'book-config.json figure-index route');
    assertEqual(configuredFigures[0].title, '付録：図表索引', 'book-config.json figure-index title');
  }

  const appendixNav = nav.appendices || [];
  const navFigureIndex = appendixNav.filter((item) => item.path === FIGURE_INDEX_ROUTE);
  assertEqual(navFigureIndex.length, 1, 'docs/_data/navigation.yml figure-index item count');
  if (navFigureIndex.length === 1) {
    assertEqual(navFigureIndex[0].title, '付録：図表索引', 'docs/_data/navigation.yml figure-index title');
  }

  assertContains(indexBody, '(appendices/figure-index/)', 'docs/index.md figure-index top link');
  const figureIndexAbs = resolveDocsPage(FIGURE_INDEX_ROUTE, 'figure index route');
  if (!figureIndexAbs) return;
  const figureIndexRel = path.relative(repoRoot, figureIndexAbs);
  const figureIndex = parseFrontMatter(fs.readFileSync(figureIndexAbs, 'utf8'), figureIndexRel);
  assertEqual(figureIndex.data.layout, 'book', `${figureIndexRel} front matter layout`);
  assertEqual(figureIndex.data.title, '図表索引', `${figureIndexRel} front matter title`);
  assertContains(figureIndex.body, '# 図表索引', `${figureIndexRel} heading`);
  if (/(screenshot|favicon|スクリーンショット|ファビコン)/i.test(figureIndex.body)) {
    addError(`${figureIndexRel} must not list screenshots, planned images, or favicon assets.`);
  }

  const expectedAnchors = FIGURE_INVENTORY.map((figure) => figure.anchor);
  const indexFigureLinks = Array.from(figureIndex.body.matchAll(/\]\([^)]*#(figure-\d{2}-[a-z0-9-]+)\)/g), (match) => match[1]);
  const indexStableAnchors = Array.from(figureIndex.body.matchAll(/\{:\s*#(figure-\d{2}-[a-z0-9-]+)\s*\}/g), (match) => match[1]);
  assertEqual(indexFigureLinks.length, FIGURE_INVENTORY.length, `${figureIndexRel} exact figure link count`);
  assertEqual(JSON.stringify(indexFigureLinks), JSON.stringify(expectedAnchors), `${figureIndexRel} figure link order`);
  assertEqual(new Set(indexFigureLinks).size, FIGURE_INVENTORY.length, `${figureIndexRel} figure links must be one-to-one`);
  assertEqual(JSON.stringify(indexStableAnchors), JSON.stringify(expectedAnchors), `${figureIndexRel} stable index anchor order`);

  const chapterBodies = new Map();
  const staticSvgRefs = [];
  let figureAnchorCount = 0;
  for (const figure of FIGURE_INVENTORY) {
    if (!chapterBodies.has(figure.chapterRoute)) {
      const chapterAbs = resolveDocsPage(figure.chapterRoute, `figure inventory ${figure.chapterRoute}`);
      if (!chapterAbs) continue;
      chapterBodies.set(figure.chapterRoute, {
        relPath: path.relative(repoRoot, chapterAbs),
        body: parseFrontMatter(fs.readFileSync(chapterAbs, 'utf8'), path.relative(repoRoot, chapterAbs)).body,
      });
    }
    const chapter = chapterBodies.get(figure.chapterRoute);
    if (!chapter) continue;
    const assetFromChapter = figure.asset.replace(/^docs\//, '../../');
    assertContains(chapter.body, `<figure id="${figure.anchor}">`, `${chapter.relPath} stable figure anchor`);
    assertContains(chapter.body, `## ${figure.title}`, `${chapter.relPath} figure heading`);
    assertContains(chapter.body, `<img src="${assetFromChapter}"`, `${chapter.relPath} static SVG reference`);
    assertContains(chapter.body, `<figcaption>${figure.title}`, `${chapter.relPath} figure caption`);
    assertContains(figureIndex.body, `#${figure.anchor}`, `${figureIndexRel} figure anchor reference`);
    assertContains(figureIndex.body, figure.title, `${figureIndexRel} figure title`);

    const svgAbs = resolveRepoPath(figure.asset, `figure inventory asset ${figure.asset}`, { mustExist: true, file: true });
    if (svgAbs) {
      const svg = fs.readFileSync(svgAbs, 'utf8');
      assertContains(svg, '<svg', `${figure.asset} SVG root`);
      assertContains(svg, 'role="img"', `${figure.asset} accessible role`);
      assertContains(svg, '<title', `${figure.asset} meaningful title`);
      assertContains(svg, '<desc', `${figure.asset} meaningful description`);
      if (/<script\b|<foreignObject\b|(?:href|xlink:href)=["']https?:\/\//i.test(svg)) {
        addError(`${figure.asset} must be a self-contained static SVG without scripts or external runtime dependencies.`);
      }
    }
  }

  for (const chapter of chapterBodies.values()) {
    if (/```mermaid/i.test(chapter.body)) {
      addError(`${chapter.relPath} must not retain Mermaid runtime diagrams after static SVG conversion.`);
    }
    figureAnchorCount += (chapter.body.match(/<figure id="figure-\d{2}-[a-z0-9-]+">/g) || []).length;
    staticSvgRefs.push(...Array.from(chapter.body.matchAll(/<img src="(\.\.\/\.\.\/assets\/images\/figures\/[^"]+\.svg)"/g), (match) => match[1]));
  }
  assertEqual(figureAnchorCount, FIGURE_INVENTORY.length, 'chapter exact static figure inventory count');
  assertEqual(JSON.stringify(staticSvgRefs), JSON.stringify(FIGURE_INVENTORY.map((figure) => figure.asset.replace(/^docs\//, '../../'))), 'chapter static SVG inventory order');

  const figureDir = resolveRepoPath('docs/assets/images/figures', 'static figure asset directory', { mustExist: true });
  if (figureDir) {
    const actualAssets = fs.readdirSync(figureDir).filter((name) => name.endsWith('.svg')).sort();
    const expectedAssets = FIGURE_INVENTORY.map((figure) => path.basename(figure.asset)).sort();
    assertEqual(JSON.stringify(actualAssets), JSON.stringify(expectedAssets), 'static SVG asset inventory');
  }
}

function main() {
  const config = readJson('book-config.json');
  const pkg = readJson('package.json');
  const lock = readJson('package-lock.json');
  const lockRoot = lock.packages && lock.packages[''] ? lock.packages[''] : {};
  const docsConfig = parseTopLevelYaml(readText('docs/_config.yml'));
  const index = parseFrontMatter(readText('docs/index.md'), 'docs/index.md');
  const nav = parseNavigationYaml(readText('docs/_data/navigation.yml'));
  const readme = readText('README.md');
  const entries = collectEntries(config);

  validateMetadata(config, pkg, lockRoot, docsConfig, index.data, readme);
  validateEntries(entries);
  validateNavigation(config, nav);
  validateRequiredAssets();
  validateFigureIndex(config, entries, nav, index.body);

  if (errors.length > 0) {
    console.error('❌ Metadata consistency check failed:');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log(`✅ Metadata consistency check passed (${entries.length} configured pages).`);
}

main();
