// ==UserScript==
// @name        Clear Youtube playlists
// @namespace   ipwnponies
// @match       https://www.youtube.com/playlist
// @grant       none
// @version     1.0
// @description Add a button to clear all items in a playlist.
// ==/UserScript==

const removeFromPlaylist = async (button) => {
  button.click();

  // Small delay for click event to resolve
  await new Promise(resolve => setTimeout(resolve, 30));

  const things = document.evaluate(
    '//span[contains(text(),"Remove from")]',
    document,
    null,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
    null,
  );
  things.snapshotItem(0).click();
};

// Create menu item by cloning sibling. Change the text and add callback hook
const addClearMenuItem = (container) => {
  const menuItem = container.children[0].cloneNode();
  container.appendChild(menuItem);

  const clearPlaylist = () => {
    const video = document.querySelectorAll('#primary button[aria-label="Action menu"]');
    video.forEach((action, index) => {
      setTimeout(() => removeFromPlaylist(action), index * 300);
    });
  };
  menuItem.addEventListener('click', clearPlaylist);
  menuItem.innerText = 'Clear playlist items';
};

const mutationCallback = (mutationsList, observer) => {
  // Find mutation that results in populating sibling nodes
  // This means it's safe for us to append our node
  const mutation = mutationsList.find(
    ({ target, addedNodes }) => target.elementMatches('tp-yt-paper-listbox#items') && addedNodes.length,
  );

  if (mutation) {
    observer.disconnect();
    addClearMenuItem(mutation.target);
  }
};

// Add event handler for when playlist option button is invoked
window.addEventListener('DOMContentLoaded', async () => {
  const frame = document.querySelector('ytd-popup-container');

  const observer = new MutationObserver(mutationCallback);
  observer.observe(frame, { subtree: true, childList: true });
});
