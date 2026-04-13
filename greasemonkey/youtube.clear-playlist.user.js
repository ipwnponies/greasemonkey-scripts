/* global GM */
// ==UserScript==
// @name        Clear Youtube playlists
// @namespace   ipwnponies
// @match       https://www.youtube.com/playlist
// @grant       GM.registerMenuCommand
// @grant       GM.getValue
// @version     1.5.3
// @author      ipwnponies
// @description Add a button to clear all items in a playlist.
// ==/UserScript==

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const PLAYLIST_ROW_SELECTOR = 'ytd-playlist-video-renderer,ytd-playlist-panel-video-renderer';
const ACTION_BUTTON_SELECTOR = 'button[aria-label="Action menu"],button[aria-label="More actions"]';
const RELIABLE_MODE_THRESHOLD = 20;

// Use blitz mode when there are lots of items to process
// Switch to reliable, when below a threshold
const getClearMode = (rowCount) => (rowCount < RELIABLE_MODE_THRESHOLD ? 'reliable' : 'blitz');

const waitFor = async (callback, timeout = 5000, interval = 50) => {
  const deadline = Date.now() + timeout;

  // Poll until the YouTube SPA catches up instead of relying on fixed delays.
  /* eslint-disable no-await-in-loop */
  while (Date.now() < deadline) {
    const result = callback();

    if (result) {
      return result;
    }

    await sleep(interval);
  }

  throw new Error('Timed out waiting for playlist UI state');
};

const getPlaylistRow = (button) => button?.closest?.(PLAYLIST_ROW_SELECTOR) ?? null;

// Build a per-row identity that survives rerenders during one run.
// Prefer YouTube's item-specific ids, then fall back to playlist-specific hrefs or row text.
const getPlaylistRowKey = (button) => {
  if (!button || typeof button !== 'object') {
    return button ?? null;
  }

  const row = getPlaylistRow(button);
  const keyLink = row?.querySelector?.('a[href*="watch?v="],a#video-title,a#thumbnail');
  const href = keyLink?.href || keyLink?.getAttribute?.('href');
  const setVideoId = row?.dataset?.setVideoId || row?.getAttribute?.('data-set-video-id');

  if (setVideoId) {
    return setVideoId;
  }

  if (href && href.includes('list=') && href.includes('index=')) {
    return href;
  }

  const rowText = row?.textContent?.trim();

  return rowText || null;
};

const findPlaylistActionButtons = (buttons, skippedRowKeys = new Set()) => Array.from(buttons).filter((button) => {
  const row = getPlaylistRow(button);
  const rowKey = getPlaylistRowKey(button);

  return button.isConnected && row && (!rowKey || !skippedRowKeys.has(rowKey));
});

const markButtonSkipped = (skippedRowKeys, button) => {
  const rowKey = getPlaylistRowKey(button);

  if (rowKey) {
    skippedRowKeys.add(rowKey);
  }
};

const findNextPlaylistActionButton = (skippedRowKeys) => findPlaylistActionButtons(
  document.querySelectorAll(ACTION_BUTTON_SELECTOR),
  skippedRowKeys,
)[0] ?? null;

const countPlaylistActionButtons = () => findPlaylistActionButtons(
  document.querySelectorAll(ACTION_BUTTON_SELECTOR),
).length;

const getPlaylistItemCount = () => {
  // Read the playlist size from stable page metadata when possible.
  const playlistByline = document.querySelector('ytd-playlist-byline-renderer');
  const countMatch = playlistByline?.textContent?.match(/(\d[\d,]*)/);

  if (countMatch) {
    return Number.parseInt(countMatch[1].replace(/,/g, ''), 10);
  }

  // Fall back to rendered row count
  return countPlaylistActionButtons();
};

const isContinuableItemError = (error) => error?.message === 'Timed out waiting for playlist UI state';

const hasPlaylistRowKey = (rowKey) => {
  if (!rowKey) {
    return false;
  }

  return findPlaylistActionButtons(document.querySelectorAll(ACTION_BUTTON_SELECTOR)).some(
    (button) => getPlaylistRowKey(button) === rowKey,
  );
};

const scrollPlaylistWindow = () => {
  const scrollRoot = document.scrollingElement || document.documentElement;

  window.scrollTo(0, scrollRoot.scrollHeight);
};

const findRemoveFromPlaylistOption = () => document.evaluate(
  '//span[contains(text(),"Remove from")]',
  document,
  null,
  XPathResult.FIRST_ORDERED_NODE_TYPE,
  null,
).singleNodeValue;

// Remove one playlist row and verify that it is really gone before moving on.
// The fallback rescan avoids false failures when YouTube rerenders the row instead of disconnecting it.
const removeFromPlaylist = async (button) => {
  const row = getPlaylistRow(button);
  const rowKey = getPlaylistRowKey(button);

  button.click();
  const removeOption = await waitFor(findRemoveFromPlaylistOption, 1000, 50).catch(() => null);

  if (!removeOption) {
    button.click();
    return false;
  }

  removeOption.click();
  const removed = await waitFor(() => row && !row.isConnected, 1000, 50).catch(() => false);

  if (!removed && hasPlaylistRowKey(rowKey)) {
    throw new Error('Timed out waiting for playlist UI state');
  }

  return true;
};

// Retry row-level failures without losing the current target row.
// Blitz only skips the known timeout path; unexpected errors still abort so real breakages stay visible.
const removeButtonWithRetries = async ({
  button,
  skippedRowKeys,
  config,
  getButton = () => findNextPlaylistActionButton(skippedRowKeys),
  removeButton = removeFromPlaylist,
  onSkip = (currentButton) => markButtonSkipped(skippedRowKeys, currentButton),
  wait = sleep,
  maxRetries = config?.maxRetries ?? 2,
  retryDelay = config?.retryDelay ?? 800,
  continueOnFailure = config?.continueOnFailure ?? false,
}) => {
  const effectiveConfig = {
    maxRetries,
    retryDelay,
    continueOnFailure,
  };
  let attempt = 0;
  let currentButton = button ?? getButton();

  /* eslint-disable no-await-in-loop */
  while (attempt <= effectiveConfig.maxRetries) {
    if (!currentButton) {
      return false;
    }

    try {
      const result = await removeButton(currentButton);

      if (result === false) {
        onSkip(currentButton);
      }

      return result;
    } catch (error) {
      attempt += 1;

      if (attempt > effectiveConfig.maxRetries) {
        if (effectiveConfig.continueOnFailure && isContinuableItemError(error)) {
          onSkip(currentButton);
          return false;
        }

        throw error;
      }

      await wait(effectiveConfig.retryDelay);
      currentButton = getButton();
    }
  }

  return false;
};

const drainPlaylist = async ({
  skippedRowKeys,
  config,
  maxIdlePasses = 3,
  findButton = () => findNextPlaylistActionButton(skippedRowKeys),
  removeButton = removeFromPlaylist,
  onSkip = (button) => markButtonSkipped(skippedRowKeys, button),
  wait = sleep,
  onIdle = scrollPlaylistWindow,
  retryDelay = config?.retryDelay ?? 800,
  maxRetries = config?.maxRetries ?? 2,
  continueOnFailure = config?.continueOnFailure ?? false,
  delay = config?.timeout ?? 0,
}) => {
  const effectiveConfig = {
    retryDelay,
    maxRetries,
    continueOnFailure,
  };
  let idlePasses = 0;
  let button = findButton();

  // Drain visible rows until nothing actionable remains, probing again between idle passes.
  /* eslint-disable no-await-in-loop */
  while (button || idlePasses < maxIdlePasses) {
    if (button) {
      idlePasses = 0;
      await removeButtonWithRetries({
        button,
        skippedRowKeys,
        config: effectiveConfig,
        getButton: () => findButton(),
        removeButton,
        onSkip,
        wait,
      });

      await wait(delay);
    } else {
      // This idle phase gives YouTube a chance to mount more playlist rows in virtualized views.
      idlePasses += 1;
      await onIdle();
      await wait(delay);
    }

    button = findButton();
  }
};

const clearPlaylist = async () => {
  const rowCount = getPlaylistItemCount();
  const mode = getClearMode(rowCount);
  const baseDelay = await GM.getValue('timeout', 300);
  const skippedRowKeys = new Set();
  const config = mode === 'reliable'
    ? {
      timeout: 1200,
      retryDelay: 800,
      maxRetries: 2,
      continueOnFailure: false,
    }
    : {
      timeout: baseDelay,
      retryDelay: 800,
      maxRetries: 0,
      continueOnFailure: true,
    };

  await drainPlaylist({ skippedRowKeys, config });
};

GM.registerMenuCommand('Clear Playlist', clearPlaylist);
