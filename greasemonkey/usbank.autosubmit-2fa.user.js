// ==UserScript==
// @name        Autosubmit 2FA script usbank.com
// @namespace   ipwnponies
// @match       https://onlinebanking.usbank.com/auth/login/*
// @grant       none
// @version     1.0.1
// @author      ipwnponies
// @require     https://cdn.jsdelivr.net/npm/@violentmonkey/dom@2
// @description Clicky button when login or 2fa code is pasted or inserted by password manager
// ==/UserScript==

VM.observe(document.querySelector('body'), () => {
  const form = document.querySelector('#otpEntryPageForm');

  if (form) {
    const input = form.querySelector('input');
    const submit = form.querySelector('#otp-cont-button');

    for (const event of ['paste', 'change']) {
      input.addEventListener(event, () => {
        requestAnimationFrame(() => {
          submit.click();
        });
      });
    }

    return true;
  }

  return undefined;
});
