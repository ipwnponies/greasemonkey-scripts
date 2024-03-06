// ==UserScript==
// @name        Auto submit upon paste - fidelity.com
// @namespace   ipwnponies
// @match       https://digital.fidelity.com/prgw/digital/login/full-page*
// @grant       none
// @version     2.0
// @author      ipwnponies
// @require https://cdn.jsdelivr.net/npm/@violentmonkey/dom@2
// @description Clicky button when login or 2fa code is pasted or inserted by password manager
// ==/UserScript==

// Login
const getLoginButton = () => document.querySelector('#dom-login-button');
VM.observe(document.querySelector('body'), () => {
  const totpInput = getLoginButton();
  if (totpInput) {
    totpInput.addEventListener('change', () => {
      setTimeout(() => {
        getLoginButton().click();
      });
    });

    return true;
  }

  return undefined;
});

// 2FA
const get2FAButton = () => document.querySelector('#dom-svip-code-submit-button');
VM.observe(document.querySelector('body'), () => {
  const totpInput = get2FAButton();
  if (totpInput) {
    const clickyButton = () => {
      setTimeout(() => {
        get2FAButton().click();
      }, 1);
    };
    totpInput.addEventListener('paste', clickyButton);
    // password manager integration is a field change event
    totpInput.addEventListener('change', clickyButton);

    return true;
  }

  return undefined;
});
