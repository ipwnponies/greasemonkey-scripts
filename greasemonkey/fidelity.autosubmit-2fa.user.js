// ==UserScript==
// @name        Auto submit upon paste - fidelity.com
// @namespace   ipwnponies
// @match       https://digital.fidelity.com/prgw/digital/login/full-page*
// @grant       none
// @version     2.1
// @author      ipwnponies
// @require https://cdn.jsdelivr.net/npm/@violentmonkey/dom@2
// @description Clicky button when login or 2fa code is pasted or inserted by password manager
// ==/UserScript==

const clickButton = (selector) => () => {
  setTimeout(() => {
    const button = document.querySelector(selector);
    button?.click();
  });
};

// Login
VM.observe(document.querySelector('body'), () => {
  const totpInput = document.querySelector('#dom-pswd-input');
  if (totpInput) {
    totpInput.addEventListener('paste', clickButton('#dom-login-button'));
    return true;
  }

  return undefined;
});

// 2FA
VM.observe(document.querySelector('body'), () => {
  const totpInput = document.querySelector('#dom-svip-security-code-input');
  if (totpInput) {
    const callback = clickButton('#dom-svip-code-submit-button');
    totpInput.addEventListener('paste', callback);
    totpInput.addEventListener('change', callback);
    return true;
  }

  return undefined;
});
