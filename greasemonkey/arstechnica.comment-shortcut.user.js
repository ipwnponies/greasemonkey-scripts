// ==UserScript==
// @name        Comment kb shortcut - arstechnica.com
// @namespace   ipwnponies
// @match       https://arstechnica.com/*
// @grant       none
// @version     2.0
// @author      ipwnponies
// @require     https://cdn.jsdelivr.net/npm/@violentmonkey/shortcut@1
// @description Add shortcut to go to comment section
// ==/UserScript==

const { register } = VM.shortcut;

// There are several comment bubbles, any of them work
const comments = document.querySelector('a.view-comments');

register('ctrl-k', async () => {
  comments.click();
  await new Promise((r) => setTimeout(r, 500));

  const commentFrame = document.querySelector('#xf_thread_iframe');
  const url = new URL(commentFrame.contentDocument.location);
  url.searchParams.set('order', 'vote_score');
  commentFrame.contentDocument.location = url;
});
