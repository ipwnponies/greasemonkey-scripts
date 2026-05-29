# greasemonkey-scripts

My collection of [Violentmonkey](https://violentmonkey.github.io/) userscripts and [Stylus](https://github.com/openstyles/stylus) userstyles.

## Installation

1. Install [Violentmonkey](https://violentmonkey.github.io/) (recommended) or Tampermonkey in your browser.
2. Click any `.user.js` file on GitHub and Violentmonkey will prompt you to install it.
3. For userstyles, install [Stylus](https://github.com/openstyles/stylus) and click any `.user.css` file.

## Userscripts

### Auto-submit 2FA / Login

Scripts that automatically click the submit button when a 2FA code is pasted or filled by a password manager.

| Script | Site |
|--------|------|
| `carta.autosubmit-2fa.user.js` | login.app.carta.com |
| `fidelity.autosubmit-2fa.user.js` | digital.fidelity.com |
| `firsttech.autosubmit-2fa.user.js` | firsttech.com |
| `freetaxusa.autosubmit-2fa.user.js` | auth.freetaxusa.com |
| `guardian.autosubmit-2fa.user.js` | guardiananytime.com |
| `navia.autosubmit-2fa.user.js` | naviabenefits.com |
| `paypal.autosubmit-2fa.user.js` | paypal.com |
| `scholarshare529.autosubmit-paste.user.js` | scholarshare529.com |
| `usbank.autosubmit-2fa.user.js` | onlinebanking.usbank.com |

### Allow Copy/Paste

Scripts that remove paste/copy restrictions on sites that block them for no good reason.

| Script | Site |
|--------|------|
| `dmv.allow-paste.user.js` | dmv.ca.gov |
| `rubios.let-me-copy-paste.user.js` | tellrubios.com |
| `sdge.let-me-copy-paste.user.js` | myaccount.sdge.com |
| `sdttc.let-me-paste.user.js` | wps.sdttc.com |

### Keyboard Shortcuts

| Script | Site | Shortcut |
|--------|------|----------|
| `amazon.camel-shortcut.user.js` | amazon.com | Open current product on CamelCamelCamel |
| `arstechnica.comment-shortcut.user.js` | arstechnica.com | Jump to comments |
| `github.approve-shortcut.user.js` | github.com | Approve PR with keyboard |
| `github.edit-shortcut.user.js` | github.com | Edit issue/comment with keyboard |
| `google-photos.keybinding-options.user.js` | photos.google.com | Keyboard navigation for photo options |
| `trakt.search-rotten-tomatoes.user.js` | trakt.tv | Search current title on Rotten Tomatoes |
| `youtube.show-transcript-hotkey.user.js` | youtube.com | Open transcript panel |

### YouTube

| Script | Description |
|--------|-------------|
| `youtube.clear-playlist.user.js` | Bulk-remove videos from a playlist |
| `youtube.redirect-embed.user.js` | Redirect youtube-nocookie.com embeds to youtube.com |
| `youtube.add-referrer-embed.user.js` | Add referrer header when navigating from embeds |

### GitHub

| Script | Description |
|--------|-------------|
| `github.open-links-new-tab.user.js` | Open PR comment links in a new tab |

### Other

| Script | Site | Description |
|--------|------|-------------|
| `cenlar.always-agree-checkbox.user.js` | cenlar.com | Auto-check agreement checkboxes |
| `duckduckgo.just-get-to-the-page-already.user.js` | duckduckgo.com | Skip interstitial redirects |
| `fatsecret.redirect-absolute-url.user.js` | fatsecret.com | Redirect diary to absolute date URL |
| `fatsecret.searchbar-fixer.user.js` | fatsecret.com | Fix add-item search bar focus behaviour |
| `fidelity.autocomplete-off.user.js` | digital.fidelity.com | Disable autocomplete on login fields |
| `gmail.open-tadpole-images.user.js` | mail.google.com | Open all Tadpoles images in new tabs (Ctrl+K) |
| `leetcode-filtering.user.js` | leetcode.com | Add difficulty/status filters to tag pages |
| `mealpal.user.js` | secure.mealpal.com | Add Yelp review links to meal listings |
| `tadpoles.redirect-to-image-src.user.js` | tadpoles.com | Redirect to direct image URL |

## UserCSS Stylesheets

Custom styles applied via Stylus.

| File | Site |
|------|------|
| `budgetbytes.com.user.css` | budgetbytes.com |
| `buildkite.com.user.css` | buildkite.com |
| `chatgpt.com.user.css` | chatgpt.com |
| `disneyplus.com.user.css` | disneyplus.com |
| `fandom.com.user.css` | fandom.com |
| `gamefaqs.gamespot.com.user.css` | gamefaqs.gamespot.com |
| `gmail.com.user.css` | mail.google.com |
| `guardiananytime.com.user.css` | guardiananytime.com |
| `healthychildren.org.user.css` | healthychildren.org |
| `howlongtobeat.com.user.css` | howlongtobeat.com |
| `joyofbaking.com.user.css` | joyofbaking.com |
| `keyofw.com.user.css` | keyofw.com |
| `notebooklm.google.com.user.css` | notebooklm.google.com |
| `reddit.com.user.css` | reddit.com |
| `seriouseats.com.user.css` | seriouseats.com |
| `strongerbyscience.com.user.css` | strongerbyscience.com |
| `sumologic.com.user.css` | sumologic.com |
| `tadpoles.com.user.css` | tadpoles.com |
| `thepancakeprincess.com.user.css` | thepancakeprincess.com |
| `thespruceeats.com.user.css` | thespruceeats.com |
| `whattoexpect.com.user.css` | whattoexpect.com |
| `xunitpatterns.com.user.css` | xunitpatterns.com |
| `youtube-ask.com.user.css` | youtube-ask.com |
| `youtube.com.user.css` | youtube.com |

## Development

```bash
npm install        # install dev dependencies
npm test           # run tests (Node.js native test runner)
npm run lint       # run ESLint on all scripts
```

Tests use the Node.js built-in `node:test` module (Node 20+). ESLint is configured with the Airbnb base style guide.
