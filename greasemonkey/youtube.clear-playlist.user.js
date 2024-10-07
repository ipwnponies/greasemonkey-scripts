// ==UserScript==
// @name        Clear Youtube playlists
// @namespace   ipwnponies
// @match       https://www.youtube.com/playlist
// @grant       GM.registerMenuCommand
// @grant       GM.getValue
// @version     1.5.1
// @author      ipwnponies
// @description Add a button to clear all items in a playlist.
// ==/UserScript==

const removeFromPlaylist = async (button) => {
  button.click();

  // Small delay for click event to resolve
  await new Promise((resolve) => setTimeout(resolve, 30));

  const things = document.evaluate(
    '//span[contains(text(),"Remove from")]',
    document,
    null,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
    null,
  );
  things.snapshotItem(0).click();
};

// Find and remove every playlist items
const clearPlaylist = async () => {
  const playlistItemsMenus = document.querySelectorAll(
    '#primary button[aria-label="Action menu"],button[aria-label="More actions"]',
  );
  const timeout = await GM.getValue('timeout', 300);

  playlistItemsMenus.forEach((action, index) => {
    setTimeout(() => removeFromPlaylist(action), index * timeout);
  });
};


GM.registerMenuCommand('Clear Playlist', clearPlaylist);
