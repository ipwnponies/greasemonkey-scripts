// ==UserScript==
// @name        Mealpal with Yelp Reviews [DEPRECATED]
// @namespace   ipwnponies
// @author      ipwnponies
// @description [DEPRECATED] No longer maintained. Add link to yelp reviews, for mealpal
// @version     1.1.2
// @match       https://secure.mealpal.com/lunch
// @grant       GM_xmlhttpRequest
// @grant       GM_getValue
// @grant       GM_openInTab
// ==/UserScript==

// Load yelp api key from config
const getApiKey = () => {
  const apiKey = GM_getValue('apiKey');
  if (!apiKey) {
    // eslint-disable-next-line no-alert
    alert('You need to set the yelp api token before using this script. Set "apiKey"');
    throw new Error('apiToken not set');
  }

  return apiKey;
};

// I guess this is how we do sleep in javascript. Because promises are the new hotness.
const sleep = async (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Add button to hit load yelp page for business and search for mealpal
const addYelpButton = (node) => {
  // Noop if already has button, as marked by prescence special class
  if (node.nextElementSibling.classList.contains('ipwnponies')) {
    return;
  }

  const link = document.createElement('input');
  link.type = 'button';
  link.value = 'See Yelp reviews';
  link.classList.add('btn', 'btn-primary', 'ipwnponies');
  link.onclick = () => {
    const key = getApiKey();

    const name = node.parentNode.parentNode.querySelector('.restaurant .name').textContent;
    const address = node.parentNode.parentNode
      .querySelector('.restaurant .address')
      .textContent.replace(/^\s+|\s+$/g, '');
    const graphqlQuery = `
      {
        search(
          term: "${name}",
          location:"${address} SF",
          radius: 200,
          categories: "restaurants",limit:1, sort_by:"distance"
        ) {
          business {
            name
            url
          }
        }
      }
    `;

    GM_xmlhttpRequest({
      method: 'POST',
      url: 'https://api.yelp.com/v3/graphql',
      data: graphqlQuery,
      headers: {
        'Content-Type': 'application/graphql',
        'Accept-Language': 'en-US',
        Authorization: `Bearer ${key}`,
      },
      onload(gmResponse) {
        const response = JSON.parse(gmResponse.response);
        if (gmResponse.status === 200 && response.data.search.business) {
          const { url } = response.data.search.business[0];
          // Open yelp page in new tab, query for mealpal
          GM_openInTab(`${url}&q=mealpal`, true);
        }
      },
    });
  };

  node.after(link);
};

// Callback to react to new restaurants in search result
const infiniteScrollbackCallback = (mutationsList) => {
  for (const mutation of mutationsList) {
    mutation.addedNodes.forEach((restaurantRoot) => {
      // Ignore comments, only interested in list of restaurant elements
      if (restaurantRoot instanceof Element) {
        const descriptionDiv = restaurantRoot.querySelector(
          'div.fade-box > div[bo-text="schedule.meal.shortDescription"]',
        );
        addYelpButton(descriptionDiv);
      }
    });
  }
};

// Download bootstrap CSS for the prettiness
const loadBootstrapCss = () => {
  const link = document.createElement('link');
  document.head.appendChild(link);

  link.href = 'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css';
  link.rel = 'stylesheet';
  link.type = 'text/css';
  link.integrity = 'sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u';
  link.crossorigin = 'anonymous';
};

// Set up event listener to know when search results change
const listenOnInfiniteScroll = async () => {
  let infiniteScroll = false;

  // Wait until document is finished loading. I don't know what event to properly wait on
  while (!infiniteScroll) {
    // eslint-disable-next-line no-await-in-loop
    await sleep(1000);
    infiniteScroll = document.querySelector('#mp-meal-list > div[infinite-scroll]');
  }

  new MutationObserver(infiniteScrollbackCallback).observe(infiniteScroll, { childList: true });
};

// Attach buttons for initial document load.
// Because for some reason the events don't fire but the list also isn't loaded.
// Subsequent restaurants will have buttons added automatically via event listener
const initialSetYelpButtonsForRestaurants = async () => {
  // Wait arbitrarily long enough for these stupid things to load.
  // If it takes longer, whatever. The user will have moved on with life, unlike me at this point in the night.
  // eslint-disable-next-line no-await-in-loop
  await sleep(2000);
  const nodes = document.querySelectorAll('div.description[bo-text="schedule.meal.shortDescription"]');
  nodes.forEach(addYelpButton);
};

loadBootstrapCss();
listenOnInfiniteScroll();
initialSetYelpButtonsForRestaurants();
