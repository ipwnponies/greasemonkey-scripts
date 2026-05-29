// ==UserScript==
// @name        Redirect direct image resource - tadpoles.com
// @namespace   ipwnponies
// @match       https://www.tadpoles.com/m/p/*
// @grant       none
// @version     1.0.1
// @description Direct redirect to image source. This makes it trivial to save the image
// ==/UserScript==

/* global tadpoles */
// The html document has an inline script that declares `tadpoles` and sets photoURL attribute
window.location.assign(tadpoles.photoURL);
