// ==UserScript==
// @name        Redirect direct image resource - tadpoles.com
// @namespace   ipwnponies
// @match       https://www.tadpoles.com/m/p/*
// @grant       none
// @version     1.0
// @author      ipwnponies
// @description Direct redirect to image source. This makes it trivial to save the image
// ==/UserScript==

// The html document has an inline script that declares `tadpoles` and sets photoURL attribute
location.assign(tadpoles.photoURL);
