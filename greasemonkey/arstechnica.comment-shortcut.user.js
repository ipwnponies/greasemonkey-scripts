// ==UserScript==
// @name        Comment kb shortcut - arstechnica.com
// @namespace   ipwnponies
// @match       https://arstechnica.com/*
// @grant       none
// @version     1.0
// @author      ipwnponies
// @require https://cdn.jsdelivr.net/npm/@violentmonkey/shortcut@1
// @description Add shortcut to go to comment section
// ==/UserScript==

const { register } = VM.shortcut;

const comments = document.querySelector('#social-footer a');

register('ctrl-k', () => {
  comments.click();
});
