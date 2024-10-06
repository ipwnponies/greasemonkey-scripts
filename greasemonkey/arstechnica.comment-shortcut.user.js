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

// There are several comment bubbles, any of them work
const comments = document.querySelector('a.view-comments');

register('ctrl-k', () => {
  comments.click();
});
