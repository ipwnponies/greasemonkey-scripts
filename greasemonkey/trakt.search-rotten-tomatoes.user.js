// ==UserScript==
// @name        Add Rotten Tomatoes link - trakt.tv
// @namespace   ipwnponies
// @match       https://trakt.tv/movies/*
// @grant       GM_registerMenuCommand
// @version     1.1
// @require     https://cdn.jsdelivr.net/npm/@violentmonkey/shortcut@1
// @author      ipwnponies
// @description Add a link to search movie on rotten tomatoes
// ==/UserScript==

const getMovieName = () => {
  const headerNode = document.querySelector('.container.summary h1');
  const anchorNode = headerNode.querySelector('a');
  const titleNode = Array.from((anchorNode ?? headerNode).childNodes).find((i) => i.nodeType === Node.TEXT_NODE);
  return titleNode.nodeValue;
};

const rtLink = document.createElement('a');
rtLink.target = '_blank';
rtLink.text = 'Rotten Tomatoes';
rtLink.href = `https://www.rottentomatoes.com/search?search=${getMovieName()}`;

const main = () => {
  const externalLinkContainer = document.querySelector('.external > li');
  externalLinkContainer.append(rtLink);
};

main();
