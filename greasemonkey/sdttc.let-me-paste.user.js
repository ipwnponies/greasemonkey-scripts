// ==UserScript==
// @name        Let me paste - sdttc.com
// @namespace   ipwnponies
// @match       https://wps.sdttc.com/webpayments/CoSDTreasurer2/payment
// @grant       none
// @version     1.0
// @author      -
// @description Why the ass would you not allow paste of bank account info. Unfuck their shit.
// ==/UserScript==

document.addEventListener(
  'paste',
  (e) => {
    e.stopPropagation();
  },
  true,
);
