// ==UserScript==
// @name        Transcript hotkey - youtube.com
// @namespace   ipwnponies
// @match       https://www.youtube.com/watch*
// @grant       none
// @version     1.0
// @author      ipwnponies
// @require     https://cdn.jsdelivr.net/npm/@violentmonkey/shortcut@1
// @description Add hotkey to click the show transcript button.
// ==/UserScript==
const { register } = VM.shortcut;

register('ctrl-k', () => {
  const showTranscript = document.querySelector('#description [aria-label="Show transcript"]');
  showTranscript.click();
});
