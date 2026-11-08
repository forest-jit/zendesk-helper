const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'manifest.json'), 'utf8'));
const approvedOrigin = 'https://itjones.zendesk.com/agent/*';

assert.deepEqual(manifest.host_permissions, [approvedOrigin]);
assert.deepEqual(manifest.permissions, ['storage']);
assert.equal(manifest.permissions.includes('activeTab'), false);
assert.equal(manifest.permissions.includes('scripting'), false);
assert.deepEqual(manifest.content_scripts, [{
  matches: [approvedOrigin],
  css: ['content.css'],
  js: ['validator.js', 'workflow.js', 'exporter.js', 'workspace.js', 'content.js'],
  run_at: 'document_idle'
}]);

console.log('PASS: automatic injection is limited to the approved Zendesk agent origin.');
