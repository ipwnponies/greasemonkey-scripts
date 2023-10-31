// ==UserScript==
// @name        Approve shortcut - github.com
// @namespace   ipwnponies
// @match       https://github.com/*/pull/*
// @grant       none
// @version     1.0
// @author      ipwnponies
// @require     https://cdn.jsdelivr.net/npm/@violentmonkey/shortcut@1
// @description Add shortcut to ship it!
// ==/UserScript==
const { register } = VM.shortcut;

register('ctrl-l', () => {
  // Approve review button
  const button = document.querySelector(
    '#pull_requests_submit_review button[value="approve"]',
  );

  if (button) {
  button.click();
  } else {
    // Find the "Add your review" button
     const link = document.querySelector('a[href$="files#submit-review"]');
    link.click()
  }
});
