// ==UserScript==
// @name        Auto submit upon paste - fidelity.com
// @namespace   ipwnponies
// @match       https://digital.fidelity.com/prgw/digital/login/full-page*
// @grant       none
// @version     1.0
// @author      ipwnponies
// @require https://cdn.jsdelivr.net/npm/@violentmonkey/dom@2
// @description Clicky button when 2fa code is pasted
// ==/UserScript==

VM.observe(document.querySelector('body'), () => {
  const totpInput = document.querySelector('#dom-svip-security-code-input');
  if (totpInput) {
    totpInput.addEventListener('paste', () => {
      setTimeout(() => {
        document.querySelector('#dom-svip-code-submit-button').click();
      }, 1);
    });

    return true;
  }

  return undefined;
});
