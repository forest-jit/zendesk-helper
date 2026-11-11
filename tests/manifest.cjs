const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'manifest.json'), 'utf8'));
assert.equal(manifest.minimum_chrome_version, '114');
const approvedOrigin = 'https://itjones.zendesk.com/agent/*';

assert.deepEqual(manifest.host_permissions, [approvedOrigin]);
assert.deepEqual(manifest.permissions, ['storage', 'downloads']);
assert.deepEqual(manifest.background, { service_worker: 'src/background/service-worker.js' });
assert.equal(manifest.permissions.includes('activeTab'), false);
assert.equal(manifest.permissions.includes('scripting'), false);
assert.deepEqual(manifest.optional_permissions, ['scripting']);
assert.deepEqual(manifest.optional_host_permissions, ['https://platform.harvestapp.com/*']);
assert.deepEqual(manifest.content_scripts, [
  {
    matches: [approvedOrigin],
    js: ['src/page/draft-bridge.js'],
    world: 'MAIN',
    run_at: 'document_idle'
  },
  {
    matches: [approvedOrigin],
    css: ['src/content/layout.css', 'src/themes/native.css'],
    js: [
      'src/shared/themes.js',
      'src/themes/native.js',
      'src/tickets/title-rules.js',
      'src/tickets/workflow.js',
      'src/export/exporter.js',
      'src/tickets/workspace.js',
      'src/tickets/model.js',
      'src/tickets/tools.js',
      'src/conversations/message-display.js',
      'src/conversations/email-threads.js',
      'src/content/control-styles.js',
      'src/content/index.js'
    ],
    run_at: 'document_idle'
  }
]);

console.log('PASS: automatic injection is limited to the approved Zendesk agent origin.');
