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

// Login
VM.observe(document.querySelector('body'), () => {
  const totpInput = document.querySelector('#dom-pswd-input');
  if (totpInput) {
    totpInput.addEventListener('paste', () => {
      setTimeout(() => {
        const getLoginButton = () => document.querySelector('#dom-login-button');
        getLoginButton().click();
      });
    });

    return true;
  }

  return undefined;
});

VM.observe(document.querySelector('body'), () => {
  const totpInput = document.querySelector('#dom-svip-security-code-input');
  if (totpInput) {
    const clickyButton = () => {
      setTimeout(() => {
        const submitButton = document.querySelector('#dom-svip-code-submit-button');
        submitButton.click();
      }, 1);
    };
    totpInput.addEventListener('paste', clickyButton);
    // password manager integration is a field change event
    totpInput.addEventListener('change', clickyButton);

    return true;
  }

  return undefined;
});
