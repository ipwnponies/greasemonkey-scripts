---
name: create-userscript
description: Use when creating a new Greasemonkey/Violentmonkey userscript file in this repository. Guides through URL targeting, DOM strategy, trigger mechanism, and generates scaffolded .user.js file with composable pattern components.
---

# Create Userscript

Interactive wizard to scaffold a new Violentmonkey userscript. Asks structured questions, assembles composable pattern components, generates the `.user.js` file, then implements the actual logic.

## Workflow

1. **Round 1** — Ask target/environment questions via AskUserQuestion
2. **Scaffold** — Create file with metadata + selected component boilerplate
3. **Round 2** — Ask what the script should do + additional capabilities
4. **Implement** — Fill in the actual logic
5. **Lint** — Run `npx eslint --fix` on the generated file

## Round 1: Target & Environment

Ask these via AskUserQuestion (all in one call):

**Q1: Target URL** — "Paste an example URL this script targets"
- Options: just provide examples as guidance, user types actual URL in Other
- `https://www.example.com/path/page`
- `https://app.example.com/dashboard`

**Q2: Is the site an SPA?** — "Is this a single-page app (React, Angular, Vue)?"
- Yes (client-side routing, page doesn't reload on navigation)
- No (traditional page loads)

**Q3: Which patterns apply?** — multiSelect: true — "Which patterns does this script need?"
- VM.observe (wait for dynamically-added elements, React hydration)
- Sleep/polling (wait fixed duration before acting)
- Auto-submit on paste/change (2FA forms)
- Event interception (bypass paste/copy/select blockers)

**Q4: How is it triggered?** — "How should the script activate?"
- Automatic on page/element load
- Keyboard shortcut
- User event (paste, click, change)
- Menu command (GM.registerMenuCommand)

## Scaffold: Create the File

### Derive filename and metadata

```
URL: https://www.example.com/app/settings → domain = "example"
  Strip "www." prefix
  Use shortest recognizable brand name
  Subdomains: use parent domain unless subdomain IS the brand

Filename: greasemonkey/<domain>.<purpose>.user.js
@name:    <Short purpose> - <domain>.com
@namespace: ipwnponies
@version: 1.0.0
```

### Derive @match pattern

- **Non-SPA:** use most specific path covering target pages, wildcard at end
  - Single page: `https://www.example.com/app/settings/*`
  - Section: `https://www.example.com/app/*`
- **SPA:** broad match on app root: `https://www.example.com/*`
  - Script gates on pathname internally
- Strip query parameters (matched automatically)
- Multiple `@match` lines for multiple URL patterns

### Assemble @require and @grant

| Component selected | @require | @grant |
|--------------------|----------|--------|
| VM.observe | `https://cdn.jsdelivr.net/npm/@violentmonkey/dom@2` | `none` |
| Keyboard shortcut | `https://cdn.jsdelivr.net/npm/@violentmonkey/shortcut@1` | `none` |
| Cross-origin XHR | — | `GM_xmlhttpRequest` |
| Persistent storage (read) | — | `GM_getValue` |
| Persistent storage (write) | — | `GM.setValue` |
| Menu command | — | `GM.registerMenuCommand` |
| None of the above | — | `none` |

Multiple @grant lines allowed. If any GM API used, list each one. If none, use `@grant none`.

### Write the file with component boilerplate

Assemble the metadata header, then compose selected components below it. See Component Templates section.

## Round 2: Behavior & Capabilities

Ask via AskUserQuestion after creating the scaffold:

**Q1: What should this script do?** — "Describe what the script should accomplish"
- Auto-click/submit an element
- Modify or inject DOM elements
- Redirect or rewrite URLs
- (User types actual description in Other)

**Q2: Additional capabilities needed?** — multiSelect: true
- Cross-origin requests (GM_xmlhttpRequest)
- Persistent storage (GM.getValue/setValue)
- Clipboard access
- External CSS injection

**Q3: (Only if shortcut selected in Round 1)** — "What key combo? (e.g. ctrl-k, alt-shift-c)"
- User types in Other

After Round 2, implement the actual logic inside the scaffold. Update @grant lines if Round 2 added new capabilities.

## Component Templates

Each component is independent and composable. Assemble selected ones into the script body.

### Metadata Header (always)

```js
// ==UserScript==
// @name        {{PURPOSE}} - {{DOMAIN}}
// @namespace   ipwnponies
// @match       {{MATCH_PATTERN}}
// @grant       {{GRANT}}
// @version     1.0.0
{{REQUIRE_LINES}}
// @description {{DESCRIPTION}}
// ==/UserScript==
```

### VM.observe

```js
VM.observe(document.body, () => {
  const el = document.querySelector('{{SELECTOR}}');
  if (el) {
    // TODO: implement action on el
    return true;
  }
});
```

### SPA Path Guard

Wrap around VM.observe or main logic when SPA = Yes:

```js
const isTargetPage = () => location.pathname.startsWith('{{PATH}}');

VM.observe(document.body, () => {
  if (!isTargetPage()) return;

  const el = document.querySelector('{{SELECTOR}}');
  if (el) {
    // TODO: implement
    return true; // Remove if script must re-run on each SPA navigation
  }
});
```

**SPA caveat:** `return true` stops the observer permanently. If the script must act on every navigation to the target page (not just once), omit `return true` and add an idempotency guard instead.

### Sleep/Polling

```js
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  while (!document.querySelector('{{SELECTOR}}')) {
    await sleep(200);
  }
  // TODO: implement
}

main();
```

### Auto-Submit on Paste/Change

```js
VM.observe(document.body, () => {
  const input = document.querySelector('{{INPUT_SELECTOR}}');
  if (input) {
    for (const event of ['paste', 'change']) {
      input.addEventListener(event, () => {
        requestAnimationFrame(() => {
          document.querySelector('{{BUTTON_SELECTOR}}')?.click();
        });
      });
    }
    return true;
  }
});
```

Listen to both `paste` (manual) and `change` (password manager autofill).

### Event Interception (Bypass Blockers)

```js
const field = document.querySelector('{{FIELD_SELECTOR}}');
field.addEventListener(
  'keydown',
  (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      e.stopImmediatePropagation();
    }
  },
  { capture: true },
);
```

For selectstart blockers: `document.body.addEventListener('selectstart', (e) => e.stopPropagation(), { capture: true });`

### Keyboard Shortcut

```js
const { register } = VM.shortcut;

register('{{KEYS}}', () => {
  // TODO: implement
});
```

Modifier names: `ctrl`, `alt`, `shift`, `meta`. Key names lowercase.

### Cross-Origin Request

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

### Persistent Storage Read

```js
// Prefer legacy sync form at startup (Violentmonkey pre-loads values)
const value = GM_getValue('key');
```

## Composition Examples

**SPA + VM.observe + Shortcut:**
```js
const isTargetPage = () => location.pathname.startsWith('/app/');

VM.observe(document.body, () => {
  if (!isTargetPage()) return;

  const target = document.querySelector('.editor');
  if (target) {
    const { register } = VM.shortcut;
    register('ctrl-k', () => {
      // action using target
    });
    return true;
  }
});
```

**VM.observe + Auto-submit (2FA pattern):**
```js
VM.observe(document.body, () => {
  const input = document.querySelector('#otp-input');
  if (input) {
    for (const event of ['paste', 'change']) {
      input.addEventListener(event, () => {
        requestAnimationFrame(() => {
          document.querySelector('#submit-btn')?.click();
        });
      });
    }
    return true;
  }
});
```

## Post-Scaffold

After implementing, run:
```bash
npx eslint --fix greasemonkey/{{FILENAME}}
```

Code style: 2-space indent, single quotes, trailing commas, 120 char max line width, `const` preferred, arrow functions, optional chaining (`?.`).

## Edge Cases

For patterns not covered above (XPath queries, zone.js workaround, eager promises, raw MutationObserver, idempotency guards, external CSS injection), read `greasemonkey/AGENTS.md`.
