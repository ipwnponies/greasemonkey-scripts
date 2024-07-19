// ==UserScript==
// @name        Open all tadpole image - Gmail
// @namespace   ipwnponies
// @match       https://mail.google.com/mail/u/*/popout*
// @grant       none
// @version     1.0
// @author      ipwnponies
// @require https://cdn.jsdelivr.net/npm/@violentmonkey/shortcut@1
// @description Open all images in a new tab
// ==/UserScript==

const { register } = VM.shortcut;

register('ctrl-k', () => {
  // Look for images attached to anchor links. Ignore the company logo
  const selector = 'a[href^="https://www.tadpoles.com/"] > img:not([src*="logo.png"]';
  const links = Array.from(document.querySelectorAll(selector)).map((i) => i.parentNode);

  links.forEach((i) => i.click());
});
