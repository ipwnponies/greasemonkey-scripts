// ==UserScript==
// @name        HowLongToBeat Sort Date Completed
// @namespace   ipwnponies
// @description Set the completed list sort order to "date completed" instead of default alphabetical ordering.
// @match       https://howlongtobeat.com/user
// @grant       none
// @version     1.0
// ==/UserScript==

const main = async () => {
  const sortDropDown = document.querySelector('select[aria-label="Sort Options"]');

  const orderByCompletionDateOption = sortDropDown.querySelector('option[value="date_complete"]');
  orderByCompletionDateOption.selected = true;
  
  sortDropDown.onchange();
};

// Because URL path designs is hard work, so we use hodgepodge mess of query params as well as js state
const isCompletedPage = () => {
  const queryParams = new URLSearchParams(document.location.search);
  return queryParams.has('s') && queryParams.has('completed');
};

if (isCompletedPage()) {
  window.addEventListener('load', main);
};