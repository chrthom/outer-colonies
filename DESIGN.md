---
name: Outer Colonies Website
description: A dark flight-console interface for the Outer Colonies card game, with teal hologram frames over a star field and red as the state-change signal.
colors:
  signal-teal: "#0c8686"
  signal-teal-bright: "#119999"
  signal-teal-deep: "#0a7c7c"
  signal-teal-pale: "#88cccc"
  alert-red: "#991111"
  alert-red-deep: "#860c0c"
  alert-red-pale: "#e0b8b8"
  alert-red-bright: "#ff3535"
  void-black: "#000000"
  hologram-white: "#ffffff"
  surface-dark: "#303030"
typography:
  display:
    fontFamily: "Latin Modern Mono Caps, monospace"
    fontSize: "56px"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0.05em"
  headline:
    fontFamily: "Latin Modern Mono Caps, monospace"
    fontSize: "1.5em"
    fontWeight: 400
    lineHeight: 1.2
  title:
    fontFamily: "Latin Modern Mono Caps, monospace"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.2
  body:
    fontFamily: "Latin Modern Sans, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.7
  body-compact:
    fontFamily: "Latin Modern Sans, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Latin Modern Mono Caps, monospace"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.2
rounded:
  none: "0px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "20px"
  lg: "30px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.signal-teal}"
    textColor: "{colors.hologram-white}"
    rounded: "{rounded.none}"
  button-default:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.hologram-white}"
    rounded: "{rounded.none}"
  content-box:
    backgroundColor: "{colors.signal-teal-bright}"
    textColor: "{colors.hologram-white}"
    padding: "81px 42px 42px 43px"
  table-header:
    backgroundColor: "{colors.signal-teal-bright}"
    textColor: "{colors.hologram-white}"
    padding: "0 8px"
  table-header-hover:
    backgroundColor: "{colors.alert-red}"
  beta-badge:
    textColor: "{colors.alert-red-bright}"
    typography: "{typography.label}"
    padding: "4px 12px"
  quote:
    textColor: "{colors.signal-teal-bright}"
    typography: "{typography.body}"
    padding: "0 0 0 16px"
---

# Design System: Outer Colonies Website

## Overview

**Creative North Star: "The Flight Console"**

The website is a flight console looking out on the Solar System of 2250. It is a dark, sober instrument panel: a fixed star-field photograph under a 40% black veil, and on top of it content held in teal hologram frames. Everything is lit from within, with thin luminous lines and no soft fills. The setting is hard science (physics, water, metals, the speed of light), so the interface reads as equipment, not fantasy. Decoration is limited to frames, rules and corner brackets, as if drawn by light.

Edges are never plain right angles. Frames are chamfered, with diagonal cut corners and lines that look like coloured light beams. Text and images always sit inside such a frame or behind a rule. State is signalled by a shift from teal to red: the idle signal is teal, and hover, selection and active states warm to red. This is the one recurring gesture of the system, and it appears in the navbar glow, the table rows, the zone-corner brackets on inventory items and the rarity pips.

Typography is German-language and pairs a Latin Modern Sans reading face with Latin Modern Mono Caps for every title, label and navigation item, which gives a technical-manual voice. Density is moderate. Lore pages breathe at 18px with generous leading, while deck and trade screens are tabular and dense so card data stays exact and legible.

**Key Characteristics:**
- Dark-only: black void, teal signal, red alert. There is no light theme.
- Chamfered hologram frames (image-based) around every content block.
- Teal means idle and information, red means interaction and state change.
- Mono-caps titles, sans body text, with no other typefaces.
- Flat: depth comes from glow, translucency and layering, never from drop shadows.

## Colors

A near-monochrome teal-on-black palette with one warm counter-signal. The palette is the Angular Material M2 dark theme with custom teal (primary) and red (accent and warn) palettes. The values here are the shades the code actually uses.

### Primary
- **Signal Teal** (#0c8686, palette 700): The Material theme primary, used for raised primary buttons and filled controls.
- **Signal Teal Bright** (#119999, palette 500, `--color-primary`): Links, quote rules, table headers, striped-row tint, content-box centre tint and idle navbar glow. This is the signal colour of the whole site.
- **Signal Teal Deep** (#0a7c7c, palette 800, `--color-primary-dark`): The navbar ridge borders and the right-hand end of the navbar gradient.
- **Signal Teal Pale** (#88cccc, palette 200, `--color-primary-light`): Idle navbar labels and the landing tagline. It is the only teal that is comfortable as small text on black.

### Secondary
- **Alert Red** (#991111, palette 500, `--color-accent`): The state-change colour: row hover, table-header hover, active rarity pips, the active navbar glow and "done" markers.
- **Alert Red Deep** (#860c0c, palette 700, `--color-accent-dark`): Pressed and dark variants of the accent.
- **Alert Red Pale** (#e0b8b8, palette 100, `--color-accent-light`): Text and icons on an active red glow, such as the active navbar label.
- **Alert Red Bright** (#ff3535, palette A400, `--color-warn`): Warnings, errors, the Beta badge and anything that must read as text on black.

### Neutral
- **Void Black** (#000000, `--color-dark`): The footer, overlays, the navbar start and the veil over the star photograph (40% opacity).
- **Hologram White** (#ffffff, `--color-light`): Body text on the dark background, and card titles.
- **Surface Dark** (#303030): The Material M2 dark-theme surface, used by default Material controls (form fields, default buttons).

### Named Rules
**The Teal-to-Red Rule.** Idle is teal and interaction is red. A hover or selected state shifts a teal element to red (or a red-tinted glow); it never introduces a third hue. Red at rest is reserved for warnings and errors.

**The Pale-for-Small-Text Rule.** Signal Teal Bright and Alert Red do not carry small text on black at WCAG AA. Body-size text on the dark background is white, Signal Teal Pale, Alert Red Pale or Alert Red Bright. Saturated teal and red are for lines, fills, large labels and icons.

**The Veil Rule.** The star photograph is always under the 40% black veil. Never place content straight on the unveiled sky.

## Typography

**Display Font:** Latin Modern Mono Caps (with monospace fallback)
**Body Font:** Latin Modern Sans (with sans-serif fallback)
**Icon Font:** outer-colonies-icons (13 game glyphs, 24px, 32px `.big`)

**Character:** A technical-manual pairing. Mono Caps gives titles, navigation and table labels an engraved, instrument-plate voice. Latin Modern Sans keeps long German lore text readable. All headings are set `display: inline` by default and styled by their context.

### Hierarchy
- **Display** (Mono Caps, 56px, uppercase, 0.05em tracking, shrinks to 40px under 900px and 32px under 600px): The landing hero title only.
- **Headline** (Mono Caps, h2 default 1.5em): Content-box titles, which sit on the frame's top edge, and rules-page section heads.
- **Title** (Mono Caps, 16px): Anonymous navbar links, Material card titles and subtitles.
- **Body** (Sans, 18px, line-height 1.7, max 75ch): Landing and lore prose, list items and quotes (quotes in italic).
- **Body compact** (Sans, 16px, line-height 1.6): Teasers and secondary text.
- **Label** (Mono Caps, 14px): Badges, quote attribution and table headers.

### Named Rules
**The Two-Face Rule.** Titles, labels and navigation are Mono Caps, and everything that is read as a sentence is Sans. Never set a paragraph in Mono Caps or a title in Sans.

**The No-Third-Font Rule.** Only the two Latin Modern faces plus the icon font. The Material default Roboto must not leak in; the global `*` rule forces Latin Modern Sans.

## Layout

A single centred column over the fixed star field: `#root-content` is `min(1400px, 90%)` wide, offset `max(calc(50% - 700px), 5%)`, and carries a faint square-grid texture (`background_squares_transparent.png`). A sticky 62px navbar spans the full viewport width above it, and a black 100px footer closes the page.

Pages place one or more framed content boxes in the column. Public lore pages use a single text column at 75ch maximum, the landing page has a 60vh hero followed by stacked sections and a three-column teaser grid. Private pages vary: the home page uses floated boxes of 400, 500 and 550px inside a 940px container. Profile and login are centred at 50% width, and deck and rules use the full column width (`calc(100% - 50px)`).

The spacing rhythm is loose multiples of 4: 8, 12, 15, 20, 24, 30 and 40px. Section gap is 40px, card grid gap is 20px, and action rows use 12–24px. Breakpoints in use are 960, 900, 800, 760 and 600px. At 900px the teaser grid collapses to one column, at 760px the anonymous lore links leave the navbar. Mobile for private pages (deck, trade) is not yet a confirmed requirement.

## Elevation & Depth

The system is flat and luminous. There are no drop shadows. Depth is built from three things: the star photograph, the 40% black veil, and translucent teal-tinted panels (content-box centre is the primary teal at 7% opacity, black at 70% transparency behind cards). Light-emitting glow, not shadow, signals focus and activity: the navbar elements use a radial gradient halo that turns from teal (30% mix) to red (50% mix) when active or hovered.

Angular Material's elevation classes are included, so default Material components (raised buttons, menus, dialogs) carry the M2 dark-theme shadow. This is inherited rather than a deliberate part of the visual language.

### Named Rules
**The Glow-Not-Shadow Rule.** Emphasis is a halo or a line of light, never a cast shadow. Never add `box-shadow` to custom components.

## Shapes

The form language is the hologram chamfer. The content-box frame is nine images: a stepped top edge with a diagonal cut, a notched top-right plate (175×81px) and 42px corner pieces. Its lines are 2–3px teal light beams, slightly glowing, with a translucent teal wedge fill. The inventory zone corners are 60×60px L-shaped brackets in teal that turn red on hover. The rarity pips are 12×20px parallelograms (skewed −20°).

Custom CSS shapes should follow the same logic: no plain right-angle outlines and no pill shapes. The `rounded` token is `0px`. The few right-angle boxes that exist (tables, the Beta badge with a 1px red border) are functional, not a model.

## Components

### Buttons
Mostly Angular Material `mat-raised-button` (21 uses), with a few `mat-button` text buttons.
- **Shape:** Material M2 default radius (4px), which is inherited and does not yet follow the chamfer language.
- **Primary:** Signal Teal fill (#0c8686) with white text, used for the main call to action ("Jetzt mitspielen", "Registrieren").
- **Default:** Surface Dark (#303030) with white text, for secondary actions such as "Login".
- **Text link CTA:** A bare teal link (`--color-primary`) next to the primary button, as for "Einloggen".

### Content Box (signature)
The framed container, `oc-content-box`. It has the nine-piece chamfered teal frame, a translucent primary-teal centre (7% mix) and a Mono Caps h2 title sitting on the top edge at 30px/42px. Padding is 81px top (to clear the frame), 42px sides and bottom. Every page's main content lives in one.

### Navigation
- **Style:** A sticky 62px bar with a black-to-deep-teal gradient (90°, black 50% to #0a7c7c 130%) and 3px `ridge` borders in Signal Teal Deep at top and bottom.
- **Logged-in:** Icon-only elements (50px PNG icons with tinted filters) on a radial glow, with a logo that overhangs the bar on a black halo. Hover or active shifts the glow from teal (30% mix) to red (50% mix) and the icon filter from teal-grey to red-grey.
- **Anonymous:** Mono Caps 16px links in Signal Teal Pale, centred between a compact logo and the auth buttons. Hover and active turn Signal Teal Bright and add an underline. The links hide below 760px.

### Tables
Used for the deck builder and the rules pages. Sticky header cells in Signal Teal Bright with white text, which turn Alert Red on hover. Even rows get an 80%-transparent teal tint, and a hovered row is a 60%-transparent red tint. Cells have 0 8px padding and no wrap. Rarity shows as skewed teal pips, with filled ones red.

### Quote
A 3px Signal Teal Bright left rule with a 16px indent, italic 18px body text at line-height 1.7 and a Mono Caps 14px attribution in the same teal.

### Inventory Item
A 160×185px tile, with the card or booster image centred inside four L-shaped 60px zone corners. The corners are teal at rest and red on hover. The image is framed and never bare.

### Inputs / Fields
Material M2 dark-theme form fields at full width inside forms, with 15px bottom margin. They use the Surface Dark and Signal Teal focus treatment from the theme. There is no custom field styling yet.

### Beta Badge
A 1px Alert Red Bright outline with Mono Caps 14px text and a 4px 12px padding, pinned to the hero's top-right corner.

## Do's and Don'ts

### Do:
- **Do** shift teal elements to red on hover, focus and selection (Alert Red #991111 fills, Alert Red Pale text), and keep red out of idle surfaces.
- **Do** frame images and text blocks in a content box or with chamfered, beam-like lines; follow the zone-corner and frame art for any new shape.
- **Do** set titles, labels and navigation in Latin Modern Mono Caps and prose in Latin Modern Sans at 18px, line-height 1.7, capped at 75ch.
- **Do** use Signal Teal Pale (#88cccc) or white for small text on black, and keep WCAG AA contrast.
- **Do** keep the 40% black veil under all content and keep the page flat (halo and translucent tint, no shadows).
- **Do** show a placeholder (the star field) when card or lore images are missing, and keep page structure intact.
- **Do** give every interactive element a visible focus state. This is the product's accessibility default.

### Don't:
- **Don't** use plain rounded rectangles, pills or 90-degree outlined boxes for new components; the language is chamfered, hologram-like.
- **Don't** add drop shadows, gradients as decoration or any light theme.
- **Don't** use saturated teal (#119999) or Alert Red (#991111) as small body text on black.
- **Don't** introduce a third accent hue; teal, red and white on black is the whole palette.
- **Don't** use fantasy or space-opera visuals (nebula clouds, glowing orbs, sci-fi chrome). The setting is hard science with no warp drives, aliens or wonder machines.
- **Don't** set paragraphs in Mono Caps, and don't let Roboto or any default Material font through.
- **Don't** put card or rules content in anything that obscures exact reading of card text; legibility beats effect.
