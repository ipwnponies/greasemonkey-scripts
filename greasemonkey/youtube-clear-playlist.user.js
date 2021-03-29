// ==UserScript==
// @name        Clear Youtube playlists
// @namespace   ipwnponies
// @match       https://www.youtube.com/playlist
// @grant       none
// @version     0.1
// @description Add a button to clear all items in a playlist.
// ==/UserScript==
window.addEventListener('DOMContentLoaded', async () => {
  const frame = document.querySelector('ytd-popup-container');

  const observer = new MutationObserver(mutationCallback);
  observer.observe(frame, { subtree: true, childList: true });
});

const mutationCallback = (mutationsList, observer) => {
};
