// ==UserScript==
// @name        Fidelity One-time Code Autocomplete Disable
// @namespace   ipwnponies
// @version     1.0.1
// @match       https://login.fidelity.com/ftgw/Fas/Fidelity/RtlCust/Login/Response
// @grant       none
// @description Disable browser autocomplete for html input
// ==/UserScript==

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  await sleep(200);

  document.querySelector('#credentialCode').autocomplete = 'off';
}

main();
