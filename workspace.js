'use strict';
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.zdhWorkspace = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  const selectors = {
    grid: '[data-test-id^="ticket-"][data-test-id$="-standard-layout"]',
    properties: ':scope > [data-test-id="column-1"]',
    conversation: ':scope > [data-test-id="column-2"]',
    context: ':scope > [data-test-id="column-3"]',
    modeButton: '[data-test-id="omnichannel-channel-switcher-button"],button[aria-label="Public reply"],button[aria-label="Internal note"]',
    composer: '[data-test-id="ticket-rich-text-editor"],textarea,[contenteditable="true"]',
    submit: '[data-test-id="submit_button-button"]',
    statusMenu: '[data-test-id="submit_button-menu-button"],[aria-label="Displays possible ticket submission types"]',
    requester: '[data-test-id="ticket-system-field-requester-select"] input,input[aria-label="Requester"]',
    organization: '[data-test-id="organization_id-field-test-id"]',
    priority: '[data-test-id="ticket-fields-priority-view"],[aria-label="Priority"],select#priority',
    sla: '[data-test-id*="sla"],[aria-label*="SLA" i]',
    conversationLog: '[data-test-id="conversation-log"],[aria-label="Conversation log"],.conversation-log'
  };
  const isVisible = node => {
    if (!node?.isConnected || node.closest('[hidden],[aria-hidden="true"]')) return false;
    const style = getComputedStyle(node);
    return style.display !== 'none' && style.visibility !== 'hidden' && node.getClientRects().length > 0;
  };
  function findActiveGrid(doc) {
    return [...doc.querySelectorAll(selectors.grid)].find(grid => isVisible(grid) && grid.querySelector(selectors.properties) && grid.querySelector(selectors.conversation)) || null;
  }
  function composerContent(composer) {
    if (!composer) return '';
    if ('value' in composer) return composer.value;
    return composer.innerHTML || composer.textContent || '';
  }
  function readState(grid) {
    const doc = grid?.ownerDocument || document;
    const modeButton = grid?.querySelector(selectors.modeButton) || null;
    const composer = grid?.querySelector(selectors.composer) || null;
    const submit = doc.querySelector(selectors.submit);
    const statusMenu = doc.querySelector(selectors.statusMenu);
    const mode = globalThis.zdhWorkflow?.normalizeMode(modeButton?.getAttribute('aria-label') || modeButton?.textContent) || 'unknown';
    const rawStatus = (submit?.textContent.match(/Submit as\s+(.+)/i)?.[1] || 'open').trim().toLowerCase();
    const status = rawStatus === 'on hold' ? 'on-hold' : rawStatus;
    return {
      grid, modeButton, composer, submit, statusMenu, mode, status,
      composerContent: composerContent(composer),
      properties: grid?.querySelector(selectors.properties) || null,
      conversation: grid?.querySelector(selectors.conversation) || null,
      requester: grid?.querySelector(selectors.requester) || null,
      priority: grid?.querySelector(selectors.priority) || null,
      sla: grid?.querySelector(selectors.sla) || null,
      nativeReady: Boolean(modeButton && composer && submit && statusMenu)
    };
  }
  return { selectors, isVisible, findActiveGrid, composerContent, readState };
});
