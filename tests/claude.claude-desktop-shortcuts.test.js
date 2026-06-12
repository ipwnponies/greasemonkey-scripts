const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const makeMockElement = () => ({
  id: '', type: '', placeholder: '', autocomplete: '', value: '', open: false,
  setAttribute() {}, removeAttribute() {}, getAttribute() { return null; },
  appendChild() {}, addEventListener() {}, querySelector() { return null; },
  querySelectorAll() { return []; }, scrollIntoView() {}, click() {}, close() {},
  showModal() {},
});

const loadUserscript = (overrides = {}) => {
  const filePath = path.join(__dirname, '..', 'greasemonkey', 'claude.claude-desktop-shortcuts.user.js');
  const source = fs.readFileSync(filePath, 'utf8');
  const sandbox = {
    module: { exports: {} },
    exports: {},
    console: { warn() {} },
    document: {
      querySelector: () => null,
      createElement: () => makeMockElement(),
      body: { appendChild() {} },
      evaluate: () => ({ singleNodeValue: null }),
    },
    VM: { shortcut: { register() {} } },
    GM: { addStyle() {} },
    XPathResult: { FIRST_ORDERED_NODE_TYPE: 0 },
    ...overrides,
  };
  vm.runInNewContext(source, sandbox, { filename: 'claude.claude-desktop-shortcuts.user.js' });
  return sandbox.module.exports;
};

let filterCommands;
let getNextIndex;
let parseShortcut;

test('load script and export pure functions', () => {
  ({ filterCommands, getNextIndex, parseShortcut } = loadUserscript());
  assert.equal(typeof filterCommands, 'function');
  assert.equal(typeof getNextIndex, 'function');
});

test('filterCommands — empty query returns all commands', () => {
  const result = filterCommands('');
  assert.ok(result.length > 0);
  assert.ok(result.every((c) => 'label' in c && 'action' in c));
});

test('filterCommands — matches substring case-insensitively', () => {
  const lower = filterCommands('mic');
  const upper = filterCommands('MIC');
  assert.ok(lower.length > 0);
  assert.deepEqual(lower, upper);
  assert.ok(lower.every((c) => c.label.toLowerCase().includes('mic')));
});

test('filterCommands — returns empty array when no match', () => {
  const result = filterCommands('zzznomatch');
  assert.equal(result.length, 0);
});

test('filterCommands — does not mutate COMMANDS array', () => {
  const before = filterCommands('').length;
  filterCommands('zzznomatch');
  const after = filterCommands('').length;
  assert.equal(before, after);
});

test('getNextIndex — down from middle', () => {
  assert.equal(getNextIndex(1, 4, 1), 2);
});

test('getNextIndex — down wraps from last to first', () => {
  assert.equal(getNextIndex(3, 4, 1), 0);
});

test('getNextIndex — up from middle', () => {
  assert.equal(getNextIndex(2, 4, -1), 1);
});

test('getNextIndex — up wraps from first to last', () => {
  assert.equal(getNextIndex(0, 4, -1), 3);
});

test('getNextIndex — returns -1 when list is empty', () => {
  assert.equal(getNextIndex(0, 0, 1), -1);
  assert.equal(getNextIndex(0, 0, -1), -1);
});

test('getNextIndex — single item always returns 0', () => {
  assert.equal(getNextIndex(0, 1, 1), 0);
  assert.equal(getNextIndex(0, 1, -1), 0);
});

test('parseShortcut — single key', () => {
  const r = parseShortcut('Enter');
  assert.equal(r.key, 'Enter');
  assert.equal(r.ctrlKey, false);
  assert.equal(r.shiftKey, false);
  assert.equal(r.altKey, false);
  assert.equal(r.metaKey, false);
});

test('parseShortcut — Ctrl+K lowercases single char key', () => {
  const r = parseShortcut('Ctrl+K');
  assert.equal(r.key, 'k');
  assert.equal(r.ctrlKey, true);
  assert.equal(r.shiftKey, false);
});

test('parseShortcut — Ctrl+Shift+O', () => {
  const r = parseShortcut('Ctrl+Shift+O');
  assert.equal(r.key, 'o');
  assert.equal(r.ctrlKey, true);
  assert.equal(r.shiftKey, true);
});

test('parseShortcut — Shift+Enter preserves multi-char key', () => {
  const r = parseShortcut('Shift+Enter');
  assert.equal(r.key, 'Enter');
  assert.equal(r.shiftKey, true);
  assert.equal(r.ctrlKey, false);
});
