// ==UserScript==
// @name        Autosubmit upon paste - cascholarshare529.com
// @namespace   ipwnponies
// @match       https://www.cascholarshare529.com/cadtpl/auth/ll.cs
// @grant       none
// @version     1.0
// @author      ipwnponies
// @description Clicky button when username is pasted or inserted by password manager. Only needed for username input
// page, the password input page is auto submit-able
// ==/UserScript==

const form = document.querySelector('form#form');
const input = form.querySelector('input#form_username');
const submit = form.querySelector('button');

for (const event of ['paste', 'change']) {
  input.addEventListener(event, () => {
    requestAnimationFrame(() => {
      submit.click();
    });
  });
}
