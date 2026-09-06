# Repo Agent Guide

Two independent collections, each with its own guide:

- `greasemonkey/` — Violentmonkey userscripts (see `greasemonkey/AGENTS.md`)
- `usercss/` — Stylus userstyles (see `usercss/AGENTS.md`)

## Commands

```bash
npm install             # install dev dependencies
npm test                # run tests/*.test.js (Node's built-in test runner)
npm run test:coverage   # same, with Node's built-in coverage report
npm run lint            # eslint greasemonkey/ — usercss/ is not linted
```

CI (`.github/workflows/ci.yml`) runs `npm run lint` then `npm test` on every push and PR.

## Pre-commit

husky + lint-staged runs `eslint --fix` on staged `greasemonkey/*.user.js` files.

## Gotchas

- Husky hooks only activate after `npm install` has run once (the `prepare` script registers them).
- `usercss/` has no automated lint or test coverage — review CSS changes manually.
- Both `greasemonkey/` and `usercss/` are flat directories: every file is self-contained, no shared modules or build step between scripts.
- Most `greasemonkey/` scripts have no test yet — see `greasemonkey/AGENTS.md` for the testing approach.
