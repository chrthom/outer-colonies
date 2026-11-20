# Product

<!-- impeccable:product-schema 1 -->

Scope: the `website/` subproject only (Angular 21 + Angular Material). The Phaser game client (`client/`) and the server are out of scope for design work.

## Platform

web

## Users

- Primary users (inferred from the repo, not confirmed in an interview): German-speaking players of the browser-based trading card game Outer Colonies. Anonymous visitors discover the game on public landing and lore pages and register. Logged-in players manage their deck and collection, read the rules, trade and shop for boosters, collect daily rewards and sol, and start matchmaking, which launches the game client.
- Other audiences (card authors, admins) are not recorded; none was confirmed.

## Product Purpose

The website is the account and meta-game layer around the Outer Colonies card game: registration and login, profile and newsletter, deck building, inventory and booster trading, rules reference and public lore pages. Success is a visitor who registers, a player who builds a legal deck (60–100 cards) and enters a match.

## Positioning

Outer Colonies is a hard-science setting: the Solar System in 2250, with no warp drives, no aliens and no wonder machines, only physics, water, metals and the speed of light. Four powers (Terra, Mars, Venus, Outer Colonies) compete while young colonies build at the edge of the light. A neighbouring card game could not truthfully copy this setting or its card and battle mechanics (range-phase combat, colony building, four victory conditions).

## Operating Context

- Public pages (no login): landing `/`, login, register, activate-account, forgot/reset-password, confirm-email, and the lore pages Die Welt, Die Mächte, Die Geschichte, Die Editionen, plus imprint and data privacy.
- Private pages (login required): home (`/home`), deck, profile, rules, trade.
- The game itself runs in a separate Phaser client that the website opens with the session token.
- Card images and illustrations load from the assets web space; pages must tolerate missing images (placeholders exist).
- The icon font `outer-colonies-icons` provides 13 game glyphs, and card texts use `{ICON:<name>}` placeholders.

## Capabilities and Constraints

- Angular Material components with a custom theme; shared `oc-content-box` container and `oc-` selector prefix.
- All UI copy is German for now (bilingual support is planned); code, docs and issues are English.
- The game is in beta.
- Shared types and constants come from `server/src/shared/` through the `@shared/*` alias.
- Game terms: Sol (currency), Kolonie, Rümpfe, Ausrüstung, Infrastruktur, Himmelskörper, Taktiken, four disciplines, booster packs.
- Open question: whether mobile web is a first-class requirement for private pages (deck and trade). Not confirmed.

## Brand Commitments

- Name: Outer Colonies. Logo at `website/src/assets/logo.png`.
- Existing tone on public pages: sober, narrative, German, in-world ("Baue deine Kolonie am Rand des Lichts.").
- A teal accent is already used for quotes; the existing theme primary lives in the Angular Material theme (`website/src/style/`).

## Evidence on Hand

- Real lore text and edition stories in the public pages under `website/src/app/pages/public/`.
- Card images (411×561 px) and lore illustrations loaded from the assets server; the website repository itself ships only the logo, icon font and content-box frame images.
- No testimonials, player counts, press or pricing exist in the repo; do not fabricate them. The home page shows a live online-player count from the server.

## Product Principles

1. Serve the player's loop: discover, register, build a deck, play. Every page should shorten the path to the next step of that loop.
2. The setting is the differentiator: its hard-science tone should come through in copy and presentation, without fantasy or space-opera clichés.
3. Rules and card information must be exact and legible; a deck builder fails if players misread a card.
4. Degrade gracefully: missing images, empty inventories and a failing API must still leave a usable page.

## Accessibility & Inclusion

No product-specific standard was established. Default to WCAG AA contrast, full keyboard operation and visible focus for forms and deck management.
