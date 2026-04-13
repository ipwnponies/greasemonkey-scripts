const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const exportedFunctions = [
  'getClearMode',
  'getPlaylistItemCount',
  'findPlaylistActionButtons',
  'findNextPlaylistActionButton',
  'removeFromPlaylist',
  'removeButtonWithRetries',
  'drainPlaylist',
].join(', ');

const loadUserscript = (overrides = {}) => {
  const filePath = path.join(__dirname, '..', 'greasemonkey', 'youtube.clear-playlist.user.js');
  const source = fs.readFileSync(filePath, 'utf8');
  const sandbox = {
    module: { exports: {} },
    exports: {},
    console: { log() {} },
    setTimeout,
    clearTimeout,
    Promise,
    Date,
    window: {},
    document: {},
    XPathResult: { FIRST_ORDERED_NODE_TYPE: 0 },
    GM: {
      registerMenuCommand() {},
      async getValue() {
        return 300;
      },
    },
    ...overrides,
  };

  vm.runInNewContext(
    `${source}\nmodule.exports = { ${exportedFunctions} };`,
    sandbox,
    { filename: 'youtube.clear-playlist.user.js' },
  );

  return sandbox.module.exports;
};

const createButton = ({
  label,
  connected = true,
  rowTag = null,
  rowKey = null,
  rowIndex = null,
  setVideoId = null,
}) => ({
  isConnected: connected,
  getAttribute(name) {
    return name === 'aria-label' ? label : null;
  },
  closest(selector) {
    if (!rowTag) {
      return null;
    }

    return selector.includes(rowTag) ? {
      tagName: rowTag.toUpperCase(),
      querySelector(query) {
        if (query === '#index') {
          return rowIndex ? { textContent: rowIndex } : null;
        }

        return rowKey ? { href: rowKey } : null;
      },
      getAttribute() {
        return setVideoId;
      },
      dataset: setVideoId ? { setVideoId } : {},
      textContent: rowKey,
    } : null;
  },
});

test('findPlaylistActionButtons keeps only connected playlist row action menus', () => {
  const { findPlaylistActionButtons } = loadUserscript();
  const buttons = [
    createButton({ label: 'More actions', rowTag: null }),
    createButton({ label: 'Action menu', rowTag: 'ytd-playlist-video-renderer' }),
    createButton({ label: 'Action menu', rowTag: 'ytd-playlist-panel-video-renderer' }),
    createButton({ label: 'Action menu', rowTag: 'ytd-compact-video-renderer' }),
    createButton({ label: 'Action menu', rowTag: 'ytd-playlist-video-renderer', connected: false }),
  ];

  const result = findPlaylistActionButtons(buttons);

  assert.equal(result.length, 2);
  assert.equal(result[0], buttons[1]);
  assert.equal(result[1], buttons[2]);
});

test('getClearMode uses reliable mode only below the 20 row threshold', () => {
  const { getClearMode } = loadUserscript();

  assert.equal(getClearMode(0), 'reliable');
  assert.equal(getClearMode(19), 'reliable');
  assert.equal(getClearMode(20), 'blitz');
  assert.equal(getClearMode(75), 'blitz');
});

test('getPlaylistItemCount prefers stable playlist metadata over rendered rows', () => {
  const { getPlaylistItemCount } = loadUserscript({
    document: {
      querySelector(selector) {
        if (selector === 'ytd-playlist-byline-renderer') {
          return { textContent: '157 videos' };
        }

        return null;
      },
      querySelectorAll() {
        return new Array(20).fill(null);
      },
    },
  });

  assert.equal(getPlaylistItemCount(), 157);
});

test('findNextPlaylistActionButton discovers playlist row menus for both aria labels', () => {
  const skippedButtons = new Set();
  const buttons = [
    createButton({ label: 'More actions', rowTag: null }),
    createButton({ label: 'More actions', rowTag: 'ytd-playlist-video-renderer' }),
    createButton({ label: 'Action menu', rowTag: 'ytd-playlist-panel-video-renderer' }),
  ];
  const selectors = [];
  const { findNextPlaylistActionButton } = loadUserscript({
    document: {
      querySelectorAll(selector) {
        selectors.push(selector);
        return buttons;
      },
    },
  });

  assert.equal(findNextPlaylistActionButton(skippedButtons), buttons[1]);
  assert.equal(
    selectors[0],
    'button[aria-label="Action menu"],button[aria-label="More actions"]',
  );
});

test('findPlaylistActionButtons skip state is scoped to one run', () => {
  const { findPlaylistActionButtons } = loadUserscript();
  const button = createButton({
    label: 'Action menu',
    rowTag: 'ytd-playlist-video-renderer',
    setVideoId: 'set-video-123',
  });
  const firstRunSkipped = new Set(['set-video-123']);
  const firstRunResult = findPlaylistActionButtons([button], firstRunSkipped);
  const secondRunResult = findPlaylistActionButtons([button], new Set());

  assert.equal(firstRunResult.length, 0);
  assert.equal(secondRunResult.length, 1);
  assert.equal(secondRunResult[0], button);
});

test('removeFromPlaylist closes the menu when no remove option is available', async () => {
  let now = 0;
  const row = { isConnected: true };
  const button = {
    clicks: 0,
    click() {
      this.clicks += 1;
    },
    closest() {
      return row;
    },
  };
  const { removeFromPlaylist } = loadUserscript({
    Date: {
      now() {
        now += 100;
        return now;
      },
    },
    setTimeout(handler) {
      handler();
      return 0;
    },
    document: {
      evaluate() {
        return { singleNodeValue: null };
      },
    },
  });

  const result = await removeFromPlaylist(button);

  assert.equal(result, false);
  assert.equal(button.clicks, 2);
});

test('removeFromPlaylist treats a missing row-key on rescan as success', async () => {
  let now = 0;
  const row = {
    isConnected: true,
    querySelector(query) {
      if (query === 'a[href*="watch?v="],a#video-title,a#thumbnail') {
        return { href: '/watch?v=row-key' };
      }

      return null;
    },
    getAttribute() {
      return null;
    },
    dataset: {},
    textContent: 'row-key',
  };
  const button = {
    click() {},
    closest() {
      return row;
    },
  };
  const { removeFromPlaylist } = loadUserscript({
    Date: {
      now() {
        now += 100;
        return now;
      },
    },
    setTimeout(handler) {
      handler();
      return 0;
    },
    document: {
      evaluate() {
        return { singleNodeValue: { click() {} } };
      },
      querySelectorAll() {
        return [];
      },
    },
  });

  const result = await removeFromPlaylist(button);

  assert.equal(result, true);
});

test('drainPlaylist keeps going after idle scans when later rows appear', async () => {
  const { drainPlaylist } = loadUserscript();
  const removed = [];
  const buttons = ['first', 'second'];
  let idleCalls = 0;

  await drainPlaylist({
    maxIdlePasses: 3,
    timeout: 0,
    findButton() {
      return buttons.shift() ?? null;
    },
    async removeButton(button) {
      removed.push(button);
    },
    wait: async () => Promise.resolve(),
    async onIdle() {
      idleCalls += 1;

      if (idleCalls === 1) {
        buttons.push('third');
      }
    },
  });

  assert.deepEqual(removed, ['first', 'second', 'third']);
  assert.equal(idleCalls, 4);
});

test('removeButtonWithRetries backs off and retries transient failures', async () => {
  const { removeButtonWithRetries } = loadUserscript();
  const waits = [];
  const buttons = ['stale-button', 'fresh-button'];
  let attempts = 0;

  await removeButtonWithRetries({
    getButton: () => buttons.shift() ?? null,
    maxRetries: 2,
    retryDelay: 2500,
    wait: async (ms) => {
      waits.push(ms);
    },
    async removeButton(button) {
      attempts += 1;

      if (attempts === 1) {
        assert.equal(button, 'stale-button');
        throw new Error('Timed out waiting for playlist UI state');
      }

      assert.equal(button, 'fresh-button');
    },
  });

  assert.equal(attempts, 2);
  assert.deepEqual(waits, [2500]);
});

test('removeButtonWithRetries skips non-fatal rows without retrying', async () => {
  const { removeButtonWithRetries } = loadUserscript();
  const waits = [];
  const skipped = [];
  let attempts = 0;

  const result = await removeButtonWithRetries({
    getButton: () => 'row-button',
    maxRetries: 2,
    retryDelay: 2500,
    wait: async (ms) => {
      waits.push(ms);
    },
    onSkip(button) {
      skipped.push(button);
    },
    async removeButton(button) {
      attempts += 1;
      assert.equal(button, 'row-button');
      return false;
    },
  });

  assert.equal(result, false);
  assert.equal(attempts, 1);
  assert.deepEqual(waits, []);
  assert.deepEqual(skipped, ['row-button']);
});

test('removeButtonWithRetries marks the refreshed button when a retry ends in skip', async () => {
  const { removeButtonWithRetries } = loadUserscript();
  const buttons = ['stale-button', 'fresh-button'];
  const skipped = [];
  let attempts = 0;

  const result = await removeButtonWithRetries({
    getButton: () => buttons.shift() ?? null,
    maxRetries: 2,
    retryDelay: 2500,
    wait: async () => Promise.resolve(),
    onSkip(button) {
      skipped.push(button);
    },
    async removeButton(button) {
      attempts += 1;

      if (attempts === 1) {
        assert.equal(button, 'stale-button');
        throw new Error('Timed out waiting for playlist UI state');
      }

      assert.equal(button, 'fresh-button');
      return false;
    },
  });

  assert.equal(result, false);
  assert.equal(attempts, 2);
  assert.deepEqual(skipped, ['fresh-button']);
});

test('removeButtonWithRetries can continue after a non-retriable failure', async () => {
  const { removeButtonWithRetries } = loadUserscript();
  const skipped = [];
  let attempts = 0;

  const result = await removeButtonWithRetries({
    getButton: () => 'row-button',
    maxRetries: 0,
    retryDelay: 800,
    continueOnFailure: true,
    wait: async () => Promise.resolve(),
    onSkip(button) {
      skipped.push(button);
    },
    async removeButton(button) {
      attempts += 1;
      assert.equal(button, 'row-button');
      throw new Error('Timed out waiting for playlist UI state');
    },
  });

  assert.equal(result, false);
  assert.equal(attempts, 1);
  assert.deepEqual(skipped, ['row-button']);
});

test('removeButtonWithRetries still throws unexpected errors in continue mode', async () => {
  const { removeButtonWithRetries } = loadUserscript();

  await assert.rejects(
    removeButtonWithRetries({
      getButton: () => 'row-button',
      maxRetries: 0,
      retryDelay: 800,
      continueOnFailure: true,
      wait: async () => Promise.resolve(),
      async removeButton() {
        throw new Error('Unexpected menu structure');
      },
    }),
    /Unexpected menu structure/,
  );
});

test('drainPlaylist skips persistent non-removable rows and continues', async () => {
  const { drainPlaylist } = loadUserscript();
  const firstButton = createButton({
    label: 'Action menu',
    rowTag: 'ytd-playlist-video-renderer',
    rowKey: '/watch?v=first',
  });
  const secondButton = createButton({
    label: 'Action menu',
    rowTag: 'ytd-playlist-video-renderer',
    rowKey: '/watch?v=second',
  });
  const removed = [];
  const skippedButtons = new Set();
  const getButtonKey = (button) => button.closest('ytd-playlist-video-renderer').querySelector().href;

  await drainPlaylist({
    maxIdlePasses: 1,
    maxRetries: 0,
    timeout: 0,
    retryDelay: 0,
    onSkip(button) {
      skippedButtons.add(getButtonKey(button));
    },
    findButton() {
      return [firstButton, secondButton].find((button) => !skippedButtons.has(getButtonKey(button))) ?? null;
    },
    async removeButton(button) {
      if (button === firstButton) {
        return false;
      }

      removed.push(button);
      skippedButtons.add(getButtonKey(button));
      return true;
    },
    wait: async () => Promise.resolve(),
    onIdle: async () => Promise.resolve(),
  });

  assert.deepEqual(removed, [secondButton]);
  assert.equal(skippedButtons.has('/watch?v=first'), true);
});

test('findPlaylistActionButtons ignores remounted skipped rows in the same run', () => {
  const { findPlaylistActionButtons } = loadUserscript();
  const skippedRows = new Set(['/watch?v=stuck']);
  const remountedButton = createButton({
    label: 'Action menu',
    rowTag: 'ytd-playlist-video-renderer',
    rowKey: '/watch?v=stuck',
  });
  const nextButton = createButton({
    label: 'Action menu',
    rowTag: 'ytd-playlist-video-renderer',
    rowKey: '/watch?v=next',
  });
  const result = findPlaylistActionButtons([remountedButton, nextButton], skippedRows);

  assert.equal(result.length, 1);
  assert.equal(result[0], nextButton);
});

test('findPlaylistActionButtons does not suppress later duplicate videos', () => {
  const { findPlaylistActionButtons } = loadUserscript();
  const skippedRows = new Set(['https://www.youtube.com/watch?v=dup&list=abc&index=1']);
  const firstDuplicate = createButton({
    label: 'Action menu',
    rowTag: 'ytd-playlist-video-renderer',
    rowKey: 'https://www.youtube.com/watch?v=dup&list=abc&index=1',
  });
  const secondDuplicate = createButton({
    label: 'Action menu',
    rowTag: 'ytd-playlist-video-renderer',
    rowKey: 'https://www.youtube.com/watch?v=dup&list=abc&index=2',
  });
  const result = findPlaylistActionButtons([firstDuplicate, secondDuplicate], skippedRows);

  assert.equal(result.length, 1);
  assert.equal(result[0], secondDuplicate);
});

test('findPlaylistActionButtons ignores renumbered remounts for the same row', () => {
  const { findPlaylistActionButtons } = loadUserscript();
  const skippedRows = new Set(['set-video-stuck']);
  const remountedButton = createButton({
    label: 'Action menu',
    rowTag: 'ytd-playlist-video-renderer',
    rowKey: '/watch?v=dup',
    rowIndex: '4',
    setVideoId: 'set-video-stuck',
  });
  const nextButton = createButton({
    label: 'Action menu',
    rowTag: 'ytd-playlist-video-renderer',
    rowKey: '/watch?v=other',
    rowIndex: '5',
    setVideoId: 'set-video-next',
  });
  const result = findPlaylistActionButtons([remountedButton, nextButton], skippedRows);

  assert.equal(result.length, 1);
  assert.equal(result[0], nextButton);
});
