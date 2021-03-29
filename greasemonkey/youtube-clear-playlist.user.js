// ==UserScript==
// @name        Clear Youtube playlists
// @namespace   ipwnponies
// @match       https://www.youtube.com/playlist
// @grant       none
// @version     0.1
// @description Add a button to clear all items in a playlist.
// ==/UserScript==
const addRemoveAllButton = (container) => {
};

const mutationCallback = (mutationsList, observer) => {
  // Find mutation that results in populating sibling nodes
  // This means it's safe for us to append our node
  const mutation = mutationsList.find(
    ({ target, addedNodes }) => target.elementMatches('tp-yt-paper-listbox#items') && addedNodes.length,
  );

  if (mutation) {
    observer.disconnect();
    addRemoveAllButton(mutation.target);
  }
};

window.addEventListener('DOMContentLoaded', async () => {
  const frame = document.querySelector('ytd-popup-container');

  const observer = new MutationObserver(mutationCallback);
  observer.observe(frame, { subtree: true, childList: true });
});
