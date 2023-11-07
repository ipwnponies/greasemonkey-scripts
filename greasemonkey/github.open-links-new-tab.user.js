// ==UserScript==
// @name        Open PR links in new tab - github.com
// @namespace   ipwnponies
// @match       https://github.com/*/*/pull/*
// @grant       none
// @version     1.0
// @author      ipwnponies
// @description When you're reviewing a github pull request, the last thing you want is to navigate away from that tab.
// ==/UserScript==
const links = document.querySelectorAll('.comment-body a');
links.forEach((i) => (i.target = '_blank'));
