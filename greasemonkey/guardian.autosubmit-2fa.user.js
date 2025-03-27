// ==UserScript==
// @name        Autosubmit upon paste - guardianlife.com
// @namespace   ipwnponies
// @match       https://login.guardianlife.com/oauth2/default/v1/authorize*
// @grant       none
// @version     1.0
// @author      ipwnponies
// @require     https://cdn.jsdelivr.net/npm/@violentmonkey/dom@2
// @description Clicky button when login or 2fa code is pasted or inserted by password manager
// ==/UserScript==

VM.observe(document.querySelector('main'), () => {
  const input = document.querySelector('input[name="credentials.passcode"]');
  if (input) {
    input.addEventListener('paste', () => {
      document.querySelector('form input[type="submit"]').click();
    });
    return true;
  }

  return undefined;
});
