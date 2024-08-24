// ==UserScript==
// @name        Open in new window - Gmail
// @namespace   ipwnponies
// @match       https://mail.google.com/mail/u/*
// @grant       none
// @version     1.0
// @author      ipwnponies
// @require https://cdn.jsdelivr.net/npm/@violentmonkey/shortcut@1
// @description Click the "Open in new window" button
// ==/UserScript==

const { register } = VM.shortcut;

register('ctrl-k', () => {
  const openNewWindowButton = document.querySelector('button[aria-label="In new window"]');
  openNewWindowButton.click();
});
