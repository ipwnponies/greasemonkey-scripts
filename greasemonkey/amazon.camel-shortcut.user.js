// ==UserScript==
// @name        Look up camelcamelcamel shortcut - amazon.com
// @namespace   ipwnponies
// @match       https://www.amazon.com/dp/*
// @match       https://www.amazon.com/*/dp/*
// @grant       none
// @version     1.0
// @require     https://cdn.jsdelivr.net/npm/@violentmonkey/shortcut@1
// @description Add shortcut to look up item in camelcamelcamel
// ==/UserScript==

const { register } = VM.shortcut;

register('ctrl-k', () => {
  const url = new URL(location);
  const match = url.pathname.match(/\/dp\/(?<product>[A-Z0-9]+)/i);
  const { product } = match.groups;

  location.assign(`https://camelcamelcamel.com/product/${product}`);
});
