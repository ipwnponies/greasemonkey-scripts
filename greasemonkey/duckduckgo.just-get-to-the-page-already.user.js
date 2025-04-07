// ==UserScript==
// @name        Just get to the page already - duckduckgo.com
// @namespace   ipwnponies
// @match       https://duckduckgo.com/*ia=chat*
// @grant       none
// @version     1.0
// @author      ipwnponies
// @require     https://cdn.jsdelivr.net/npm/@violentmonkey/dom@2
// @description Clicky button when using AI chat. It always prompts because no prior cookies when using clean containers
// ==/UserScript==

VM.observe(document.querySelector('body'), () => {
  const agreeButton = Array.from(document.querySelectorAll('main button')).find((i) => i.textContent == 'I Agree');
  if (agreeButton) {
    agreeButton.click();
    return true;
  }

  return undefined;
});
