#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const contracts = [
  {
    source: 'docs/introduction/preface.md',
    route: '/introduction/preface/',
    targets: [{ route: '/appendices/version-matrix/', count: 1 }],
  },
  {
    source: 'docs/introduction/quickstart.md',
    route: '/introduction/quickstart/',
    targets: [
      { route: '/appendices/smoke-test-checklist/', count: 2 },
      { route: '/appendices/troubleshooting/', count: 2 },
    ],
  },
  {
    source: 'docs/introduction/reading-guide.md',
    route: '/introduction/reading-guide/',
    targets: [
      { route: '/appendices/smoke-test-checklist/', count: 1 },
      { route: '/appendices/troubleshooting/', count: 1 },
    ],
  },
];

function fail(message) {
  throw new Error(message);
}

function parseBaseurl(root) {
  const config = fs.readFileSync(path.join(root, 'docs', '_config.yml'), 'utf8');
  const match = config.match(/^baseurl:\s*["']?([^"'\s]+)["']?\s*$/m);
  if (!match) fail('docs/_config.yml must define baseurl');
  const baseurl = match[1].replace(/\/$/, '');
  if (!baseurl.startsWith('/')) fail(`baseurl must start with /: ${baseurl}`);
  return baseurl;
}

function withoutCode(markdown) {
  return markdown
    .replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1\s*$/gm, '')
    .replace(/`[^`\n]*`/g, '');
}

function markdownHrefs(markdown) {
  return [...withoutCode(markdown).matchAll(/!?\[[^\]]*\]\(\s*(\{\{\s*["'][^"']+["']\s*\|\s*relative_url\s*\}\}(?:#[^\s)]+)?|<?[^>\s)]+>?)/g)]
    .map((match) => match[1]);
}

function htmlHrefs(html) {
  return [...html.matchAll(/\bhref\s*=\s*["']([^"']+)["']/gi)].map((match) => match[1]);
}

function articleHtml(html, label) {
  const match = html.match(/<article\b[^>]*class=["'][^"']*\bpage-content\b[^"']*["'][^>]*>([\s\S]*?)<\/article>/i);
  if (!match) fail(`built page content article is missing: ${label}`);
  return match[1];
}

function routeToSource(root, route) {
  return path.join(root, 'docs', route.replace(/^\//, ''), 'index.md');
}

function routeToBuilt(siteRoot, route) {
  return path.join(siteRoot, route.replace(/^\//, ''), 'index.html');
}

function expectedSourceHref(targetRoute) {
  return `{{ '${targetRoute}' | relative_url }}`;
}

function expectedBuiltHref(targetRoute, baseurl) {
  return `${baseurl}${targetRoute}`;
}

function validateBuiltHref(href, pageRoute, targetRoute, baseurl, label) {
  const base = `https://example.invalid${baseurl}${pageRoute}`;
  const resolved = new URL(href, base);
  const expectedPath = `${baseurl}${targetRoute}`;
  if (resolved.pathname !== expectedPath) {
    fail(`${label} resolves to ${resolved.pathname}, expected ${expectedPath}`);
  }
  if (resolved.search || resolved.hash) {
    fail(`${label} must not contain a query or fragment: ${href}`);
  }
}

function validateSource(root = repoRoot) {
  const baseurl = parseBaseurl(root);
  let checked = 0;
  for (const contract of contracts) {
    const sourcePath = path.join(root, contract.source);
    if (!fs.existsSync(sourcePath)) fail(`source page is missing: ${contract.source}`);
    const appendixLinks = markdownHrefs(fs.readFileSync(sourcePath, 'utf8'))
      .filter((href) => href.includes('appendices/'));
    const expectedCount = contract.targets.reduce((sum, target) => sum + target.count, 0);
    if (appendixLinks.length !== expectedCount) {
      fail(`${contract.source} has ${appendixLinks.length} appendix links, expected ${expectedCount}`);
    }
    for (const target of contract.targets) {
      const href = expectedSourceHref(target.route);
      const count = appendixLinks.filter((candidate) => candidate === href).length;
      if (count !== target.count) {
        fail(`${contract.source} has ${count} links to ${href}, expected ${target.count}`);
      }
      const targetSource = routeToSource(root, target.route);
      if (!fs.existsSync(targetSource)) fail(`appendix source target is missing: ${targetSource}`);
      const liquid = href.match(/^\{\{\s*["']([^"']+)["']\s*\|\s*relative_url\s*\}\}$/);
      if (!liquid || liquid[1] !== target.route || liquid[1].includes('#') || liquid[1].includes('?')) {
        fail(`${contract.source} has invalid relative_url contract: ${href}`);
      }
      for (let index = 0; index < target.count; index += 1) {
        const publicPath = `${baseurl}${liquid[1]}`;
        if (publicPath !== expectedBuiltHref(target.route, baseurl)) {
          fail(`${contract.source} renders to ${publicPath}, expected ${expectedBuiltHref(target.route, baseurl)}`);
        }
        checked += 1;
      }
    }
  }
  if (checked !== 7) fail(`checked ${checked} source links, expected exact 7`);
  console.log(`OK: exact ${checked} introduction-to-appendix source links (route/baseurl/fragment)`);
}

function validateBuilt(siteRoot) {
  const baseurl = parseBaseurl(repoRoot);
  let checked = 0;
  for (const contract of contracts) {
    const builtPage = routeToBuilt(siteRoot, contract.route);
    if (!fs.existsSync(builtPage)) fail(`built introduction page is missing: ${builtPage}`);
    const html = fs.readFileSync(builtPage, 'utf8');
    const hrefs = htmlHrefs(articleHtml(html, builtPage));
    for (const target of contract.targets) {
      const targetPage = routeToBuilt(siteRoot, target.route);
      if (!fs.existsSync(targetPage)) fail(`built appendix target is missing: ${targetPage}`);
      const href = expectedBuiltHref(target.route, baseurl);
      const count = hrefs.filter((candidate) => candidate === href).length;
      if (count !== target.count) {
        fail(`${contract.route} built HTML has ${count} links to ${href}, expected ${target.count}`);
      }
      for (let index = 0; index < target.count; index += 1) {
        validateBuiltHref(href, contract.route, target.route, baseurl, builtPage);
        checked += 1;
      }
    }
  }
  if (checked !== 7) fail(`checked ${checked} built links, expected exact 7`);
  console.log(`OK: exact ${checked} built introduction-to-appendix links and 6 page artifacts`);
}

function writeFixture(root) {
  fs.mkdirSync(path.join(root, 'docs', 'introduction'), { recursive: true });
  for (const target of contracts.flatMap((contract) => contract.targets)) {
    const targetFile = routeToSource(root, target.route);
    fs.mkdirSync(path.dirname(targetFile), { recursive: true });
    fs.writeFileSync(targetFile, '# Appendix\n');
  }
  fs.writeFileSync(path.join(root, 'docs', '_config.yml'), 'baseurl: "/fixture-book"\n');
  for (const contract of contracts) {
    const links = contract.targets.flatMap((target) =>
      Array.from({ length: target.count }, () => `[appendix](${expectedSourceHref(target.route)})`));
    fs.writeFileSync(path.join(root, contract.source), `${links.join('\n')}\n`);
  }
}

function selfTest() {
  const tempParent = path.join(repoRoot, '.codex-local', 'tmp');
  fs.mkdirSync(tempParent, { recursive: true });
  const fixtureRoot = fs.mkdtempSync(path.join(tempParent, 'introduction-appendix-links-'));
  try {
    writeFixture(fixtureRoot);
    validateSource(fixtureRoot);

    const preface = path.join(fixtureRoot, contracts[0].source);
    const valid = fs.readFileSync(preface, 'utf8');
    fs.writeFileSync(preface, valid.replace(expectedSourceHref(contracts[0].targets[0].route), '../appendices/version-matrix/'));
    let oldPathDetected = false;
    try {
      validateSource(fixtureRoot);
    } catch (error) {
      oldPathDetected = /expected|links to/.test(error.message);
    }
    if (!oldPathDetected) fail('old one-level appendix path fixture must fail');

    fs.writeFileSync(preface, valid.replace('}})', '}}#missing)'));
    let fragmentDetected = false;
    try {
      validateSource(fixtureRoot);
    } catch (error) {
      fragmentDetected = /expected|fragment|links to/.test(error.message);
    }
    if (!fragmentDetected) fail('unexpected appendix fragment fixture must fail');
  } finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  }
  console.log('OK: negative fixtures detect old relative depth and unexpected fragment');
}

function main(argv) {
  if (argv.length === 0) return validateSource();
  if (argv.length === 1 && argv[0] === '--self-test') return selfTest();
  if (argv.length === 2 && argv[0] === '--built-site') return validateBuilt(path.resolve(repoRoot, argv[1]));
  fail(`usage: ${path.basename(__filename)} [--self-test | --built-site PATH]`);
}

if (require.main === module) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    process.exit(1);
  }
}

module.exports = { markdownHrefs, validateSource, validateBuilt, selfTest };
