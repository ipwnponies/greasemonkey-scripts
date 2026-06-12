// ==UserScript==
// @name        Desktop shortcuts - claude.ai
// @namespace   ipwnponies
// @match       https://claude.ai/*
// @grant       GM.addStyle
// @version     1.0.0
// @require     https://cdn.jsdelivr.net/npm/@violentmonkey/shortcut@1
// @description Keyboard shortcuts for mic, model, mode, file attach, and command palette
// ==/UserScript==

const { register } = VM.shortcut;

const XPATH_MODE = '//button[normalize-space(.)="Plan" or normalize-space(.)="Accept" or normalize-space(.)="Auto"]';
const XPATH_MODEL = '//button['
  + 'contains(normalize-space(.),"Claude") or contains(normalize-space(.),"Sonnet")'
  + ' or contains(normalize-space(.),"Haiku") or contains(normalize-space(.),"Opus")'
  + ']';

// --- Utilities ---

/* node:coverage ignore next 3 */
const findByXPath = (xpath) => document.evaluate(
  xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null,
).singleNodeValue;

/* node:coverage ignore next 7 */
const clickOrWarn = (el, name) => {
  if (el) {
    el.click();
  } else {
    // eslint-disable-next-line no-console
    console.warn(`[claude-shortcuts] ${name} button not found`);
  }
};

// --- Actions ---

/* node:coverage ignore next 5 */
const clickMic = () => {
  const el = document.querySelector('button[aria-label="Stop dictation"]')
    ?? document.querySelector('button[aria-label="Press and hold to record"]');
  clickOrWarn(el, 'microphone');
};

/* node:coverage ignore next 4 */
const clickModelSelector = () => {
  const el = document.querySelector('button[aria-label*="model" i]')
    ?? findByXPath(XPATH_MODEL);
  clickOrWarn(el, 'model selector');
};

/* node:coverage ignore next 4 */
const clickModeToggle = () => {
  const el = findByXPath(XPATH_MODE)
    ?? document.querySelector('button[aria-haspopup="menu"]');
  clickOrWarn(el, 'mode toggle');
};

/* node:coverage ignore next 6 */
const clickFileAttach = () => {
  const el = document.querySelector('button[aria-label*="attach" i]')
    ?? document.querySelector('button[aria-label*="file" i]')
    ?? document.querySelector('button[aria-label*="upload" i]')
    ?? document.querySelector('input[type="file"]');
  clickOrWarn(el, 'file attach');
};

// --- Command palette ---

const COMMANDS = [
  { label: 'Toggle microphone', shortcut: 'Ctrl+D', action: clickMic },
  { label: 'Open model selector', action: clickModelSelector },
  { label: 'Toggle mode (Plan/Accept/Auto)', action: clickModeToggle },
  { label: 'Attach file', action: clickFileAttach },
];

const NATIVE_SHORTCUTS = [
  { label: 'Open script command palette', shortcut: 'Ctrl+P' },
  { label: 'Open Claude command palette', shortcut: 'Ctrl+K' },
  { label: 'New conversation', shortcut: 'Ctrl+Shift+O' },
  { label: 'Submit message', shortcut: 'Enter' },
  { label: 'New line in message', shortcut: 'Shift+Enter' },
];

// Pure: returns COMMANDS entries whose label contains query (case-insensitive).
const filterCommands = (query) => COMMANDS.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()));

// Pure: next arrow-key index with wrapping. direction: 1 (down) or -1 (up).
const getNextIndex = (current, total, direction) => {
  if (total === 0) return -1;
  return (current + direction + total) % total;
};

/* node:coverage ignore next 3 */
let paletteDialog = null;
let paletteSearch = null;
let paletteList = null;

GM.addStyle(`
  #ipwnponies-palette {
    padding: 0;
    border: none;
    border-radius: 8px;
    width: 480px;
    max-width: 90vw;
    background: #1a1a1a;
    color: #e5e5e5;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  }
  #ipwnponies-palette::backdrop {
    background: rgba(0,0,0,0.4);
  }
  #ipwnponies-palette-search {
    width: 100%;
    box-sizing: border-box;
    padding: 12px 16px;
    background: transparent;
    border: none;
    border-bottom: 1px solid #333;
    color: inherit;
    font-size: 14px;
    outline: none;
  }
  #ipwnponies-palette-list {
    list-style: none;
    margin: 0;
    padding: 4px 0;
    max-height: 360px;
    overflow-y: auto;
  }
  .ipwnponies-palette-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px;
    cursor: pointer;
    font-size: 13px;
  }
  .ipwnponies-palette-item:hover,
  .ipwnponies-palette-item[aria-selected="true"] {
    background: #2a2a2a;
  }
  .ipwnponies-palette-item[aria-selected="true"] {
    outline: 1px solid #555;
    outline-offset: -1px;
  }
  .ipwnponies-palette-shortcut {
    font-size: 11px;
    color: #888;
    font-family: monospace;
    flex-shrink: 0;
    margin-left: 16px;
  }
  .ipwnponies-palette-section {
    padding: 6px 16px 2px;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #666;
  }
  .ipwnponies-palette-item.native {
    color: #888;
    cursor: default;
  }
  .ipwnponies-palette-item.native:hover,
  .ipwnponies-palette-item.native[aria-selected="true"] {
    background: transparent;
    outline: none;
  }
`);

const setSelected = (items, idx) => {
  for (const item of items) item.removeAttribute('aria-selected');
  items[idx]?.setAttribute('aria-selected', 'true');
  items[idx]?.scrollIntoView({ block: 'nearest' });
};

const makeCommandClickHandler = (cmd) => () => {
  paletteDialog.close();
  cmd.action();
};

const renderPaletteItems = () => {
  const query = paletteSearch.value.toLowerCase();
  paletteList.innerHTML = '';

  const filtered = filterCommands(query);
  const filteredNative = query ? [] : NATIVE_SHORTCUTS;

  if (filtered.length) {
    if (!query) {
      const section = document.createElement('li');
      section.className = 'ipwnponies-palette-section';
      section.textContent = 'Script commands';
      paletteList.appendChild(section);
    }

    for (const cmd of filtered) {
      const li = document.createElement('li');
      li.className = 'ipwnponies-palette-item';
      li.setAttribute('role', 'option');
      li.innerHTML = `<span>${cmd.label}</span><span class="ipwnponies-palette-shortcut">${cmd.shortcut ?? ''}</span>`;
      li.addEventListener('click', makeCommandClickHandler(cmd));
      paletteList.appendChild(li);
    }
  }

  if (filteredNative.length) {
    const section = document.createElement('li');
    section.className = 'ipwnponies-palette-section';
    section.textContent = 'Native shortcuts';
    paletteList.appendChild(section);

    for (const sc of filteredNative) {
      const li = document.createElement('li');
      li.className = 'ipwnponies-palette-item native';
      li.setAttribute('role', 'option');
      li.innerHTML = `<span>${sc.label}</span><span class="ipwnponies-palette-shortcut">${sc.shortcut}</span>`;
      paletteList.appendChild(li);
    }
  }

  const firstItem = paletteList.querySelector('.ipwnponies-palette-item:not(.native)');
  if (firstItem) firstItem.setAttribute('aria-selected', 'true');
};

/* node:coverage ignore next 44 */
const injectPalette = () => {
  if (document.querySelector('#ipwnponies-palette')) return;

  paletteDialog = document.createElement('dialog');
  paletteDialog.id = 'ipwnponies-palette';

  paletteSearch = document.createElement('input');
  paletteSearch.id = 'ipwnponies-palette-search';
  paletteSearch.type = 'search';
  paletteSearch.placeholder = 'Search commands…';
  paletteSearch.autocomplete = 'off';

  paletteList = document.createElement('ul');
  paletteList.id = 'ipwnponies-palette-list';
  paletteList.setAttribute('role', 'listbox');

  paletteDialog.appendChild(paletteSearch);
  paletteDialog.appendChild(paletteList);
  document.body.appendChild(paletteDialog);

  paletteSearch.addEventListener('input', renderPaletteItems);

  paletteSearch.addEventListener('keydown', (e) => {
    const items = [...paletteList.querySelectorAll('.ipwnponies-palette-item:not(.native)')];
    if (!items.length) return;

    const selectedIdx = items.findIndex((i) => i.getAttribute('aria-selected') === 'true');

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected(items, getNextIndex(selectedIdx, items.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected(items, getNextIndex(selectedIdx, items.length, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      items[selectedIdx]?.click();
    }
  });

  // Close on backdrop click (dialog element itself, not its children)
  paletteDialog.addEventListener('click', (e) => {
    if (e.target === paletteDialog) paletteDialog.close();
  });
};

const togglePalette = () => {
  if (!paletteDialog) return;
  if (paletteDialog.open) {
    paletteDialog.close();
  } else {
    paletteSearch.value = '';
    renderPaletteItems();
    paletteDialog.showModal();
    paletteSearch.focus();
  }
};

// --- Init ---

/* node:coverage disable */
injectPalette();

register('ctrl-d', clickMic);
register('ctrl-p', togglePalette);
/* node:coverage enable */

// Exported for unit tests only — not used in browser context.
if (typeof module !== 'undefined') {
  module.exports = { filterCommands, getNextIndex };
}
