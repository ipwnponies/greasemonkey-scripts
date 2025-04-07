// ==UserScript==
// @name        Always check agree box - loanadministration.com
// @author      ipwnponies
// @version     1.0
// @match       https://www.loanadministration.com/cenlarfsb/
// @grant       none
// @require     https://cdn.jsdelivr.net/npm/@violentmonkey/dom@2
// @description 7/7/2023, 12:04:23 AM
// ==/UserScript==
VM.observe(document.querySelector('body'), () => {
  const checkbox = document.querySelector('#agreeToTerms-input');

  if (checkbox) {
    checkbox.checked = true;
    return true;
  }
});
