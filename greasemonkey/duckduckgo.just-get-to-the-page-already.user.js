// ==UserScript==
// @name        Just get to the page already - duckduckgo.com
// @namespace   ipwnponies
// @match       https://duckduckgo.com/*
// @grant       none
// @version     1.2
// @author      ipwnponies
// @require     https://cdn.jsdelivr.net/npm/@violentmonkey/dom@2
// @description Clicky button when using AI chat. It always prompts because no prior cookies when using clean containers
// ==/UserScript==

VM.observe(document.querySelector('body'), () => {
  const agreeButton = Array.from(document.querySelectorAll('[data-type=modal-overlay] button')).find(
    (i) => i.textContent === 'Agree and Continue',
  );
  if (agreeButton) {
    agreeButton.click();
    return true;
  }

  return undefined;
});
