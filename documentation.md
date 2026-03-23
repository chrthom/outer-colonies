# Outer Colonies - Software Architecture and Developer Documentation

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
  - `components/`: Reusable UI components
- **Communication**: Uses REST API to communicate with the server

#### Client (Phaser 3)
- **Purpose**: Actual card game implementation with game logic and rendering
- **Key Components**:
  - `app.component.ts`: Main game component
  - `scenes/`: Different game scenes (menus, gameplay, etc.)
  - `components/`: Game-specific components
  - `config/`: Game configuration
- **Communication**: Uses WebSockets to communicate with the server for real-time game updates

#### Server (Express + Socket.IO)
- **Purpose**: Backend services for both website and client
- **Key Components**:
  - `app.ts`: Main server application
  - `components/rest_api.ts`: REST API endpoints for the website
  - `components/game.ts`: Game logic and WebSocket handlers
  - `components/matchmaking.ts`: Matchmaking logic
  - `components/cards/`: Card-related logic and data
  - `components/persistence/`: Data persistence
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

### Development Workflow

#### Running the Projects

1. **Start the Server**:
   ```bash
   cd server
   npm start
   ```

2. **Start the Website**:
   ```bash
   cd website
   ng serve
   ```

3. **Start the Client**:
   ```bash
   cd client
   ng serve
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

3. **Type Checking**:
   ```bash
   npm run check
   ```

### Testing and Deployment

#### Running Tests

1. **Run Tests**:
   ```bash
   npm test
   ```

#### Deployment

1. **Deploy Server**:
   - Delete all files and directories on the target environment under `server`.
   - Upload the built zip file to the target environment under `server`.
   - Unzip the archive on the target environment.
   - Restart the `outercolonies_server` container.

2. **Deploy Client**:
   - Delete all files and directories on the target environment under `client`.
   - Upload the built zip file to the target environment under `client`.
   - Unzip the archive on the target environment.

3. **Deploy Website**:
   - Delete all files and directories on the target environment under `website`.
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

- **SQL**: Used for data persistence (as seen in `misc/outercolonies.sql`).

## Conclusion

This documentation provides a comprehensive overview of the Outer Colonies project, including its software architecture and developer documentation. For more detailed information, refer to the individual README files in each subproject directory.