# Outer Colonies

## Table of Contents

1. [Introduction](#introduction)
2. [Software Architecture](#software-architecture)
   - [High-Level Overview](#high-level-overview)
   - [Component Breakdown](#component-breakdown)
   - [Data Flow and Communication](#data-flow-and-communication)
3. [Developer Documentation](#developer-documentation)
   - [Setup and Installation](#setup-and-installation)
   - [Development Workflow](#development-workflow)
   - [Testing and Deployment](#testing-and-deployment)
4. [Technologies and Frameworks](#technologies-and-frameworks)

## Introduction

Outer Colonies is a web-based multiplayer card game consisting of four subprojects:
- **website**: Angular frontend for managing card decks, settings, and opponent search
- **client**: Phaser 3 frontend for the actual card game
- **server**: Backend for both client and website, using REST endpoints and WebSockets
- **misc**: Utility scripts for development

## Software Architecture

### High-Level Overview

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                                                                               │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────────────┐   │
│   │             │    │             │    │                                 │   │
│   │   Website   │    │   Client    │    │             Server              │   │
│   │ (Angular)   │    │ (Phaser 3) │    │                                 │   │
│   │             │    │             │    │                                 │   │
│   └──────┬──────┘    └──────┬──────┘    │                                 │   │
│          │                  │           │                                 │   │
│          │ REST API         │ WebSocket  │                                 │   │
│          │                  │           │                                 │   │
│          ▼                  ▼           │                                 │   │
│   ┌─────────────┐    ┌─────────────┐    │                                 │   │
│   │             │    │             │    │                                 │   │
│   │  User       │    │  Game       │    │  ┌─────────────────────────────┐  │   │
│   │ Management │    │  Logic      │    │  │                             │  │   │
│   │             │    │             │    │  │  Matchmaking & Game State    │  │   │
│   └─────────────┘    └─────────────┘    │  │                             │  │   │
│                                          │  └─────────────────────────────┘  │   │
│                                          └─────────────────────────────────┘   │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

#### Website (Angular)
- **Purpose**: User management, deck configuration, settings, and opponent search
- **Key Components**:
  - `app.component.ts`: Main application component
  - `auth.service.ts`: Authentication service
  - `pages/`: Various pages for user management and settings
    - `activate-account/`: Account activation page
    - `confirm-email/`: Email confirmation page
    - `data-privacy/`: Data privacy information page
    - `deck/`: Deck management page
    - `forgot-password/`: Forgot password page
    - `home/`: Home page
    - `imprint/`: Imprint page
    - `login/`: Login page
    - `profile/`: User profile page
    - `register/`: Registration page
    - `reset-password/`: Reset password page
    - `rules/`: Game rules page
    - `trade/`: Trade page
  - `components/`: Reusable UI components
    - `content-box/`: Content box component
    - `error-state-matcher.ts`: Error state matcher utility
    - `image-modal/`: Image modal component
    - `inventory-item/`: Inventory item component
    - `navbar/`: Navigation bar component
    - `open-item/`: Open item component
- **Communication**: Uses REST API to communicate with the server

#### Client (Phaser 3)
- **Purpose**: Actual card game implementation with game logic and rendering
- **Key Components**:
  - `app.component.ts`: Main game component
  - `scenes/`: Different game scenes (menus, gameplay, etc.)
    - `game.ts`: Main game scene
    - `matchmaking.ts`: Matchmaking scene
    - `resource-loader.ts`: Resource loader scene
  - `components/`: Game-specific components
    - `action_pool.ts`: Action pool component
    - `background.ts`: Background component
    - `buttons/`: Button components
    - `card/`: Card components
    - `indicators/`: Indicator components
    - `loading_status.ts`: Loading status component
    - `option_picker.ts`: Option picker component
    - `perspective.ts`: Perspective component
    - `preloader.ts`: Preloader component
  - `config/`: Game configuration
    - `animation.ts`: Animation configuration
    - `background.ts`: Background configuration
    - `design.ts`: Design configuration
    - `layout_game.ts`: Game layout configuration
    - `layout_load.ts`: Load layout configuration
    - `layout.ts`: General layout configuration
    - `perspective.ts`: Perspective configuration
- **Communication**: Uses WebSockets to communicate with the server for real-time game updates

#### Server (Express + Socket.IO)
- **Purpose**: Backend services for both website and client
- **Key Components**:
  - `app.ts`: Main server application
  - `components/rest_api.ts`: REST API endpoints for the website
  - `components/game.ts`: Game logic and WebSocket handlers
  - `components/matchmaking.ts`: Matchmaking logic
  - `components/cards/`: Card-related logic and data
    - `action_pool.ts`: Action pool logic
    - `action_pool.test.ts`: Action pool tests
    - `card_profile.ts`: Card profile logic
    - `card_stack.ts`: Card stack logic
    - `card.ts`: Card logic
    - `collection/`: Card collection logic
    - `types/`: Card type logic
  - `components/persistence/`: Data persistence
    - `db_connector.ts`: Database connector
    - `db_credentials.ts`: Database credentials management
    - `db_dailies.ts`: Database dailies management
    - `db_decks.ts`: Database decks management
    - `db_items.ts`: Database items management
    - `db_magic_links.ts`: Database magic links management
    - `db_profiles.ts`: Database profiles management
  - `components/utils/`: Utility functions
    - `auth.ts`: Authentication utility
    - `helpers.ts`: Helper functions
    - `mailer.ts`: Mailer utility
- **Communication**:
  - REST API for website communication
  - WebSocket for real-time game communication with the client

### Data Flow and Communication

```
┌─────────────┐        ┌─────────────┐        ┌─────────────────────────────────┐
│             │        │             │        │                                 │
│   Website   │        │   Client    │        │             Server              │
│ (Angular)   │        │ (Phaser 3) │        │                                 │
│             │        │             │        │                                 │
└──────┬──────┘        └──────┬──────┘        └─────────────┬─────────────────┘
       │                      │                              │
       │ REST API             │ WebSocket                   │
       │                      │                              │
       ▼                      ▼                              ▼
┌─────────────┐        ┌─────────────┐        ┌─────────────────────────────────┐
│             │        │             │        │                                 │
│  User       │        │  Game       │        │  ┌─────────────────────────────┐  │
│ Management │        │  Logic      │        │  │                             │  │
│             │        │             │        │  │  Matchmaking & Game State    │  │
└─────────────┘        └─────────────┘        │  │                             │  │
                                               │  └─────────────────────────────┘  │
                                               └─────────────────────────────────┘
```

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

- **Item Management**:
  - `GET /api/item`: Get user's items
  - `POST /api/item/:itemId`: Use an item
  - `POST /api/buy/booster/:boosterNo`: Buy a booster pack

#### WebSocket Events

The server provides the following WebSocket events for the game client:

- **Matchmaking**:
  - `MsgTypeInbound.Login`: Login to matchmaking
  - `MsgTypeOutbound.Matchmaking`: Matchmaking status updates

- **Game**:
  - `MsgTypeInbound.Ready`: Player ready for game phase
  - `MsgTypeInbound.Disconnect`: Player disconnected
  - `MsgTypeInbound.Handcard`: Play a hand card
  - `MsgTypeInbound.Retract`: Retract a card
  - `MsgTypeInbound.Discard`: Discard a card
  - `MsgTypeInbound.Attack`: Attack with a card
  - `MsgTypeOutbound.Matchmaking`: Matchmaking updates

1. **Website to Server**: The website communicates with the server using REST API endpoints for user management, deck configuration, and opponent search.

2. **Client to Server**: The game client communicates with the server using WebSockets for real-time game updates, including game state synchronization and matchmaking.

3. **Server Internal**: The server handles both REST API requests and WebSocket connections, managing game state, matchmaking, and data persistence.

## Developer Documentation

### Setup and Installation

#### Prerequisites
- Node.js (v16 or later)
- npm (v7 or later)
- Angular CLI (v16.1.1)

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
   - Set the environment variables for the database and mail service:
     - `DB_PASSWORD`: Database password
     - `MAIL_PASSWORD`: Mail service password (optional for development)

### Development Workflow

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

3. **Start the Client**:
   ```bash
   cd client
   npm run s
   ```

#### Building the Projects

1. **Build for Staging**:
   ```bash
   npm run build:staging
   ```

2. **Build for Production**:
   ```bash
   npm run build:prod
   ```

#### Code Quality

1. **Linting**:
   ```bash
   npm run lint
   ```

2. **Formatting**:
   ```bash
   npm run format
   ```

3. **Check**:
   ```bash
   npm run check
   ```

### Testing and Deployment

#### Running Tests

1. **Run Tests**:
   ```bash
   cd server
   npm run test
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

## Technologies and Frameworks

### Frontend

- **Angular**: Used for both the website and client applications.
- **Phaser 3**: Game framework used for the client to implement the card game logic and rendering.
- **TypeScript**: Primary language for frontend development.

### Backend

- **Express**: Web framework for handling REST API requests.
- **Socket.IO**: Library for real-time WebSocket communication between the client and server.
- **Node.js**: JavaScript runtime for the server.

### Development Tools

- **ESLint**: For linting and code quality.
- **Prettier**: For code formatting.
- **Jest**: For testing.

### Database

- **MariaDB**: Used for data persistence (as seen in `misc/outercolonies.sql`).

## Conclusion

This documentation provides a comprehensive overview of the Outer Colonies project, including its software architecture and developer documentation. For more detailed information, refer to the individual README files in each subproject directory.