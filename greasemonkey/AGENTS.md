# Userscript Agent Guide

Userscripts are JavaScript files installed into a browser via Violentmonkey (or similar). They run on page load and can manipulate the DOM, intercept events, and make cross-origin network requests.

**To create a new script, use the `create-userscript` skill.** This guide covers working with existing scripts.

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
```

## Metadata

| Key | Purpose |
|-----|---------|
| `@name` | Display name in extension UI |
| `@namespace` | Author identifier — forms unique script identity with `@name` |
| `@match` | URL pattern(s) that activate this script |
| `@grant` | Permissions for GM APIs (`none` if not needed) |
| `@version` | Semver string |
| `@require` | External library loaded before the script runs |
| `@description` | Human-readable summary |

`@namespace` + `@name` = unique identity. Do not use `@author`. Multiple `@match` lines allowed — use the narrowest pattern that covers target pages.

Pin `@require` to a major version (`@2`, `@1`) rather than `latest`.

## GM APIs

Two API styles — the grant string must match the style used:

- **`GM.`** (modern) — Promise-based. `@grant GM.methodName`.
- **`GM_`** (legacy) — Synchronous or callback-based. `@grant GM_methodName`.

Use `@grant none` when only touching the page DOM.

### Fire-and-forget (no await needed)

`GM.setValue`, `GM.deleteValue`, `GM.openInTab`, `GM.notification`, `GM.setClipboard`, `GM.addStyle`

### Synchronous in practice

Violentmonkey pre-loads stored values, so legacy read APIs are in-memory reads:

```js
const apiKey = GM_getValue('apiKey'); // synchronous, no await
const keys = GM_listValues();         // synchronous
```

Prefer legacy synchronous forms at script startup. `GM.info` is a property, not a function.

### Await when needed

`GM.getValue`, `GM.listValues`, `GM.getResourceURL` — use `await` when you need the result.

`GM.registerMenuCommand` returns a command ID for later `GM.unregisterMenuCommand`.

### Cross-origin requests

Use `GM_xmlhttpRequest` (not `fetch`) to bypass CORS. Wrap in a Promise for `await`:

```js
const fetchData = (url) => new Promise((resolve, reject) => {
  GM_xmlhttpRequest({
    method: 'GET',
    url,
    onload: (r) => resolve(JSON.parse(r.response)),
    onerror: reject,
  });
});
```

## Key Behavioral Notes

### VM.observe

`VM.observe` wraps `MutationObserver` with auto-cleanup. Returning `true` from the callback **stops the observer permanently**. Return `undefined` to keep watching.

### SPA scripts

In SPAs, the script loads once for the entire session. After `return true` stops an observer, subsequent route changes won't re-trigger it. If re-runs are needed per navigation, omit `return true` and use an idempotency guard.

### Event capture phase

`{ capture: true }` runs a listener before bubble-phase listeners. `stopImmediatePropagation` blocks all subsequent handlers on the same element. `stopPropagation` only blocks bubbling to parents.

### Timing

| Technique | When to use |
|-----------|-------------|
| `requestAnimationFrame` | Wait for next render (button becomes enabled after input event) |
| `setTimeout(() => ..., ms)` | Fixed delay before action |
| `setTimeout(() => ...)` (no ms) | Defer to after current call stack clears |

Prefer `requestAnimationFrame` over `setTimeout(fn, 0)` when waiting for a render cycle.

### Eager promises

Start async operations at script load, `await` only when the result is needed. Awaiting an already-resolved Promise returns immediately.

## DOM Utilities

### XPath

When CSS selectors can't target by text content:

```js
const findByText = (text) => document.evaluate(
  `//span[contains(text(),"${text}")]`,
  document,
  null,
  XPathResult.FIRST_ORDERED_NODE_TYPE,
  null,
).singleNodeValue;
```

### Idempotency guard

Prevent duplicate UI elements on re-runs (SPA navigations):

```js
if (node.nextElementSibling?.classList.contains('my-script-marker')) return;
const btn = document.createElement('button');
btn.classList.add('my-script-marker');
node.after(btn);
```

### zone.js workaround

Angular apps wrap `addEventListener` via zone.js. Bypass when it breaks event handling:

```js
input.addEventListener.__zone_symbol__OriginalDelegate.call(input, 'paste', handler, false);
```

## Naming Convention

Files: `<domain>.<purpose>.user.js`. The `@name`: `<Short purpose> - <domain>`.
