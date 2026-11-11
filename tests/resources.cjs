// Check the extension as Chrome loads it: root-relative entries, page-relative assets,
// worker-relative imports, and dynamically registered Harvest resources.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
const harvest = require('../src/integrations/harvest/policy.js');
const checked = new Set();

function resource(name, base = root) {
  const absolute = path.resolve(base, name);
  assert.ok(absolute.startsWith(root + path.sep), `Resource escapes the extension root: ${name}`);
  assert.ok(fs.statSync(absolute).isFile(), `Missing resource: ${name}`);
  checked.add(absolute);
  return absolute;
}

resource(manifest.background.service_worker);
resource(manifest.action.default_popup);
for (const name of Object.values(manifest.icons)) resource(name);
for (const name of Object.values(manifest.action.default_icon)) resource(name);
for (const entry of manifest.content_scripts) {
  for (const name of [...(entry.js || []), ...(entry.css || [])]) resource(name);
}
for (const name of [...harvest.registration.js, ...harvest.registration.css]) resource(name);

// Follow all packaged HTML links, including popup → guide → privacy.
for (const folder of ['popup', 'guide']) {
  for (const name of fs.readdirSync(path.join(root, 'src', folder))) {
    if (!name.endsWith('.html')) continue;
    const file = resource(`src/${folder}/${name}`);
    const html = fs.readFileSync(file, 'utf8');
    assert.ok(
      !/<script\b[^>]*>(?!\s*<\/script>)[\s\S]*?<\/script>/i.test(
        html.replace(/<script\b[^>]*\bsrc=[^>]*><\/script>/gi, '')
      ),
      `Inline executable script: ${file}`
    );
    assert.ok(!/\son\w+\s*=/i.test(html), `Inline event handler: ${file}`);
    for (const [, href] of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
      if (/^(?:[a-z]+:|#)/i.test(href)) continue;
      resource(href.split('#')[0], path.dirname(file));
    }
  }
}

function scripts(folder) {
  return fs.readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(folder, entry.name);
    return entry.isDirectory() ? scripts(file) : file.endsWith('.js') ? [file] : [];
  });
}
for (const file of scripts(path.join(root, 'src'))) {
  const code = fs.readFileSync(file, 'utf8');
  for (const [, name] of code.matchAll(/getURL\(['"]([^'"]+)['"]\)/g)) resource(name);
  for (const [, args] of code.matchAll(/importScripts\(([^)]+)\)/g)) {
    for (const [, name] of args.matchAll(/['"]([^'"]+)['"]/g)) resource(name, path.dirname(file));
  }
}
assert.ok(
  !manifest.permissions.includes('tabs'),
  'Keep matching-host URL access scoped; do not add general tabs access.'
);
assert.ok(!JSON.stringify(manifest).includes('<all_urls>'));
console.log(
  `PASS: ${checked.size} runtime resource paths, HTML CSP boundaries and scoped permissions.`
);
