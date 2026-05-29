// ==UserScript==
// @name        leetcode filtering tags
// @namespace   ipwnponies
// @match       https://leetcode.com/tag/*
// @grant       none
// @version     1.0.1
// @description When viewing problems by tags, there are no filters.
//              Why? Who knows. But it's a trivial problem solved with some javscripts.
// ==/UserScript==

const filters = new Map([
  [
    'easy',
    {
      text: 'Easy',
      id: 'easyCheckboxId',
      cssSelector: 'span.label-success',
    },
  ],
  [
    'medium',
    {
      text: 'Medium',
      id: 'medCheckboxId',
      cssSelector: 'span.label-warning',
    },
  ],
  [
    'hard',
    {
      text: 'Hard',
      id: 'hardCheckboxId',
      cssSelector: 'span.label-danger',
    },
  ],
  [
    'completed',
    {
      text: 'Completed',
      id: 'completedCheckboxId',
      cssSelector: '.text-success',
    },
  ],
  [
    'subscription',
    {
      text: 'Subscription Required',
      id: 'subscriptionCheckboxId',
      cssSelector: '.fa-lock',
    },
  ],
]);

const filterTests = () => {
  const allTests = Array.from(document.querySelectorAll('.reactable-data > tr').values());
  allTests.forEach((i) => {
    i.hidden = false;
  });

  for (const { id, cssSelector } of filters.values()) {
    const { checked } = document.getElementById(id);
    if (!checked) {
      allTests
        .filter((i) => i.querySelector(cssSelector))
        .forEach((i) => {
          i.hidden = !checked;
        });
    }
  }
};

const createFilter = ({ text, id }) => {
  // I was too lazy to introduce a parent component, so that I could probably add left-right margins
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.id = id;
  checkbox.checked = true;
  checkbox.addEventListener('change', filterTests);
  checkbox.style.marginLeft = '1em';

  const label = document.createElement('label');
  label.appendChild(document.createTextNode(text));
  label.htmlFor = id;
  label.style.marginRight = '1em';

  document.querySelector('.table-responsive').insertAdjacentElement('beforeBegin', checkbox);
  document.querySelector('.table-responsive').insertAdjacentElement('beforeBegin', label);
};

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  while (!document.querySelector('.table-responsive')) {
    // eslint-disable-next-line no-await-in-loop
    await sleep(200);
  }

  for (const i of filters.values()) {
    createFilter(i);
  }
}

main();
