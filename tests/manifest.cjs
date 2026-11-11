const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'manifest.json'), 'utf8'));
const approvedOrigin = 'https://itjones.zendesk.com/agent/*';

assert.deepEqual(manifest.host_permissions, [approvedOrigin]);
assert.deepEqual(manifest.permissions, ['storage', 'downloads']);
assert.deepEqual(manifest.background, { service_worker: 'background.js' });
assert.equal(manifest.permissions.includes('activeTab'), false);
assert.equal(manifest.permissions.includes('scripting'), false);
assert.deepEqual(manifest.optional_permissions, ['scripting']);
assert.deepEqual(manifest.optional_host_permissions, ['https://platform.harvestapp.com/*']);
assert.deepEqual(manifest.content_scripts, [
  { matches: [approvedOrigin], js: ['draft-bridge.js'], world: 'MAIN', run_at: 'document_idle' },
  {
    matches: [approvedOrigin],
    css: ['content.css', 'theme.css'],
    js: [
      'themes.js',
      'theme-page.js',
      'validator.js',
      'workflow.js',
      'exporter.js',
      'workspace.js',
      'ticket-model.js',
      'ticket-tools.js',
      'message-display.js',
      'email-threads.js',
      'content.js'
    ],
    run_at: 'document_idle'
  }
]);

console.log('PASS: automatic injection is limited to the approved Zendesk agent origin.');
