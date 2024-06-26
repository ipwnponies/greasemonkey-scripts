// ==UserScript==
// @name        Auto submit upon paste - paypal.com
// @namespace   ipwnponies
// @match       https://www.paypal.com/authflow/twofactor/*
// @grant       none
// @version     1.1
// @author      ipwnponies
// @description Clicky button when 2fa code is pasted
// ==/UserScript==

// Technically the first digit input
const totpInput = document.querySelector('#ci-otpCode-0');

const action = async () => {
  await new Promise((r) => setTimeout(r, 100));

  document.querySelector('#content form button[type=submit]').click();
};

totpInput.addEventListener('paste', action);
totpInput.addEventListener('change', action);
