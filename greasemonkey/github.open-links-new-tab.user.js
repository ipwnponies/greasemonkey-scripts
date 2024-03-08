// ==UserScript==
// @name        Open PR links in new tab - github.com
// @namespace   ipwnponies
// @match       https://github.com/*/*/pull/*
// @grant       none
// @version     1.2
// @author      ipwnponies
// @description When you're reviewing a github pull request, the last thing you want is to navigate away from that tab.
// ==/UserScript==
const mutationCallback = () => {
  const isAnchorLink = (origin, pathname) => origin == location.origin && pathname == location.pathname;
  const links = document.querySelectorAll('.comment-body a');

  // Leave anchor links alone. target="_blank" breaks their anchorness.
  const externalLinks = Array.from(links).filter((i) => !isAnchorLink(i.origin, i.pathname));

  externalLinks.forEach((i) => {
    i.target = '_blank';
  });
};

const observer = new MutationObserver(mutationCallback);
observer.observe(document.querySelector('body'), { subtree: true, childList: true });
