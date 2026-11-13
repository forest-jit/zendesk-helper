// Local-only UI: read one chosen export, start a job, then review/download the result.
// Generated text is inserted with textContent. Ticket HTML is never executed.
'use strict';
const $ = (id) => document.getElementById(id);
let token = '',
  current = null,
  polling = null,
  running = false,
  ready = false;
async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { 'X-Review-Token': token, ...(options.headers || {}) }
  });
  const data = await response.json();
  if (!response.ok) throw Error(data.error || 'The local request failed.');
  return data;
}
function controls() {
  $('start').disabled = !ready || running || !$('ticket-file').files[0];
  $('ticket-file').disabled = running;
  $('read-images').disabled = running;
}
function fail(message) {
  $('error').textContent = message;
  $('error').hidden = false;
}
function list(id, entries) {
  $(id).replaceChildren();
  for (const text of entries) {
    const li = document.createElement('li');
    li.textContent = text;
    $(id).append(li);
  }
}
function statements(id, entries, empty) {
  $(id).replaceChildren();
  if (!entries.length && empty) return list(id, [empty]);
  for (const item of entries) {
    const li = document.createElement('li');
    li.textContent = item.text + ' (' + item.sources.join(', ') + ')';
    const quote = document.createElement('blockquote');
    quote.textContent = item.evidence;
    li.append(quote);
    $(id).append(li);
  }
}
function render(result) {
  current = result;
  const s = result.summary;
  $('result-title').textContent = s.title;
  $('summary').textContent = s.summary;
  $('conclusion').textContent =
    s.conclusion + (s.conclusionSources.length ? ' (' + s.conclusionSources.join(', ') + ')' : '');
  $('resolution').textContent =
    'Resolution in the record: ' + s.resolutionStatus.replaceAll('_', ' ') + '.';
  statements('actions', s.actions, 'No supported actions were extracted.');
  statements('verification', s.verification, 'No explicit verification was recorded.');
  list('review-notes', s.reviewNotes || []);
  $('review-checks').hidden = !s.reviewNotes?.length;
  $('knowledge').replaceChildren();
  if (!s.knowledge.length) {
    const p = document.createElement('p');
    p.textContent =
      'No reusable procedure was established. The summary may still be useful as case context.';
    $('knowledge').append(p);
  }
  for (const item of s.knowledge) {
    const h = document.createElement('h4'),
      p = document.createElement('p'),
      source = document.createElement('p');
    h.textContent = item.heading;
    p.textContent = item.content;
    source.className = 'secondary';
    source.textContent = 'Evidence: ' + item.sources.join(', ');
    const quote = document.createElement('blockquote');
    quote.textContent = item.evidence;
    $('knowledge').append(h, p, source, quote);
  }
  list(
    'questions',
    s.openQuestions.length
      ? s.openQuestions
      : ['No further questions were identified by the model. Check against the source.']
  );
  $('message-evidence').replaceChildren();
  for (const item of result.sourceReferences) {
    const h = document.createElement('h4'),
      p = document.createElement('p');
    h.textContent = item.id + ' · ' + item.visibility;
    p.textContent = item.text;
    p.className = 'source-message';
    $('message-evidence').append(h, p);
  }
  $('image-notes').replaceChildren();
  for (const item of result.imageObservations) {
    const p = document.createElement('p');
    p.textContent = item.id + ' (unverified): ' + item.notes;
    $('image-notes').append(p);
  }
  $('images').hidden = !result.imageObservations.length;
  $('coverage').textContent =
    result.sourceCommentCount +
    ' messages; ' +
    result.imagesAnalyzed +
    ' images read; ' +
    result.missingMedia.length +
    ' unavailable; ' +
    result.imagesSkippedByChoice +
    ' skipped by choice. C1 means the first exported message, C2 the second, and so on.';
  $('review').hidden = false;
}
async function poll(id) {
  try {
    const job = await api('/api/jobs/' + id);
    $('progress').textContent = job.stage;
    if (job.state === 'ready') {
      running = false;
      controls();
      render(job.result);
      return;
    }
    if (job.state === 'error') {
      running = false;
      controls();
      fail(job.error);
      return;
    }
    polling = setTimeout(() => poll(id), 2000);
  } catch (error) {
    running = false;
    controls();
    fail(error.message + ' Keep the server running and refresh to check this review.');
  }
}
$('ticket-file').addEventListener('change', controls);
$('start').addEventListener('click', async () => {
  $('error').hidden = true;
  $('review').hidden = true;
  current = null;
  running = true;
  controls();
  try {
    const file = $('ticket-file').files[0];
    if (!file || file.size > 60 * 1024 * 1024)
      throw Error('Choose a raw ticket export smaller than 60 MB.');
    let ticket;
    try {
      ticket = JSON.parse(await file.text());
    } catch {
      throw Error('This is not a valid JSON export. Choose the raw ticket file.');
    }
    const job = await api('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticket, readImages: $('read-images').checked })
    });
    sessionStorage.setItem('reviewJob', job.id);
    clearTimeout(polling);
    await poll(job.id);
  } catch (error) {
    running = false;
    controls();
    fail(error.message);
  }
});
function download(content, filename, type) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([content], { type }));
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}
$('markdown').addEventListener('click', () => {
  if (current) download(current.markdown, 'notion-draft.md', 'text/markdown');
});
$('json').addEventListener('click', () => {
  if (current) download(JSON.stringify(current, null, 2), 'processed.json', 'application/json');
});
$('copy').addEventListener('click', async () => {
  try {
    if (current) await navigator.clipboard.writeText(current.markdown);
  } catch {
    fail('Copy was blocked. Use Download Notion draft instead.');
  }
});
(async () => {
  token = (await (await fetch('/api/session')).json()).token;
  const health = await api('/api/status');
  ready = health.ready;
  $('health').textContent = health.message;
  controls();
  const id = sessionStorage.getItem('reviewJob');
  if (id) {
    running = true;
    controls();
    await poll(id);
  }
})().catch((error) => fail(error.message));
