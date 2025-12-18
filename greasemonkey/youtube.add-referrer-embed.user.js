// ==UserScript==
// @name        Add referrer header - youtube-nocookie.com
// @namespace   ipwnponies
// @match       https://www.youtube-nocookie.com/embed/*
// @grant       none
// @version     1.0
// @description Add referrer to youtube embed. So that it works. Incredible
// ==/UserScript==

function addReferrer() {
  'use strict';

  const isIframe = window.top != window.self;

  if (isIframe || document.referrer == 'https://www.youtube-nocookie.com/') {
    // Noop if it's embedded already. Or if we successfully added referrer
    return;
  }
  const desiredEmbedUrl = window.location;
  const redirectUrl = buildRedirectorUrl(desiredEmbedUrl);
  window.location.replace(redirectUrl);
}

function buildRedirectorUrl(targetUrl) {
  const redirector = new URL('https://duckduckgo.com/l/');
  redirector.searchParams.set('uddg', targetUrl);

  return redirector.href;
}

addReferrer();
