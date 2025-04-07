// ==UserScript==
// @name        Auto submit upon paste - freetaxusa.com
// @author      ipwnponies
// @match       https://auth.freetaxusa.com/
// @grant       none
// @version     1.0
// @require     https://cdn.jsdelivr.net/npm/@violentmonkey/dom@2
// @description Clicky button when login or 2fa code is pasted or inserted by password manager
// ==/UserScript==

VM.observe(document.querySelector('#mainContentArea'), () => {
  const input = document.querySelector('#twoFactorCode');
  if (input) {
    input.addEventListener('paste', () => {
      document.querySelector('#mainContentArea button[type="submit"]').click();
    });

    return true;
  }
});
