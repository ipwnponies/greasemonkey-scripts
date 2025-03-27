// ==UserScript==
// @name        Auto submit upon paste - carta.com
// @namespace   ipwnponies
// @match       https://login.app.carta.com/credentials/login/
// @match       https://login.app.carta.com/credentials/2fa/verify-challenge/
// @grant       none
// @version     1.0
// @author      ipwnponies
// @require     https://cdn.jsdelivr.net/npm/@violentmonkey/dom@2
// @description Clicky button when login or 2fa code is pasted or inserted by password manager
// ==/UserScript==

const clickButton = (selector) => () => {
  setTimeout(() => {
    const button = document.querySelector(selector);
    button?.click();
  });
};

for (const i of [
  { name: 'login', input: '#password', clicky: '#login-btn' },
  { name: '2fa', input: '#two-factor-code-input', clicky: '#verify-challenge-btn' },
]) {
  VM.observe(document.querySelector('body'), () => {
    const input = document.querySelector(i.input);
    if (input) {
      for (const event of ['paste', 'change']) {
        input.addEventListener(event, clickButton(i.clicky));
      }
      return true;
    }

    return undefined;
  });
}
