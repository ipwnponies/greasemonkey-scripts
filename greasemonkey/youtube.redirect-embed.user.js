// ==UserScript==
// @name        Redirect youtube to nocoookie - youtube.com
// @namespace   ipwnponies
// @match       https://www.youtube.com/embed/watch?v=*
// @match       https://www.youtube.com/embed/*
// @match       https://www.youtube.com/watch?v=*
// @grant       none
// @version     1.1
// @description Redirect from youtube to nocookie embed Add referrer to youtube embed
// ==/UserScript==

'use strict';

function resolveVideoId(search, pathname) {
  const searchParams = new URLSearchParams(search);
  const fromQuery = searchParams.get('v');
  if (fromQuery) {
    return fromQuery;
  }

  // Handle URLs like https://www.youtube.com/embed/<VIDEO_ID> when the query is empty
  const parts = pathname.split('/').filter(Boolean);
  const embedIndex = parts.indexOf('embed');
  if (embedIndex !== -1) {
    const potentialId = parts[embedIndex + 1];
    if (potentialId && potentialId !== 'watch') {
      return potentialId;
    }
  }

  return null;
}

function redirect() {
  const videoId = resolveVideoId(location.search, location.pathname);
  if (!videoId) {
    console.warn('Unable to determine YouTube video id for redirect', location.href);
    return;
  }

  const redirectUrl = new URL(`https://www.youtube-nocookie.com/embed/${videoId}`);
  window.location.assign(redirectUrl);
}

redirect();
