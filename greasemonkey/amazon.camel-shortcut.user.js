// ==UserScript==
// @name        Look up camelcamelcamel shortcut - amazon.com
// @namespace   ipwnponies
// @match       https://www.amazon.com/dp/*
// @match       https://www.amazon.com/*/dp/*
// @match       https://www.amazon.com/gp/product/*
// @grant       none
// @version     1.1
// @require     https://cdn.jsdelivr.net/npm/@violentmonkey/shortcut@1
// @description Add shortcut to look up item in camelcamelcamel
// ==/UserScript==

const { register } = VM.shortcut;

register('ctrl-k', () => {
  const url = new URL(location);

  const regexp = url.pathname.startsWith('/gp/product/')
    ? /\/gp\/product\/(?<product>[A-Z0-9]+)/i
    : /\/dp\/(?<product>[A-Z0-9]+)/i;
  const match = url.pathname.match(regexp);
  const { product } = match.groups;

  location.assign(`https://camelcamelcamel.com/product/${product}`);
});
