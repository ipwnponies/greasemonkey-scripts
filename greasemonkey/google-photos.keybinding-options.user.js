// ==UserScript==
// @name        Keybinding for options -  photos.google.com
// @namespace   ipwnponies
// @match       https://photos.google.com/share/*
// @match       https://photos.google.com/album/*
// @grant       none
// @version     1.0.2
// @author      ipwnponies
// @require https://cdn.jsdelivr.net/npm/@violentmonkey/shortcut@1
// @description Keybinding to access the options menu in Google Photos
// ==/UserScript==

const { register } = VM.shortcut;

register('period', () => {
  const elements = document.querySelectorAll('[aria-label="More options"]');
  const element = Array.from(elements)
    .reverse()
    .find((i) => i.checkVisibility());

  element.click();
});
