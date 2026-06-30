// ==UserScript==
// @name        Open practice list in same tab - neetcode.io
// @namespace   ipwnponies
// @match       https://neetcode.io/*
// @grant       GM.registerMenuCommand
// @version     1.0.0
// @require     https://cdn.jsdelivr.net/npm/@violentmonkey/dom@2
// @description Add a menu command for the practice list, and fix the "Open List" button to navigate same-tab.
// ==/UserScript==

function goToPractice() {
  window.location.assign('/practice');
}

GM.registerMenuCommand('Go to practice list', goToPractice);

VM.observe(document.body, () => {
  const openListBtn = document.querySelector('[data-tooltip="Open List"]');
  if (openListBtn && !openListBtn.dataset.practiceListPatched) {
    openListBtn.dataset.practiceListPatched = 'true';
    openListBtn.addEventListener(
      'click',
      (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        goToPractice();
      },
      { capture: true },
    );
  }
});
