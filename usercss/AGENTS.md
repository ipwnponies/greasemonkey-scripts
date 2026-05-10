# UserCSS Agent Guide

UserCSS files are custom stylesheets installed into a browser via a style manager extension (e.g. Stylus). Each file targets one or more specific sites and overrides their default presentation.

## File Structure

Every file starts with a metadata block, then one or more `@-moz-document` rules that scope the CSS to specific URLs.

```css
/* ==UserStyle==
@name           example.com
@namespace      ipwnponies
@version        1.0.0
@license        MIT
@description    What this does

@var range font-size "Font size" [1.2, 0.6, 2.0, 0.2, "em"]
==/UserStyle== */

@-moz-document domain("example.com") {
    /* rules here */
}
```

## Metadata

| Key | Purpose |
|-----|---------|
| `@name` | Display name in the extension UI |
| `@namespace` | Author identifier, prevents name collisions |
| `@version` | Semver string |
| `@license` | SPDX license identifier |
| `@description` | Short summary |
| `@var` | Declares a user-configurable variable (see below) |

### `@var` Declarations

Variables let users tune values through the extension UI without editing raw CSS. The extension injects them as CSS custom properties (e.g. `--font-size`) that you reference with `var()`.

**Range slider** — numeric value with min/max/step, optional unit suffix:
```
@var range font-size "Font size" [default, min, max, step, "unit"]
@var range font-size "Font size" [1.2, 0.6, 2.0, 0.2, "em"]
@var range line-height "Line spacing" [1.5, 1.0, 2.0, 0.1]
```

**Select dropdown** — named options, mark default with `*`:
```
@var select font-weight "Font weight" {
  "Light*": "lighter",
  "Normal": "normal",
  "Bold": "bold",
}
```

Using the variable in CSS:
```css
p {
    font-size: var(--font-size);
    line-height: var(--line-height);
}
```

## URL Scoping with `@-moz-document`

Despite the `-moz-` prefix, this is the standard way to scope userstyles. Three forms are used:

```css
/* All pages on a domain */
@-moz-document domain("example.com") { }

/* Pages under a path prefix */
@-moz-document url-prefix("https://example.com/app/") { }

/* Regular expression match */
@-moz-document regexp("https://gamefaqs.gamespot.com(/[a-z0-9-/]+){2}/faqs/\\d+") { }
```

Use the narrowest scope possible. `url-prefix` is preferred over `domain` when the styles only apply to a subsection of a site.

## Common Patterns

### `!important` Is the Primary Tool

Site CSS ships with high-specificity selectors. Userstyles almost always lose specificity battles, so `!important` is the normal override mechanism — not an antipattern here.

```css
/* Override inline styles or high-specificity site rules */
textarea {
    min-height: var(--textbox-height) !important;
}

pre {
    font: lighter var(--font-size)/var(--line-height) monospace !important;
}
```

Use `!important` freely when fighting site styles. Leave it off only when your selector already wins naturally (e.g. when overriding a low-specificity reset).

### Hiding Unwanted Elements

```css
/* Hide by ID or class */
#WikiaRailWrapper,
#WikiaFooter {
    display: none;
}

/* Hide by attribute value — useful for inline event handlers */
div[oncontextmenu="return false;"] {
    display: none;
}

/* Hide ads and autoplay widgets */
.product-widget,
.fexy-modal__outer-wrap {
    display: none;
}
```

Hiding by `display: none` is the blunt but reliable approach. Attribute selectors let you target elements that have no stable class or ID.

### Layout Overrides

Overriding grid and flex layouts to remove sidebars or reorder content:

```css
/* Remove right rail from a two-column grid */
.article-two-column-right-rail {
    grid-template-areas:
        "header"
        "content"
        ;
    grid-template-columns: minmax(var(--max-width), 100vw);
}

/* Constrain and centre main content */
#main-content {
    width: 100%;
    max-width: var(--max-width);
    margin: auto;
}

/* Reorder flex children without touching HTML */
body {
    display: flex;
    flex-direction: column;
}
#sidebar { order: 1; }
#content  { order: 2; }
```

Pair `max-width: var(--max-width)` with a `@var range` so the user can tune it to their viewport and font preferences.

### Z-index and Sticky Positioning

Layering elements above site UI:

```css
:root {
    /* Anchor relative to a known site variable */
    --z-index: calc(var(--ytd-z-index-channel-name) + 1);
}

#player {
    position: sticky !important;
    top: 0;
    z-index: calc(var(--z-index) + 1);
}
```

When a site defines its own z-index custom properties, build on top of them with `calc()` rather than hardcoding large numbers.

### Resetting Problematic Site Styles

Sites sometimes use `overflow: hidden` or `position: fixed` in ways that break scrolling or clip content:

```css
/* Remove overflow restriction that causes layout issues */
.claims-table-wrapper {
    overflow-x: unset;
}

/* Reset absolute-positioned elements to normal flow */
#sidebarleft {
    position: initial;
    left: auto;
    top: auto;
    width: auto;
    overflow: visible;
}
```

`initial` and `unset` are useful when you want to undo a property entirely rather than override it with a specific value.

### Hover-Based Reveal

Override styles conditionally on hover to reveal hidden content:

```css
/* Reveal spoiler text by matching surrounding text color on hover */
.spoiler font[color="000000"]:hover {
    color: inherit !important;
}
```

### Typography Overrides

Replace a site's default font stack:

```css
body {
    font-family: sans-serif;
}

/* Monospace for code, sans-serif for UI */
.code-area {
    font-family: monospace !important;
}
.ui-label {
    font-family: sans-serif !important;
}
```

### Responsive / Media Query Scoping

Apply rules only at certain viewport sizes:

```css
@media (orientation: portrait), (min-height: 50em) {
    #player {
        position: sticky !important;
        top: 0;
    }
}
```

## Naming Convention

Files are named `<domain>.user.css`. The `@name` in metadata should match or closely reflect the domain.
