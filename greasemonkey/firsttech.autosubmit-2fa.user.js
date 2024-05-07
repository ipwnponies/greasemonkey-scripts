// ==UserScript==
// @name        Auto submit upon paste - firsttechfed.com
// @namespace   ipwnponies
// @match       https://banking.firsttechfed.com/Authentication
// @grant       none
// @version     1.1
// @author      ipwnponies
// @require https://cdn.jsdelivr.net/npm/@violentmonkey/dom@2
// @description Clicky button when 2fa code is pasted
// ==/UserScript==

const app = document.querySelector('#app > div.isotope-page--authentication');
const totpInputFinder = document.querySelector.bind(document, 'form.isotope-step-up-category--totp');

VM.observe(app, () => {
  const totpInput = totpInputFinder();
  if (totpInput) {
    const action = () => {
      setTimeout(() => document.querySelector('#btn_SubmitTOTP').click(), 1);
    };
    totpInput.addEventListener('paste', action);
    totpInput.addEventListener('change', action);

    return true;
  }

  return undefined;
});
