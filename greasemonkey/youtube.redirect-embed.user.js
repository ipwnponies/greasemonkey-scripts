// ==UserScript==
// @name        Redirect youtube to nocoookie - youtube.com
// @namespace   ipwnponies
// @match       https://www.youtube.com/embed/watch?v=*
// @match       https://www.youtube.com/watch?v=*
// @grant       none
// @version     1.0
// @description Redirect from youtube to nocookie embed Add referrer to youtube embed
// ==/UserScript==

function redirect() {
  'use strict';

  const searchParams = new URLSearchParams(location.search);
  const videoId = searchParams.get('v');
  const redirectUrl = new URL(`https://www.youtube-nocookie.com/embed/${videoId}`);
  window.location.assign(redirectUrl);
}

redirect();
