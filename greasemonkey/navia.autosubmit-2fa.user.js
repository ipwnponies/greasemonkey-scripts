// ==UserScript==
// @name        Autosubmit 2FA -- naviabenefits.com
// @namespace   ipwnponies
// @match       https://app.naviabenefits.com/*
// @grant       none
// @version     1.0
// @author      ipwnponies
// @require     https://cdn.jsdelivr.net/npm/@violentmonkey/dom@2
// @description Clicky button when login or 2fa code is pasted or inserted by password manager
// ==/UserScript==

VM.observe(document, () => {
  const modal = document.querySelector('.modal-content');
  const input = modal?.querySelector('input[name="2FACode"]');
  if (input) {
    // Some shits is wrapping the native event listening registration. For shit reasons
    input.addEventListener.__zone_symbol__OriginalDelegate.call(
      input,
      'paste',
      () => {
        // requestAnimationFrame is needed so that the button can be enabled
        requestAnimationFrame(() => {
          modal.querySelector('button.btn-primary').click();
        });
      },
      false,
    );

    return true;
  }
});
