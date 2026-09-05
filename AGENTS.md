# Repo Agent Guide

Two independent collections, each with its own guide:

- `greasemonkey/` — Violentmonkey userscripts (see `greasemonkey/AGENTS.md`)
- `usercss/` — Stylus userstyles (see `usercss/AGENTS.md`)

## Commands

```bash
npm install        # install dev dependencies
npm test            # run tests/*.test.js (Node's built-in test runner)
npm run lint         # eslint on greasemonkey/*.user.js only — usercss/ is not linted
```

## Testing

Tests live in `tests/<script-name>.test.js`, using jsdom + fixtures in `tests/fixtures/`.
Most scripts have no test yet — add one when changing non-trivial DOM logic.

## Pre-commit

husky + lint-staged runs `eslint --fix` on staged `greasemonkey/*.user.js` files.

## Gotchas

- Husky hooks only activate after `npm install` has run once (the `prepare` script registers them).
- `usercss/` has no automated lint or test coverage — review CSS changes manually.
- Both `greasemonkey/` and `usercss/` are flat directories: every file is self-contained, no shared modules or build step between scripts.
