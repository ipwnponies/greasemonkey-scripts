// ==UserScript==
// @name        Edit shortcut - github.com
// @namespace   ipwnponies
// @match       https://github.com/*/pull/*
// @match       https://github.com/*
// @grant       none
// @version     1.0.1
// @author      ipwnponies
// @require     https://cdn.jsdelivr.net/npm/@violentmonkey/shortcut@1
// @description Add shortcut to edit the pull request description
// ==/UserScript==
const { register } = VM.shortcut;

register('ctrl-k', () => {
  const issueCommentEdit = document.querySelector(
    '.editable-comment[id^=pullrequest-] .timeline-comment-action.js-comment-edit-button',
  );
  issueCommentEdit.click();
});
