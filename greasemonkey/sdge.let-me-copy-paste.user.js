// ==UserScript==
// @name        Let me copy-paste - sdge.com
// @namespace   ipwnponies
// @match       https://myaccount.sdge.com/portal/PreLogin/Validate
// @grant       none
// @version     1.0
// @author      ipwnponies
// @description Why the ass would you not allow paste of the 2FA code. Unfuck their shit.
// ==/UserScript==

const input = document.querySelector('#t_x_t_c_o_d_e');
input.addEventListener('paste', (e) => {
  e.stopImmediatePropagation();
});
