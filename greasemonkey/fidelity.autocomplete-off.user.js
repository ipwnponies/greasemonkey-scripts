// ==UserScript==
// @name        Fidelity One-time Code Autocomplete Disable
// @namespace   ipwnponies
// @description Disable browser autocomplete for html input
// @version     1.0.0
// @match       https://login.fidelity.com/ftgw/Fas/Fidelity/RtlCust/Login/Response
// @grant       none
// ==/UserScript==

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  await sleep(200);

  document.querySelector('#credentialCode').autocomplete = 'off';
};

main();
