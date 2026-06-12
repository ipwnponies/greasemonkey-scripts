// ==UserScript==
// @name        Desktop shortcuts - claude.ai
// @namespace   ipwnponies
// @match       https://claude.ai/*
// @grant       GM.addStyle
// @version     1.0.0
// @require     https://cdn.jsdelivr.net/npm/@violentmonkey/shortcut@1
// @description Mic hotkey and command palette for claude.ai
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

// Pure: returns COMMANDS entries whose label contains query (case-insensitive).
const filterCommands = (query) => COMMANDS.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()));

// Pure: next arrow-key index with wrapping. direction: 1 (down) or -1 (up).
const getNextIndex = (current, total, direction) => {
  if (total === 0) return -1;
  return (current + direction + total) % total;
};

// Pure: parses "Ctrl+Shift+K" into a KeyboardEvent init dict.
const parseShortcut = (str) => {
  const parts = str.split('+');
  const key = parts[parts.length - 1];
  return {
    ctrlKey: parts.includes('Ctrl'),
    shiftKey: parts.includes('Shift'),
    altKey: parts.includes('Alt'),
    metaKey: parts.includes('Meta'),
    key: key.length === 1 ? key.toLowerCase() : key,
  };
};

/* node:coverage ignore next 4 */
let paletteDialog = null;
let paletteSearch = null;
let paletteList = null;
let palettePos = null; // { left, top } retained for the tab session

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
    cursor: move;
    user-select: none;
  }
  #ipwnponies-palette-search:focus {
    cursor: text;
    user-select: auto;
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
    color: #aaa;
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

// Dispatches a keyboard event to document.body without closing the palette —
// callers are responsible for closing first via makeCommandClickHandler.
/* node:coverage ignore next 4 */
const dispatchShortcut = (str) => {
  const opts = parseShortcut(str);
  document.body.dispatchEvent(new KeyboardEvent('keydown', { ...opts, bubbles: true, cancelable: true }));
};

// Must be defined before renderPaletteItems which iterates over it.
const NATIVE_SHORTCUTS = [
  { label: 'Open Claude command palette', shortcut: 'Ctrl+K', action: () => dispatchShortcut('Ctrl+K') },
  { label: 'New conversation', shortcut: 'Ctrl+Shift+O', action: () => dispatchShortcut('Ctrl+Shift+O') },
  { label: 'Submit message', shortcut: 'Enter', action: () => dispatchShortcut('Enter') },
  { label: 'New line in message', shortcut: 'Shift+Enter', action: () => dispatchShortcut('Shift+Enter') },
];

/* node:coverage disable */
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
      li.addEventListener('click', makeCommandClickHandler(sc));
      paletteList.appendChild(li);
    }
  }

  const firstItem = paletteList.querySelector('.ipwnponies-palette-item');
  if (firstItem) firstItem.setAttribute('aria-selected', 'true');
};

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
    const items = [...paletteList.querySelectorAll('.ipwnponies-palette-item')];
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

  paletteDialog.addEventListener('click', (e) => {
    if (e.target === paletteDialog) paletteDialog.close();
  });

  // Drag by the search bar; position is stored for the session.
  paletteSearch.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    const rect = paletteDialog.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    const onMove = (ev) => {
      palettePos = { left: ev.clientX - offsetX, top: ev.clientY - offsetY };
      paletteDialog.style.left = `${palettePos.left}px`;
      paletteDialog.style.top = `${palettePos.top}px`;
      paletteDialog.style.margin = '0';
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    e.preventDefault();
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
    if (palettePos) {
      paletteDialog.style.left = `${palettePos.left}px`;
      paletteDialog.style.top = `${palettePos.top}px`;
      paletteDialog.style.margin = '0';
    }
    paletteSearch.focus();
  }
};
/* node:coverage enable */

// --- Init ---

/* node:coverage disable */
injectPalette();

register('ctrl-d', clickMic);
register('ctrl-p', togglePalette);
/* node:coverage enable */

// Exported for unit tests only — not used in browser context.
if (typeof module !== 'undefined') {
  module.exports = { filterCommands, getNextIndex, parseShortcut };
}
