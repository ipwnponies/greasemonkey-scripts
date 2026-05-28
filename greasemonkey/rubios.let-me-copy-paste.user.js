// ==UserScript==
// @name        Let me copy-paste - tellrubios.com
// @namespace   ipwnponies
// @match       https://tellrubios.com/Finish.aspx
// @grant       none
// @version     1.1
// @description For some unknown reason, they have prevented selection. Unfuck their shit.
// ==/UserScript==

// Their selectstart event handler is placed on dom root
document.body.addEventListener('selectstart', (e) => e.stopPropagation());
