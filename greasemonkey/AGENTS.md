# Userscript Agent Guide

Userscripts are JavaScript files installed into a browser via Violentmonkey (or similar). They run on page load and can manipulate the DOM, intercept events, and make cross-origin network requests.

## File Structure

Every script opens with a metadata block inside a `// ==UserScript== ... // ==/UserScript==` comment, followed by plain JavaScript.

```js
// ==UserScript==
// @name        Short description - site.com
// @namespace   ipwnponies
// @match       https://www.example.com/path/*
// @grant       none
// @version     1.0.0
// @description Longer explanation
// ==/UserScript==

// script body
```

## Metadata

| Key | Purpose |
|-----|---------|
| `@name` | Display name in extension UI |
| `@namespace` | Author identifier — forms the unique script identity together with `@name` |
| `@match` | URL pattern(s) that activate this script |
| `@grant` | Permissions for GM APIs (`none` if not needed) |
| `@version` | Semver string |
| `@require` | External library loaded before the script runs |
| `@description` | Human-readable summary |

The extension uses `@namespace` + `@name` as the unique script identity. When installing an update, it matches on this pair to replace the existing script rather than install a duplicate. Do not use `@author` — it is purely informational with no technical role, and `@namespace` already encodes authorship.

Multiple `@match` lines are allowed. Use the narrowest pattern that covers the target pages.

### `@grant` and GM APIs

Scripts that need cross-origin requests or persistent storage must declare the specific grant:

```js
// @grant       GM_xmlhttpRequest
// @grant       GM.getValue
// @grant       GM.registerMenuCommand
// @grant       GM_openInTab
```

Use `@grant none` when you only need to touch the page DOM.

### `@require` for Libraries

External libraries are fetched once at install time and bundled locally:

```js
// @require     https://cdn.jsdelivr.net/npm/@violentmonkey/dom@2
// @require     https://cdn.jsdelivr.net/npm/@violentmonkey/shortcut@1
```

Pin to a major version (`@2`, `@1`) rather than `latest` to avoid surprise breakage.

## Core Patterns

### sleep Helper

Almost every async script defines this one-liner:

```js
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
```

Use it to wait for a fixed duration before querying the DOM after page load, or between retry iterations.

### Polling Loop — Wait for an Element

For pages that load content asynchronously, poll until the target element appears:

```js
async function main() {
    while (!document.querySelector('.target-element')) {
        await sleep(200);
    }
    // element is now present
    doWork();
}

main();
```

This is the simplest approach when `VM.observe` is not available or the trigger is a one-time load.

### `waitFor` — Polling with Timeout

For time-bounded waiting with a clear error on timeout:

```js
const waitFor = async (callback, timeout = 5000, interval = 50) => {
    const deadline = Date.now() + timeout;

    while (Date.now() < deadline) {
        const result = callback();
        if (result) return result;
        await sleep(interval);
    }

    throw new Error('Timed out');
};

// Usage
const button = await waitFor(() => document.querySelector('#submit-button'));
button.click();
```

Use `waitFor` when you need to act as soon as the element appears rather than running at a fixed delay, and when you want explicit failure instead of a silent hang.

### `VM.observe` — Mutation-Based Element Waiting

The `@violentmonkey/dom` library provides `VM.observe`, which is more efficient than polling when you need to react to dynamic DOM changes:

```js
// @require https://cdn.jsdelivr.net/npm/@violentmonkey/dom@2

VM.observe(document.querySelector('body'), () => {
    const input = document.querySelector('#target-input');
    if (input) {
        input.addEventListener('paste', handlePaste);
        return true; // returning true stops the observer
    }
    // return undefined (or nothing) to keep watching
});
```

`VM.observe` wraps `MutationObserver` with automatic cleanup when the callback returns `true`. Use it to attach event listeners to elements that don't exist at script start time (e.g. dynamically rendered modals, SPA route changes).

### `MutationObserver` — Watching for DOM Changes

For more control, use a raw `MutationObserver`:

```js
const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
            if (node instanceof Element) {
                processNode(node);
            }
        }
    }
});

observer.observe(document.querySelector('body'), { subtree: true, childList: true });
```

Use `{ subtree: true, childList: true }` to catch any descendant changes. Check `node instanceof Element` to skip text nodes and comments.

### Handling SPAs — Path-Based Routing

In single-page applications, the page doesn't reload on navigation. Use `@match` broadly and then gate logic on the current path:

```js
// @match https://www.example.com/*

const isTargetPage = () => location.pathname.startsWith('/target/');

VM.observe(document.body, () => {
    if (!isTargetPage()) return;

    const el = document.querySelector('.target');
    if (el) {
        doWork(el);
        return true;
    }
});
```

For redirects and URL manipulation, use `location.assign()` (adds history entry) or `location.replace()` (no history entry):

```js
// Redirect without adding to browser history
document.location.replace(newUrl);

// Build URLs safely with the URL API
const redirectUrl = new URL(document.location);
redirectUrl.searchParams.set('dt', daysEpoch);
document.location.replace(redirectUrl);
```

## Timing Patterns

### `setTimeout` Wrapper (one-shot delay)

When you need to click a button after a paste event but the button state hasn't updated yet:

```js
const action = async () => {
    await new Promise((r) => setTimeout(r, 100));
    document.querySelector('button[type=submit]').click();
};

input.addEventListener('paste', action);
```

### `requestAnimationFrame` (wait one render cycle)

When a button becomes enabled in response to an input event, `requestAnimationFrame` defers the click until after the browser has processed the event and re-rendered:

```js
input.addEventListener('paste', () => {
    requestAnimationFrame(() => {
        form.querySelector('button.btn-primary').click();
    });
});
```

Prefer `requestAnimationFrame` over `setTimeout(fn, 0)` when the goal is to wait for the next render rather than a time duration.

### `setTimeout` with No Delay

A bare `setTimeout(() => ...) ` (no ms argument) defers execution to after the current call stack clears, which is sometimes enough for event-driven UI updates:

```js
const clickButton = (selector) => () => {
    setTimeout(() => {
        document.querySelector(selector)?.click();
    });
};
```

## Event Interception Patterns

### Bypassing Paste Blockers

Sites that call `e.preventDefault()` on paste events can be bypassed by registering a listener in the **capture phase** before their listener runs:

```js
field.addEventListener(
    'keydown',
    (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
            e.stopImmediatePropagation(); // prevents all other keydown handlers
        }
    },
    { capture: true }, // runs before bubble-phase listeners
);
```

`stopImmediatePropagation` blocks all subsequent handlers for the same event on the same element. `stopPropagation` only blocks bubbling to parent elements.

### Bypassing `selectstart` Blockers

Sites that block text selection via `selectstart`:

```js
document.body.addEventListener('selectstart', (e) => e.stopPropagation(), { capture: true });
```

### Auto-Submit on Paste

Common pattern for 2FA and login forms — click the submit button automatically when a code is pasted:

```js
VM.observe(document.body, () => {
    const input = document.querySelector('#otp-input');
    if (input) {
        for (const event of ['paste', 'change']) {
            input.addEventListener(event, () => {
                requestAnimationFrame(() => {
                    document.querySelector('#submit-button').click();
                });
            });
        }
        return true;
    }
});
```

Listen to both `paste` (manual paste) and `change` (password manager fill) to cover both entry methods.

## Keyboard Shortcuts

Use `@violentmonkey/shortcut` for keyboard shortcut registration:

```js
// @require https://cdn.jsdelivr.net/npm/@violentmonkey/shortcut@1

const { register } = VM.shortcut;

register('ctrl-k', () => {
    // action
});
```

Standard modifier names: `ctrl`, `alt`, `shift`, `meta`. Key names are lowercase (`k`, `enter`, `escape`).

## Cross-Origin Requests

Scripts needing requests to external domains must use `GM_xmlhttpRequest` (not `fetch`), which bypasses CORS:

```js
// @grant GM_xmlhttpRequest

GM_xmlhttpRequest({
    method: 'POST',
    url: 'https://api.example.com/graphql',
    data: queryString,
    headers: { 'Content-Type': 'application/graphql', Authorization: `Bearer ${apiKey}` },
    onload: (response) => {
        const data = JSON.parse(response.response);
        // use data
    },
});
```

## Persistent Storage

Use `GM.getValue` / `GM.setValue` for user configuration that survives page reloads:

```js
// @grant GM.getValue

const apiKey = GM_getValue('apiKey');
if (!apiKey) {
    alert('Set "apiKey" in script storage before using this script.');
    throw new Error('apiKey not set');
}
```

Users set values through the extension's storage editor.

## DOM Manipulation Utilities

### XPath for Complex Queries

When CSS selectors can't target an element by text content, use XPath:

```js
const findByText = (text) => document.evaluate(
    `//span[contains(text(),"${text}")]`,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null,
).singleNodeValue;

const removeOption = findByText('Remove from');
removeOption?.click();
```

### Idempotency Guard

Prevent a script from adding duplicate UI elements when it re-runs (e.g. after a SPA navigation):

```js
const addButton = (node) => {
    if (node.nextElementSibling?.classList.contains('my-script-marker')) return;

    const btn = document.createElement('button');
    btn.classList.add('my-script-marker');
    node.after(btn);
};
```

Add a marker class to injected elements and check for it before inserting again.

### Injecting External CSS

When the script needs to bring its own styles:

```js
const link = document.createElement('link');
link.href = 'https://cdn.example.com/styles.css';
link.rel = 'stylesheet';
link.type = 'text/css';
document.head.appendChild(link);
```

## Naming Convention

Files are named `<domain>.<purpose>.user.js`. The `@name` should follow the pattern `<Short purpose> - <domain>`.

## zone.js Workaround

Angular apps (and some others) wrap `addEventListener` using zone.js. To bypass the wrapper and register a native listener:

```js
input.addEventListener.__zone_symbol__OriginalDelegate.call(
    input,
    'paste',
    handler,
    false,
);
```

Only use this when the zone.js wrapper is actively breaking event handling (e.g. preventing auto-submit from working).
