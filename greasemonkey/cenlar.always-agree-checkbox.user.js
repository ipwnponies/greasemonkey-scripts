// ==UserScript==
// @name        Always check agree box - loanadministration.com
// @author      ipwnponies
// @version     1.1.1
// @match       https://www.loanadministration.com/*
// @grant       none
// @require     https://cdn.jsdelivr.net/npm/@violentmonkey/dom@2
// @description I'm already logging in, why wouldn't I agree to the terms?
// ==/UserScript==

VM.observe(document.querySelector('body'), () => {
  const checkbox = document.querySelector('#agreeToTerms-input');

  if (checkbox) {
    checkbox.click();
    return true;
  }
});
