// ==UserScript==
// @name        Clear Youtube playlists
// @namespace   ipwnponies
// @match       https://www.youtube.com/playlist
// @grant       GM.registerMenuCommand
// @grant       GM.getValue
// @version     1.5
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
  const playlistItemsMenus = document.querySelectorAll('#primary button[aria-label="Action menu"]');
  const timeout = await GM.getValue('timeout', 300)

  playlistItemsMenus.forEach((action, index) => {
    setTimeout(() => removeFromPlaylist(action), index * timeout);
  });
};

const createClearPlaylistButton = () => {
  const menuItem = document.createElement('button');

  menuItem.addEventListener('click', clearPlaylist);
  menuItem.type = 'button';
  menuItem.innerText = '👀🗑';
  menuItem.style = 'background-color: red';

  return menuItem;
};

// Add button once DOM is populated
const mutationCallback = (mutationsList, observer) => {
  // Target the playlist side bar
  const sideBar = 'ytd-playlist-header-renderer';
  const mutation = mutationsList.find(({ target }) => target.elementMatches(sideBar));

  if (mutation) {
    observer.disconnect();
    mutation.target.querySelector('#edit-button').after(createClearPlaylistButton());
  }
};

// Youtube page has zero server-side rendering
// Observe the entire page, so we can properly wait for target sidebar to be added to DOM
window.addEventListener('load', async () => {
  const observer = new MutationObserver(mutationCallback);
  observer.observe(document, { subtree: true, childList: true });
});

GM.registerMenuCommand('Clear Playlist', clearPlaylist);
