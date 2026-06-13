// ==UserScript==
// @name        Desktop shortcuts - claude.ai
// @namespace   ipwnponies
// @match       https://claude.ai/*
// @grant       GM.addStyle
// @version     1.1.0
// @require     https://cdn.jsdelivr.net/npm/@violentmonkey/shortcut@1
// @description Mic hotkey and command palette for claude.ai
// ==/UserScript==

const { register } = VM.shortcut;

// --- Utilities ---

/* node:coverage ignore next 8 */
const showToast = (msg) => {
  const t = document.createElement('div');
  t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);'
    + 'background:#333;color:#fff;padding:8px 16px;border-radius:6px;'
    + 'font-size:13px;z-index:2147483647;pointer-events:none;transition:opacity 0.3s';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 2000);
};

// --- Actions ---

/* node:coverage ignore next 18 */
const clickMic = () => {
  const stopEl = document.querySelector('button[aria-label="Stop dictation"]')
    ?? document.querySelector('button[aria-label="Finish dictation"]');
  if (stopEl) { stopEl.click(); return; }
  const startEl = document.querySelector('button[aria-label="Press and hold to record"]');
  if (!startEl) {
    // eslint-disable-next-line no-console
    console.warn('[claude-shortcuts] microphone button not found');
    return;
  }
  const pOpts = { bubbles: true, cancelable: true, button: 0 };
  startEl.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
  startEl.dispatchEvent(new PointerEvent('pointerdown', { ...pOpts, isPrimary: true }));
  startEl.dispatchEvent(new MouseEvent('mousedown', pOpts));
  startEl.dispatchEvent(new PointerEvent('pointerup', { ...pOpts, isPrimary: true }));
  startEl.dispatchEvent(new MouseEvent('mouseup', pOpts));
  startEl.dispatchEvent(new MouseEvent('click', pOpts));
};

/* node:coverage ignore next 6 */
const clickModelSelector = () => {
  const btn = [...document.querySelectorAll('button[aria-haspopup="menu"]')]
    .find((b) => /\b(Claude|Sonnet|Haiku|Opus)\b/i.test(b.textContent));
  // eslint-disable-next-line no-console
  if (btn) btn.click(); else console.warn('[claude-shortcuts] model selector button not found');
};

/* node:coverage ignore next 8 */
const clickModeToggle = () => {
  if (!window.location.pathname.startsWith('/code')) {
    showToast('Mode toggle not available here');
    return;
  }
  const btn = [...document.querySelectorAll('button[aria-haspopup="menu"]')]
    .find((b) => /\b(Plan|Auto)\b/.test(b.textContent) || b.textContent.includes('Accept'));
  if (btn) btn.click(); else showToast('Mode toggle button not found');
};

/* node:coverage ignore next 5 */
const clickFileAttach = () => {
  document.dispatchEvent(new KeyboardEvent('keydown', {
    ctrlKey: true, key: 'u', bubbles: true, cancelable: true,
  }));
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
// current === -1 means no item is selected.
const getNextIndex = (current, total, direction) => {
  if (total === 0) return -1;
  if (current === -1) return direction === 1 ? 0 : total - 1;
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

/* node:coverage ignore next 5 */
let paletteDialog = null;
let paletteHandle = null;
let paletteSearch = null;
let paletteList = null;
let palettePos = null; // { left, top } retained for the tab session

// Cached list of palette items — invalidated by renderPaletteItems, read by keydown handler.
let cachedItems = [];

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
    /* Explicit centering — overrides any page CSS that resets UA margin:auto */
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    margin: 0;
  }
  #ipwnponies-palette::backdrop {
    background: rgba(0,0,0,0.4);
  }
  #ipwnponies-palette-handle {
    padding: 7px 16px;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #555;
    cursor: move;
    user-select: none;
    border-bottom: 1px solid #222;
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
    color: #aaa;
  }
`);

const setSelected = (items, idx) => {
  for (const item of items) item.removeAttribute('aria-selected');
  items[idx]?.setAttribute('aria-selected', 'true');
  items[idx]?.scrollIntoView({ block: 'nearest' });
};

// Defer action so the Enter keydown that triggered this click finishes propagating
// before we dispatch synthetic shortcuts — otherwise the event leaks into any
// native palette that opens (e.g. Ctrl+K palette grabbing the still-bubbling Enter).
const makeCommandClickHandler = (cmd) => () => {
  paletteDialog.close();
  setTimeout(cmd.action, 0);
};

// Dispatches a keyboard event to document (not body) so SPA shortcut handlers
// registered at the document level receive it regardless of capture/bubble phase.
// Callers are responsible for closing the palette first via makeCommandClickHandler.
/* node:coverage ignore next 4 */
const dispatchShortcut = (str) => {
  const opts = parseShortcut(str);
  document.dispatchEvent(new KeyboardEvent('keydown', { ...opts, bubbles: true, cancelable: true }));
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

  // Invalidate cache after every render.
  cachedItems = [...paletteList.querySelectorAll('.ipwnponies-palette-item')];
};

const injectPalette = () => {
  if (document.querySelector('#ipwnponies-palette')) return;

  paletteDialog = document.createElement('dialog');
  paletteDialog.id = 'ipwnponies-palette';

  paletteHandle = document.createElement('div');
  paletteHandle.id = 'ipwnponies-palette-handle';
  paletteHandle.textContent = 'Commands';

  paletteSearch = document.createElement('input');
  paletteSearch.id = 'ipwnponies-palette-search';
  paletteSearch.type = 'search';
  paletteSearch.placeholder = 'Search commands…';
  paletteSearch.autocomplete = 'off';

  paletteList = document.createElement('ul');
  paletteList.id = 'ipwnponies-palette-list';
  paletteList.setAttribute('role', 'listbox');

  paletteDialog.appendChild(paletteHandle);
  paletteDialog.appendChild(paletteSearch);
  paletteDialog.appendChild(paletteList);
  document.body.appendChild(paletteDialog);

  paletteSearch.addEventListener('input', renderPaletteItems);

  paletteSearch.addEventListener('keydown', (e) => {
    // Use cached items — invalidated by renderPaletteItems on every input event.
    const items = cachedItems;
    if (!items.length) return;

    const selectedIdx = items.findIndex((i) => i.getAttribute('aria-selected') === 'true');

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      setSelected(items, getNextIndex(selectedIdx, items.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      setSelected(items, getNextIndex(selectedIdx, items.length, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      items[selectedIdx]?.click();
    }
  });

  paletteDialog.addEventListener('click', (e) => {
    if (e.target === paletteDialog) paletteDialog.close();
  });

  // Drag via the handle bar. Separate from the search input to avoid
  // suppressing focus/selection on the text field.
  let dragCleanup = null;

  paletteDialog.addEventListener('close', () => {
    if (dragCleanup) {
      dragCleanup();
      dragCleanup = null;
    }
  });

  paletteHandle.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;

    // Commit the current visual position to left/top before measuring so the
    // coordinate frame is consistent throughout the drag.
    paletteDialog.style.transform = 'none';
    paletteDialog.style.margin = '0';
    if (!palettePos) {
      const r = paletteDialog.getBoundingClientRect();
      paletteDialog.style.left = `${r.left}px`;
      paletteDialog.style.top = `${r.top}px`;
    }

    const rect = paletteDialog.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    const onMove = (ev) => {
      const maxLeft = window.innerWidth - paletteDialog.offsetWidth;
      const maxTop = window.innerHeight - paletteDialog.offsetHeight;
      palettePos = {
        left: Math.max(0, Math.min(ev.clientX - offsetX, maxLeft)),
        top: Math.max(0, Math.min(ev.clientY - offsetY, maxTop)),
      };
      paletteDialog.style.left = `${palettePos.left}px`;
      paletteDialog.style.top = `${palettePos.top}px`;
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      dragCleanup = null;
    };

    dragCleanup = onUp;
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
      paletteDialog.style.transform = 'none';
      paletteDialog.style.margin = '0';
      paletteDialog.style.left = `${palettePos.left}px`;
      paletteDialog.style.top = `${palettePos.top}px`;
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
