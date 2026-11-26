# Outer Colonies

## Table of Contents

1. [Introduction](#introduction)
2. [Software Architecture](#software-architecture)
   - [High-Level Overview](#high-level-overview)
   - [Component Breakdown](#component-breakdown)
   - [Server Game State and Matchmaking](#server-game-state-and-matchmaking)
   - [Database Schema](#database-schema)
   - [Asset and Icon Pipeline](#asset-and-icon-pipeline)
   - [Data Flow and Communication](#data-flow-and-communication)
3. [Developer Documentation](#developer-documentation)
   - [Setup and Installation](#setup-and-installation)
   - [Development Workflow](#development-workflow)
   - [AI Agent Development Loop](#ai-agent-development-loop)
   - [Testing and Deployment](#testing-and-deployment)
4. [Technologies and Frameworks](#technologies-and-frameworks)

## Introduction

Outer Colonies is a web-based multiplayer card game consisting of four subprojects:
- **website**: Angular frontend for managing card decks, settings, and opponent search
- **client**: Phaser 3 frontend for the actual card game
- **server**: Backend for both client and website, using REST endpoints and WebSockets
- **misc**: Utility scripts, tools and documentation for development (see [misc/README.md](misc/README.md))

## Software Architecture

### High-Level Overview

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                                                                               │
│   ┌─────────────┐                           ┌─────────────┐                   │
│   │             │                           │             │                   │
│   │   Website   │                           │   Client    │                   │
│   │  (Angular)  │                           │ (Phaser 3)  │                   │
│   │             │                           │             │                   │
│   └──────┬──────┘                           └──────┬──────┘                   │
│          │ REST API                                │ WebSocket                │
│          │                                         │                          │
│          │                                         │                          │
│   ┌───────────────────────────────────────────────────────────────────────┐   │
│   │      │                         Server          │                      │   │
│   │      │                        (Express)        │                      │   │
│   │      ▼                                         ▼                      │   │
│   │  ┌─────────────────────────┐    ┌─────────────────────────────────┐   │   │
│   │  │                         │    │                                 │   │   │
│   │  │   WebSocket Listeners   │    │           REST API              │   │   │
│   │  │                         │    │                                 │   │   │
│   │  └─────────────────────────┘\   └─────────────────────────────────┘   │   │
│   │      │                       \                                        │   │
│   │  ┌─────────────────────────┐  \ ┌─────────────────────────────────┐   │   │
│   │  │                         │   \│                                 │   │   │
│   │  │      Game Logic         │    │       Matchmaking (Cron)        │   │   │
│   │  │                         │    │                                 │   │   │
│   │  └─────────────────────────┘    └─────────────────────────────────┘   │   │
│   │                                                                       │   │
│   └────────────────────┬───────────────────────────────┬──────────────────┘   │
│                        │                               │                      │
│                        │                               │                      │
│                        ▼                               ▼                      │
│   ┌─────────────────────────────────────┐ ┌─────────────────────────────┐     │
│   │                                     │ │                             │     │
│   │           Database                  │ │   Mail SMTP Relay Server    │     │
│   │          (Maria DB)                 │ │                             │     │
│   │                                     │ │                             │     │
│   └─────────────────────────────────────┘ └─────────────────────────────┘     │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

#### Website (Angular)
- **Purpose**: User management, deck configuration, settings, and opponent search
- **Loading**: Secondary pages are loaded on demand without automatic route preloading; the landing page remains in the initial bundle. Legal dialogs load their page components when opened.
- **Key Components**:
    - `app.component.ts`: Main application component; uses the fixed teal star field with a dark fallback and veil across public and private pages
  - `auth.service.ts`: Authentication service
  - `pages/`: Pages of the website, substructured by accessibility
    - `private/`: Pages for authenticated players (behind `privateGuardFn`)
      - `deck/`: Deck management page
      - `home/`: Home page (game home for logged-in players at `/home`)
      - `profile/`: User profile page
      - `rules/`: Public game rules reference (available to anonymous and authenticated visitors)
      - `trade/`: Trade page
    - `public/`: Pages for anonymous visitors (behind `publicGuardFn`)
      - `activate-account/`: Account activation page
      - `confirm-email/`: Email confirmation page
      - `data-privacy/`: Data privacy information page
      - `editions/`: Public lore page "Die Editionen" (edition stories)
      - `factions/`: Public lore page "Die Mächte" (Terra, Mars, Venus, Outer Colonies)
      - `forgot-password/`: Forgot password page
      - `history/`: Public lore page "Die Geschichte" (timeline)
      - `imprint/`: Imprint page
      - `landing/`: Public landing page for anonymous visitors at `/`
      - `login/`: Login page
      - `register/`: Registration page
      - `reset-password/`: Reset password page
      - `world/`: Public lore page "Die Welt" (setting intro)
  - `components/`: Reusable UI components
    - `content-box/`: Content box component (`oc-content-box`) - A shared Flight-Console surface container with a heading and projected content area, supporting `panel` (chamfered frame), `brackets` (fine luminous card-corner brackets) and `open` (unboxed ruled section) variants.
      - **Used in pages**: reset-password, forgot-password, profile, register, confirm-email, login, trade, home, rules, activate-account, deck, landing, world, factions, history, editions, imprint, data-privacy
    - `error-state-matcher.ts`: Error state matcher utility - A utility class for handling form error states in Angular Material forms.
      - **Used in pages**: reset-password, forgot-password, profile, register, login
    - `image-modal/`: Image modal component - A modal dialog for displaying images. Used to show larger versions of images when clicked.
      - **Used in pages**: register, deck
    - `inventory-item/`: Inventory item component - A component for displaying inventory items with an image and text.
      - **Used in pages**: trade
    - `navbar/`: Navigation bar component - The main navigation bar for the website: icon-based navigation for logged-in players, a visible public home link and accessible lore links with a mobile menu, and registration-first account actions for anonymous visitors. The shell also provides a skip-to-content link and keyboard focus indicators; the footer retains legal links and contextual lore wayfinding.
      - **Used in**: app.component.html (global navigation)
    - `open-item/`: Open item component - A component for displaying the contents of opened items (e.g., booster packs).
      - **Used in pages**: trade
    - `quote/`: Quote component (`oc-quote`) - A presentational figure quote with teal left border and attribution line. Used as narrative insert on the public lore pages.
      - **Used in pages**: world, factions
- **Communication**: Uses REST API to communicate with the server
- **Public account forms**: Authentication and account-token pages use responsive centered layouts, autocomplete hints, accessible request feedback and page headings. Registration exposes username/password rules and a separate keyboard-operable privacy dialog trigger; login and registration prevent duplicate in-flight requests.

#### Client (Angular + Phaser 3)
- **Purpose**: Actual card game implementation with Angular HUD/overlays and Phaser 3 card board rendering
- **Key Components**:
  - `app.component.ts`: Main game component; boots Phaser, registers root Angular services into `Phaser.Game.registry` via `callbacks.preBoot`, and renders the non-blocking Angular stage overlay above the canvas
  - `socket_service.ts`: App-level Angular service owning the single Socket.IO connection, listener cleanup, reconnection disabling during matches, typed inbound RxJS streams, and typed outbound `emit*` methods
  - `services/`: Renderer-agnostic Angular services holding client game logic, asset preloading, and state
    - `asset_preloader_service.ts`: Browser-native image preloader preserving `assetBaseURL()` and serving both Angular DOM overlays and Phaser board textures
    - `matchmaking_service.ts`: Session token parsing, matchmaking status text, online count, and match start notifications
    - `game_session_service.ts`: Active match `ClientState`, countdown, disconnect handling, buffered card movement events, and cancel-and-replace state update sequencing
    - `game_interaction_service.ts`: Card selection, battle planning, interception selection, option picker state, zoom preview state, prompt visibility, auto-ready scheduling, intent dispatch, and derived UI view-models
    - `navigation_service.ts`: Wrapper for external website navigation
    - `scheduler_service.ts`: Injectable browser-timer scheduler used by `StateUpdateSequencer` and `GameInteractionService`
    - `service_registry.ts`: Registry keys bridging root Angular services into Phaser scenes
  - `ui/`: Angular HTML/CSS components for matchmaking (`matchmaking_overlay`, `loading_status`, `online_indicator`, `version_indicator`), in-game HUD (`game_hud`, `preloader`, `action_pool`, `countdown_indicator`, `combat_range_indicator`, `battle_action_buttons`, `continue_button`, `exit_button`, `prompt`), and overlays/modals (`zoom_card`, `option_picker`, `game_over_indicator`, `connection_lost`)
  - `scenes/`: Thin Phaser board adapters (`game.ts`, `matchmaking.ts`) rendering the space background, zone markers, interactive card board, and battle FX
  - `components/`: Phaser board components (`background.ts`, `perspective.ts`, `buttons/retract_card_button.ts`, `card/`, `indicators/attack_damage_indicator.ts`, `indicators/value_indicator.ts`)
  - `config/`: Game configuration (`animation.ts`, `background.ts`, `design.ts`, `layout_game.ts`, `layout.ts`, `perspective.ts`; design tokens mirrored in `styles/_design_tokens.scss`)
  - `testing/`: Shared test utilities
    - `phaser_stubs.ts`: Chainable Phaser game object, scene and system stubs for the client specs
  - `utils/`: Utility classes
    - `state_update_sequencer.ts`: Cancel-and-replace sequencer for the state update pipeline
- **Communication**: Uses WebSockets to communicate with the server for real-time game updates

#### Server (Express + Socket.IO)
- **Purpose**: Backend services for both website and client
- **Key Components**:
  - `app.ts`: Main server application (startup database probe, cron registration, graceful shutdown on `SIGTERM`/`SIGINT` and uncaught exceptions)
  - `components/rest_api/`: REST API for the website, split into one `express.Router` module per resource
    - `index.ts`: Router registration, development-only `/assets/*` proxy and central error-handling middleware
    - `auth_router.ts`, `deck_router.ts`, `profile_router.ts`, `daily_router.ts`, `item_router.ts`, `shop_router.ts`, `online_router.ts`: Endpoints per resource
    - `session_middleware.ts`: `requireSession` middleware resolving the `session-token` header for authenticated endpoints
    - `api_error.ts`: Typed `ApiError`, the async route wrapper and the central error handler
    - `api_response.ts`: Status response helper with leveled failure logging
  - `components/game.ts`: Game logic and WebSocket handlers
  - `components/matchmaking.ts`: Matchmaking logic
  - `components/online_users.ts`: Tracking of unique logged-in users (a user with several sockets counts once) and push of the online count
  - `components/game_state/`: In-memory game state
    - `match.ts`: Central match state (players, turn phases, battle, control, interventions)
    - `player.ts`: Player state (deck, hand, discard pile, card stacks, action pool)
    - `battle.ts`: Battle state, mission and raid resolution
    - `intervention.ts`: Intervention mechanic (turn start, raid announcement, battle rounds, attacks, tactic cards)
    - `game_result.ts`: Win conditions, Sol earnings and daily achievements
    - `socket_data.ts`: Per-socket user and deck data
  - `components/cards/`: Card-related logic and data
    - `action_pool.ts`: Action pool logic
    - `action_pool.test.ts`: Action pool tests
    - `card_profile.ts`: Card profile logic
    - `card_stack.ts`: General logic for stacks of cards
    - `card.ts`: General card logic
    - `collection/`: Implementation of all the actual cards
    - `types/`: Abstract classes with common logic for types of cards
  - `components/converters/`: Conversion of client payloads to server state
    - `client_planned_battle_converter.ts`: Planned battle conversion
    - `client_state_converter.ts`: Client state conversion
  - `components/persistence/`: Data persistence
    - `db_connector.ts`: Database connector and transaction wrapper
    - `db_credentials.ts`: Database credentials management
    - `db_dailies.ts`: Database dailies management
    - `db_decks.ts`: Database decks management
    - `db_items.ts`: Database items management
    - `db_magic_links.ts`: Database magic links management
    - `db_profiles.ts`: Database profiles management
  - `components/utils/`: Utility functions
    - `auth.ts`: Authentication utility
    - `helpers.ts`: Helper functions
    - `logger.ts`: Leveled logging utility (the only place writing to the console)
    - `mailer.ts`: Mailer utility
  - `shared/`: Shared TypeScript interfaces and types used by both website and client
    - `interfaces/`: REST API and client message interfaces (`rest_api.ts`, `client_game_params.ts`, `client_planned_battle.ts`, `client_state.ts`)
    - `config/constants.ts`: Shared constants
    - `config/dailies.ts`: Daily achievement definitions
    - `config/editions.ts`: Card edition names (edition number to name mapping)
    - `config/enums.ts`: Game enums
    - `config/rules.ts`: Game rules configuration
    - `config/starter_decks.ts`: Starter deck configurations
- **Communication**:
  - REST API for website communication
  - WebSocket for real-time game communication with the client
- **Shared Code Boundary**: Code shared by the server, client and website lives in `server/src/shared/`. The client and website import it through the `@shared/*` TypeScript path alias, e.g. `import { CardType } from '@shared/config/enums'`, while the server's own imports stay relative within its subproject root. The alias is configured in all three subprojects' `tsconfig.json` but only exercised by the client and website, as the server's runtime (ts-node) and test setup (Jest) do not resolve it. No import crosses a subproject root with a relative path.

#### REST Endpoints

The server provides the following REST endpoints for the website:

- **Authentication**:
  - `POST /api/auth/register`: Register a new user
  - `PUT /api/auth/register/:id`: Activate a user account
  - `POST /api/auth/login`: Login a user
  - `GET /api/auth/login`: Check login status
  - `DELETE /api/auth/login`: Logout a user
  - `GET /api/auth/exists`: Check if a user exists
  - `DELETE /api/auth/password/:user`: Request password reset
  - `PUT /api/auth/password`: Reset password
  - `PUT /api/auth/password/:id`: Change password
  - `POST /api/auth/email`: Request email change
  - `PUT /api/auth/email/:id`: Change email

- **Deck Management**:
  - `GET /api/deck`: Get user's deck
  - `POST /api/deck/:cardInstanceId`: Add a card to the deck
  - `DELETE /api/deck/:cardInstanceId`: Remove a card from the deck

- **Profile Management**:
  - `GET /api/profile`: Get user profile
  - `PUT /api/profile/newsletter`: Subscribe to newsletter
  - `DELETE /api/profile/newsletter`: Unsubscribe from newsletter

- **Daily Rewards**:
  - `GET /api/daily`: Get daily rewards

- **Online Users**:
  - `GET /api/online`: Number of unique logged-in users currently online (unauthenticated, polled by the website home page every 60 seconds)

- **Item Management**:
  - `GET /api/item`: Get user's items
  - `POST /api/item/:itemId`: Use an item
  - `POST /api/buy/booster/:boosterNo`: Buy a booster pack

#### WebSocket Events

The server provides the following WebSocket events for the game client:

- **Matchmaking**:
  - `MsgTypeInbound.Login`: Login to matchmaking
  - `MsgTypeOutbound.Matchmaking`: Matchmaking status updates (`MatchmakingStatus.Search` while waiting, `MatchmakingStatus.Start` with the game params when a match begins)
  - `MsgTypeOutbound.OnlineCount`: Number of unique logged-in users, pushed to all clients on every login and disconnect which changes it (and to a newly logged-in socket)

- **Game**:
  - `MsgTypeInbound.Connect`: Connect to a match
  - `MsgTypeInbound.Ready`: Player ready for game phase
  - `MsgTypeInbound.Disconnect`: Player disconnected
  - `MsgTypeInbound.Handcard`: Play a hand card
  - `MsgTypeInbound.Retract`: Retract a card
  - `MsgTypeInbound.Discard`: Discard a card
  - `MsgTypeInbound.Attack`: Attack with a card
  - `MsgTypeInbound.Surrender`: Surrender the match
  - `MsgTypeOutbound.Connect`: Confirm match connection
  - `MsgTypeOutbound.Countdown`: Countdown updates
  - `MsgTypeOutbound.CardRequest`: Reserved enum value, currently unused (card decisions reach the client via `State`/`Countdown`)
  - `MsgTypeOutbound.State`: Full game state updates

### Server Game State and Matchmaking

Game state is kept in memory only; matches are not persisted to the database. Core classes:

- **`Match`** (`server/src/components/game_state/match.ts`): Central state of a running match. Holds both players, the active and pending-action player, the current turn phase (`Init` → `Start` → `Build` → `Combat` → `End`), the `Battle` object, countdown timer, control points and the `GameResult`. Drives the turn lifecycle (`prepareStartPhase` → `prepareBuildPhase` → `prepareCombatPhase` → `prepareEndPhase`).
- **`Player`** (`player.ts`): Deck, hand, discard pile and in-play card stacks (the colony is a root card stack). Manages drawing, discarding, zones (`Hand`, `Colony`, `Orbital`, `Neutral`) and control gains.
- **`Battle`** (`battle.ts`): Created from a client-planned battle; resolves battle rounds from the highest weapon range present in the battle (capped at max range) down to 1. Mission results grant cards and control; raids pull colony cards into the battle at range 1.
- **`Intervention`** (`intervention.ts`): Interrupt-driven reaction mechanic. Interventions occur at opponent turn start, on raid announcement, at battle round start/end, before attacks and for tactic cards, and are skipped automatically if the pending player has no valid targets.
- **`GameResult`** (`game_result.ts`): Win conditions (domination at control limit, destruction, deck depletion, surrender); computes Sol earnings and daily achievements.

**Matchmaking** (`components/matchmaking.ts`): Players log in to the matchmaking lobby room with their session token. The website passes the session token to the client as the `token` query parameter of the game URL (`MatchmakingService.parseSessionToken` parses it, with a fallback to the legacy raw query string format). `matchMakingCron` (registered in `app.ts` via `setInterval`, running every second) pairs waiting clients two-by-two and creates a `Match` in a room `match-<uuid>`. On login, a player whose previous match is still running or still owes them its result (see reconnection) rejoins it instead of searching again.

**Reconnection** (`components/match_registry.ts`): Matches are registered in an in-memory registry keyed by their room, so they stay discoverable even while both sockets are disconnected (Socket.IO drops empty rooms). A disconnect during a running match does not end it: only the player's bound socket marks them disconnected (a stale socket of a previous connection cannot re-mark them), and the match stays alive for the reconnection grace window (`rules.reconnectGracePeriod`). Within the window, the player rejoins by logging in again with their session token (e.g. after a page reload); the new socket is bound back to their player and the previous socket is detached. Once the window expires, `gameCron` surrenders the player. A finished match stays registered until every player received its final state (`rules.resultDeliveryPeriod` at the latest): a player who was offline when the game ended is routed back into it on their next login, so the missed game result is delivered.

**Countdown** (`components/game.ts`): `gameCron` (also every second) decrements the 90-second countdown of running matches in which both players are ready; on timeout it triggers an automatic ready event instead of a timeout victory.

### Database Schema

Persistence uses MariaDB (schema definition: `misc/database/outercolonies.sql`):

| Table | Purpose | Key Columns |
| --- | --- | --- |
| `credentials` | User accounts and sessions | `user_id` (PK, auto-increment), `username`, `password`, `email`, `created`, `last_login`, `session_token`, `session_valid_until`, `activated` |
| `dailies` | Daily achievement progress per user (one date column per daily type) | `user_id` (PK), `login`, `victory`, `game`, `energy`, `ships`, `domination`, `destruction`, `control`, `juggernaut`, `stations`, `discard`, `colony`, `colossus` |
| `decks` | Card instances owned by a user | `card_instance_id` (PK, auto-increment), `card_id`, `user_id`, `in_use` (card is in the active deck), `tradeable` |
| `items` | Items, e.g. unopened booster packs | `item_id` (PK, auto-increment), `user_id`, `type`, `message`, `content` (JSON) |
| `magic_links` | One-time links (account activation, password/email change) | `id` (PK, UUID), `user_id`, `type`, `value`, `valid_until` |
| `profiles` | User profile and currency | `user_id` (PK), `newsletter`, `sol` |

`dailies`, `decks`, `items`, `magic_links` and `profiles` reference `credentials.user_id` via foreign keys with `ON DELETE CASCADE ON UPDATE CASCADE`.

### Asset and Icon Pipeline

The `misc` directory contains the pipeline that turns the designed cards into data and runtime assets:

#### Card Data Extraction (GIMP)

- Cards are designed as GIMP XCF files using a layer-based template, organized in edition subfolders (`1`–`5`).
- `misc/cards/process_cards.py` runs inside GIMP (python-fu batch) and extracts per card: type (via visible header icon layers), title, effect (bold text), tags (bold+italic), conditional tags, lore (italic), discipline, rarity (highest visible `rarity<n>_red` layer, 5–0), author and socket/stat values from the module layers. Results are written to `misc/cards/cards.csv`.
- Sequences of 2–6 spaces in the template text are converted to `{ICON:<type>}` placeholders using context heuristics; ambiguous cases are flagged with `?` for manual review.
- `misc/cards/card_bulk_analyze.sh` runs the extraction over all edition subfolders and merges the results into `misc/cards/cards.csv`; `misc/cards/card_text_corrections.md` logs manual text and placeholder corrections.

#### Card Balancing Toolkit

- `misc/balancing/` contains the simulation-based card balancing toolkit (metric modules, random-battle probe, measurement results and round log) that derives card value scores and target curves from `misc/cards/cards.csv`; see `misc/balancing/README.md`.

#### Card Images

- Card PNGs are renamed by `misc/cards/card_bulk_rename.sh` to `cards/<id>.png` (edition digit + card ID) and resized by `misc/cards/card_bulk_resize.sh` to 411×561 px (ImageMagick).
- The client loads card images per match from `<assetBaseURL>/cards/<id>.png` (`client/src/app/services/asset_preloader_service.ts`), including ID 0 for the colony.

#### Client Runtime Assets

The client loads all runtime assets directly from the configured asset host (`environment.urls.assets`) on deployed stages, falling back to the development-only `<apiURL>/assets/` proxy locally (see `asset_preloader_service.ts`):

- `background/`: starfields, sun, orbs, rings and vessel sprites
- `attribute/`: stat icons (`damage`, `hp`, `control`, `speed`, `energy`, `armour`, `shield`, `point_defense`) and socket glyphs (`theta`, `xi`, `phi`, `omega`, `delta`, `psi`)
- `icons/`: card type and discipline icons plus UI icons (`retract_card`, `mission`, `raid`, `exit`, combo type icons)
- `utils/`: card masks and glow, stack piles, range indicators, buttons, game over screens

#### Icon Font (Website)

- `misc/icons/` contains the source SVG/PNG stat and type icons (fetched from the assets server) plus `png_to_svg_fixed.py` and `generate_font.js`; the generated `outer-colonies-icons` font (TTF/WOFF/WOFF2, CSS and `mapping.md`) lives in `misc/icons/font/`.
- The font provides 13 glyphs (U+EA01–U+EA0D): armour, control, damage, energy, equip, hp, hull, infra, orb, point_def, shield, tactic and speed.
- `website/src/app/icon.service.ts` maps icon names to the font's Unicode Private Use Area code points and renders `{ICON:<name>}` placeholders in card texts on the deck and rules pages.

## Developer Documentation

### Setup and Installation

#### Prerequisites
- Node.js (v22 or later)
- npm (v10 or later)
- Angular CLI (v21 or later)

#### Installation Steps

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/chrthom/outer-colonies.git
   cd outer-colonies
   ```

2. **Install Dependencies**:
   ```bash
   # Install root dependencies
   npm install

   # Install dependencies for each subproject
   cd website && npm install && cd ..
   cd client && npm install && cd ..
   cd server && npm install && cd ..
   ```

3. **Configuration**:
   - Copy the configuration files from `server/config/` and adjust as needed.
   - Ensure the database connection settings are correctly configured.
   - Set the environment variables for the database and mail service. They are read from the process environment only (no `.env` file is loaded), so export them in the shell before starting the server:
     - `DB_PASSWORD`: Database password (required, the server cannot connect to the database without it)
     - `MAIL_PASSWORD`: Mail service password (optional for development)

     ```bash
     export DB_PASSWORD='your-database-password'
     export MAIL_PASSWORD='your-mail-password'   # optional
     cd server && npm run s
     ```

     The database user, host, port and name are taken from `server/config/` (see `database` in `default.json`). Override them in a local `server/config/local.json` if your database runs elsewhere.

### Development Workflow

The repository working rules — repository language, branches and merges, issue labels, milestones, versions and releases, and the deployment cadence — are documented in [AGENTS.md](AGENTS.md).

#### Running the Projects

1. **Start the Server**:
   ```bash
   cd server
   npm run s
   ```

2. **Start the Website**:
   ```bash
   cd website
   npm run s
   ```

   If the Server is not run locally, the website can also connect to the deployed staging server:

   ```bash
   npm run si
   ```

3. **Start the Client**:
   ```bash
   cd client
   npm run s
   ```

   If the Server is not run locally, the client can also connect to the deployed staging server:

   ```bash
   npm run si
   ```

**Note**: If you make changes to the server's TypeScript interfaces or types in `server/src/shared/`, they are picked up by the website and client projects automatically: both compile the shared sources directly through the `@shared/*` path alias, so no separate build step is required.

#### Building the Projects

1. **Build for Staging**:
   ```bash
   # Build the projects
   npm run build:staging
   ```

2. **Build for Production**:
   ```bash
   # Build the projects
   npm run build:prod
   ```

#### Code Quality and Testing

1. **Linting**:
   ```bash
   npm run lint
   ```

2. **Formatting**:
   ```bash
   npm run format
   ```

3. **Run Tests**:
   ```bash
   npm run test
   ```

   **Website Test Requirements**:
   - Tests run headless (`ChromeHeadless`); a Chrome or Chromium binary must be available
   - If no Chrome is found (e.g. in a Docker container with only Chromium installed), set `CHROME_BIN` (e.g. `apt update && apt install -y chromium` and `CHROME_BIN=/usr/bin/chromium`)

4. **Running all of the checks above**:
   ```bash
   npm run check
   ```

#### Deployment

1. **Build the Projects**:
   ```bash
   npm run build:staging
   # or for production
   npm run build:prod
   ```

2. **Deploy Server**:
   - Upload the built zip file to the target environment under `server`.
   - Unzip the archive on the target environment.
   - If `server/package.json` or `server/package-lock.json` changed since the last deploy (new or updated dependency), run `npm install` (or `npm ci` when the `node_modules` state is unknown) inside the `outercolonies_server` container before restarting it: the container keeps its `node_modules` across deploys, so a new dependency would otherwise be missing at runtime (`Cannot find module '…'`).
   - Restart the `outercolonies_server` container.

3. **Deploy Client**:
   - Upload the built zip file to the target environment under `client`.
   - Unzip the archive on the target environment.

4. **Deploy Website**:
   - Upload the built zip file to the target environment under `website`.
   - Unzip the archive on the target environment.

#### Creating a Release

1. **Create Release Branch**:
   ```bash
   git checkout -b release/<x.x>
   git push --set-upstream origin release/<x.x>
   ```

2. **Create Tag**:
   ```bash
   git tag -a v<x.x.x> -m "<tag description from milestone>"
   git push origin v<x.x.x>
   git checkout main
   ```

3. **Create GitHub Release**:
   - Create a new GitHub Release, referring to the existing tag.

4. **Increment Version**:
   ```bash
   npm run version
   ```

### AI Agent Development Loop

The repository contains an event-driven agent workflow on GitHub Actions for unattended issue implementation, PR review and review fixes. The three roles — **implementer**, **reviewer** and **fixer** — run a headless coding agent (Mistral GLM via OpenCode) on the workflow runner:

- **Trigger**: `dev-loop` label on an issue (implementer opens a ready PR), review comments on agent PRs (reviewer), or failing checks (fixer)
- **Escalation**: the loop stops and labels the issue/PR `needs-human` when an agent cannot proceed (budgets for time, steps and tokens are capped)
- **Automation**: GitHub is the source of truth — the chain is driven by the GitHub events each role fires, with a manual `workflow_dispatch` backstop for retries

The full design, budgets and the role chain are documented in [misc/dev-loop.md](misc/dev-loop.md). Contribution guidance for AI agents (project context, conventional commits, skills) is in [AGENTS.md](AGENTS.md).

## Technologies and Frameworks

### Frontend

- **Angular**: Used for both the website and client applications.
- **Phaser 3**: Game framework used for the client to implement the card game logic and rendering.
- **TypeScript**: Primary language for frontend development.
- **Jasmine + Karma + Angular TestBed**: For testing.

### Backend

- **Express**: Web framework for handling REST API requests.
- **Socket.IO**: Library for real-time WebSocket communication between the client and server.
- **Zod**: Schema validation of REST API request bodies (see `server/src/components/utils/request_validation.ts`). Email format validation uses the shared `server/src/shared/config/email_rules.ts` rule in both server and website; address ownership is checked by confirmation email.
- **express-rate-limit**: Rate limiting of the auth REST endpoints against brute force, mail flooding and user enumeration (see `server/src/components/utils/rate_limiter.ts`). Limits are held in memory per server process, so they reset on restart. **Rate limiting is currently not enforced**: `rate_limit.dry_run` is `true` in the default, staging and production configs, so requests over a limit are only logged as a warning (including the client IP, to verify proxy bucketing) and still served. This is a deliberate decision until the limits are validated against real traffic; set `rate_limit.dry_run` to `false` to enforce them (tests run enforced).
- **Node.js**: JavaScript runtime for the server.

### Development Tools

- **ESLint**: For linting and code quality.
- **Prettier**: For code formatting.
- **Jest**: For testing.

### Database

- **MariaDB**: Used for data persistence (as seen in `misc/database/outercolonies.sql`).
