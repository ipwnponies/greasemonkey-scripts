// ==UserScript==
// @name        DMV - Allow Paste
// @namespace   ipwnponies
// @match       https://www.dmv.ca.gov/sc/shoppingcart/paymentMethod.do
// @match       https://www.dmv.ca.gov/sc/shoppingcart/submitECheckPayment.do
// @grant       none
// @version     1.0
// @description Allow paste
// ==/UserScript==

const fieldIds = ['bankRoutingNo', 'validateBankRoutingNo', 'bankAcctNo', 'validateBankAcctNo'];

fieldIds.forEach((id) => {
  const field = document.getElementById(id);
  if (field) {
    // Intercept Ctrl+V / Cmd+V before their blocker runs
    field.addEventListener(
      'keydown',
      (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
          e.stopImmediatePropagation();
        }
      },
      { capture: true },
    );
  }
});
