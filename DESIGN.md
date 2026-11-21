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
    backgroundColor: "{colors.signal-teal-deep}"
    textColor: "{colors.hologram-white}"
    rounded: "{rounded.none}"
  button-default:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.hologram-white}"
    rounded: "{rounded.none}"
  content-box:
    backgroundColor: "{colors.signal-teal-bright}"
    textColor: "{colors.hologram-white}"
    padding: "26px 32px 30px"
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

<!-- impeccable:design-map -->
North Star: "The Flight Console"
Rules:
- The Teal-to-Red Rule. Idle is teal and interaction is red.
- The Pale-for-Small-Text Rule. Signal Teal Bright and Alert Red do not carry small text on black at WCAG AA.
- The Veil Rule. The star photograph is always under the 60% black veil.
- The Two-Face Rule. Titles, labels and navigation are Mono Caps, and everything that is read as a sentence is Sans.
- The No-Third-Font Rule. Only the two Latin Modern faces plus the icon font.
- The Glow-Not-Shadow Rule. Emphasis is a halo or a line of light, never a cast shadow.
Don't:
- Don't use plain rounded rectangles, pills or 90-degree outlined boxes for new components; the language is chamfered, hologram-like.
- Don't add drop shadows, gradients as decoration or any light theme.
- Don't use saturated teal (#119999) or Alert Red (#991111) as small body text on black.
- Don't introduce a third accent hue; teal, red and white on black is the whole palette.
- Don't use fantasy or space-opera visuals (nebula clouds, glowing orbs, sci-fi chrome).
- Don't set paragraphs in Mono Caps, and don't let Roboto or any default Material font through.
- Don't put card or rules content in anything that obscures exact reading of card text; legibility beats effect.
Do:
- Do shift teal elements to red on hover, focus and selection (Alert Red #991111 fills, Alert Red Pale text), and keep red out of idle surfaces.
- Do choose from the Flight-Console surface family (chamfered `panel`, fine card-corner `brackets` or `open` ruled sections) rather than wrapping every section in an identical outlined box.
- Do set titles, labels and navigation in Latin Modern Mono Caps and prose in Latin Modern Sans at 18px, line-height 1.7, capped at 75ch.
- Do use Signal Teal Pale (#88cccc) or white for small text on black, and keep WCAG AA contrast.
- Do keep the 60% black veil under all content and keep the page flat (halo and translucent tint, no shadows).
- (+2 more)
Full: .impeccable/design-full.md (read a section when you need its detail)
