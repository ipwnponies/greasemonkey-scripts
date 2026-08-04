// ==UserScript==
// @name         Copy to Markdown - linkedin.com
// @namespace    ipwnponies
// @icon         data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGlkPSJMYXllcl8xIiBkYXRhLW5hbWU9IkxheWVyIDEiIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgdmlld0JveD0iMCAwIDY0IDY0Ij4KICA8c3R5bGU+CiAgICAuZmF2aWNvbi1iYWNrZ3JvdW5kIHsgZmlsbDogIzBhNjZjMjsgfQogICAgLmZhdmljb24tdGV4dCB7IGZpbGw6ICNmZmY7IH0KICA8L3N0eWxlPgogIDxwYXRoIGNsYXNzPSJmYXZpY29uLWJhY2tncm91bmQiIGQ9Ik01NS45Miw0SDguMDhBNC4wOCw0LjA4LDAsMCwwLDQsOC4wOFY1NS45MkE0LjA4LDQuMDgsMCwwLDAsOC4wOCw2MEg1NS45MkE0LjA4LDQuMDgsMCwwLDAsNjAsNTUuOTJWOC4wOEE0LjA4LDQuMDgsMCwwLDAsNTUuOTIsNFpNMjAsNTJIMTJWMjVoOFpNMTYsMjAuN2E0LjcsNC43LDAsMCwxLDAtOS40aDBhNC43LDQuNywwLDAsMSwwLDkuNFpNNTIsNTJINDRWMzcuODFjMC00LjMxLTIuNzMtNi4xMS01LTYuMTFhNS44Miw1LjgyLDAsMCwwLTYsNi4yMVY1MkgyNVYyNWg3LjUzdjMuNzloLjExYy44LTEuNjQsNC40NC00LjM3LDkuMTMtNC4zN1M1MiwyNy41OSw1MiwzNS43NloiLz4KICA8cGF0aCBjbGFzcz0iZmF2aWNvbi10ZXh0IiBkPSJNNTIsMzUuNzZWNTJINDRWMzcuODFjMC00LjMxLTIuNzMtNi4xMS01LTYuMTFhNS44Miw1LjgyLDAsMCwwLTYsNi4yMVY1MkgyNVYyNWg3LjUzdjMuNzloLjExYy44LTEuNjQsNC40NC00LjM3LDkuMTMtNC4zN1M1MiwyNy41OSw1MiwzNS43NlpNMTYsMTEuM0E0LjcsNC43LDAsMSwwLDIwLjcsMTYsNC42OSw0LjY5LDAsMCwwLDE2LDExLjNaTTEyLDUyaDhWMjVIMTJaIiAvPgo8L3N2Zz4=
// @version      1.0.0
// @description  Add hotkey/menu command to copy a LinkedIn job posting to the clipboard as markdown
// @match        https://www.linkedin.com/jobs/view/*
// @require      https://cdn.jsdelivr.net/npm/turndown@7.2.4/dist/turndown.js
// @require      https://cdn.jsdelivr.net/npm/@violentmonkey/shortcut@1
// @grant        GM.registerMenuCommand
// @grant        GM.setClipboard
// ==/UserScript==

/* global TurndownService */

const DEBUG = true; // set false to silence console output
const PREFIX = '[li2md]';

function dlog(...args) {
  if (DEBUG) console.log(PREFIX, ...args);
}

function dwarn(...args) {
  if (DEBUG) console.warn(PREFIX, ...args);
}

function derror(...args) {
  console.error(PREFIX, ...args);
}

// Splits "<job title> | <company> | LinkedIn" into its parts. Used as the
// fallback when the header block can't be located in the DOM.
function parseDocumentTitle(title) {
  const parts = (title || '')
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts[parts.length - 1] === 'LinkedIn') parts.pop();
  if (!parts.length) return { jobTitle: '', company: '' };
  const company = parts.length > 1 ? parts.pop() : '';
  return { jobTitle: parts.join(' | '), company };
}

// LinkedIn's <main> holds several sections; only the primary-content one is the
// posting. The others are premium upsell. aria-label is English-only, hence the
// <main> fallback.
function findRoot(doc) {
  return doc.querySelector('section[aria-label="Primary content"]') || doc.querySelector('main');
}

const ABOUT_THE_JOB_KEY = 'JobDetails_AboutTheJob_';

// The header has no componentkey. It sits as the sibling immediately before the
// wrapper that holds every tagged content slot.
function findHeaderBlock(root) {
  const aboutJob = root.querySelector(`[componentkey^="${ABOUT_THE_JOB_KEY}"]`);
  return aboutJob?.parentElement?.previousElementSibling ?? null;
}

// Allow-list, in the order they should appear in the output. Anything not named
// here is excluded by construction - LinkedIn adds upsell slots more often than
// content slots, so an unknown slot should default to excluded.
const SECTION_KEYS = [
  ABOUT_THE_JOB_KEY,
  'JobDetails_AboutTheCompany_',
  'JobDetailsPeopleWhoCanHelpSlot_',
  'JobDetailsSimilarJobsSlot_',
];

function collectSections(root) {
  return SECTION_KEYS.map((key) => root.querySelector(`[componentkey^="${key}"]`)).filter(
    (el) => el && el.textContent.trim(),
  );
}

// The toggle renders as a bare button with no aria-label and hashed classes, so
// its text is the only stable hook. Anchored to avoid matching "More jobs".
const TRUNCATION_TOGGLE = /^(…\s*more|see more)$/i;

function expandTruncated(root) {
  const toggles = [...root.querySelectorAll('button')].filter((b) => TRUNCATION_TOGGLE.test(b.textContent.trim()));
  toggles.forEach((b) => b.click());
  return toggles.length;
}

function extractJobId(root, url) {
  const slot = root?.querySelector(`[componentkey^="${ABOUT_THE_JOB_KEY}"]`);
  const fromKey = slot?.getAttribute('componentkey').slice(ABOUT_THE_JOB_KEY.length);
  if (fromKey) return fromKey;
  const match = /\/jobs\/view\/(\d+)/.exec(url || '');
  return match ? match[1] : '';
}

// Content slots carry their own <h2>, which Turndown renders as "## ...", so only
// the header - which has no heading element - gets a synthetic one.
function buildMarkdown(doc, root, td, url) {
  const { jobTitle, company } = parseDocumentTitle(doc.title);
  const heading = [jobTitle, company].filter(Boolean).join(' — ');
  const parts = [];

  if (heading) parts.push(`# ${heading}`);

  const header = findHeaderBlock(root);
  if (header) {
    try {
      parts.push(td.turndown(header.innerHTML));
    } catch (e) {
      derror('header block failed to convert', e);
    }
  } else {
    dwarn('No header block found - falling back to the document title alone');
  }

  const sections = collectSections(root);
  if (!sections.length) dwarn('No content sections found - check the componentkey prefixes in SECTION_KEYS');

  // Per-section isolation (header included above): LinkedIn's markup drifts, and
  // one block that breaks Turndown should cost that block, not the whole copy.
  // The failure is reported, never swallowed.
  sections.forEach((el) => {
    try {
      parts.push(td.turndown(el.innerHTML));
    } catch (e) {
      derror(`section ${el.getAttribute('componentkey')} failed to convert`, e);
    }
  });

  const jobId = extractJobId(root, url);
  parts.push(jobId ? `_Source: ${url} — job ID ${jobId}_` : `_Source: ${url}_`);

  return parts.filter(Boolean).join('\n\n').trim();
}

function buildTurndownService() {
  if (typeof TurndownService === 'undefined') {
    derror('TurndownService is undefined - the @require from jsdelivr did not load (check the network tab)');
    return null;
  }

  const td = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
  });

  // Apply, Save, Follow and the truncation toggles are interactive chrome, not
  // content. They are clicked before this runs, so removing them is safe.
  td.remove(['script', 'style', 'svg', 'button', 'iframe', 'noscript', 'input', 'label']);

  return td;
}

function showToast(msg) {
  let toast = document.getElementById('li2md-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'li2md-toast';
    toast.style.cssText = [
      'position:fixed',
      'top:16px',
      'right:16px',
      'z-index:999999',
      'background:#222',
      'color:#fff',
      'padding:8px 14px',
      'border-radius:6px',
      'font:14px sans-serif',
      'opacity:0',
      'transition:opacity .2s',
    ].join(';');
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  clearTimeout(toast.hideTimer);
  toast.hideTimer = setTimeout(() => {
    toast.style.opacity = '0';
  }, 1800);
}

async function copyMarkdownToClipboard() {
  try {
    const root = findRoot(document);
    if (!root) {
      derror('No extraction root - neither section[aria-label="Primary content"] nor <main> matched');
      showToast('No job content found (see console)');
      return;
    }

    const expanded = expandTruncated(root);
    dlog('expanded truncation toggles:', expanded);
    // Let the click-driven re-render land before reading the DOM.
    if (expanded) await new Promise((resolve) => requestAnimationFrame(resolve));

    const td = buildTurndownService();
    if (!td) {
      showToast('Turndown failed to load (see console)');
      return;
    }

    const md = buildMarkdown(document, root, td, window.location.href);
    // GM.setClipboard is extension-privileged and needs no page-level user
    // activation, unlike navigator.clipboard - required for the menu command path,
    // which Firefox does not treat as a user gesture on the page.
    GM.setClipboard(md);
    dlog('copied markdown length:', md.length);
    showToast(`Copied (${md.length} chars)`);
  } catch (e) {
    // Last-resort net: every known failure mode above already has its own toast,
    // so reaching here means something unexpected broke. Surface it instead of
    // letting it become a silent unhandled rejection.
    derror('copy failed unexpectedly', e);
    showToast('Copy failed (see console)');
  }
}

VM.shortcut.register('alt-shift-c', copyMarkdownToClipboard);

// Menu command as a discoverable fallback when the hotkey isn't bound or known.
GM.registerMenuCommand('Copy to Markdown', copyMarkdownToClipboard);
