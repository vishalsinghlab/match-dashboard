# Match Dashboard — Real-Time Sports Score Frontend

An Angular 19 single-page web application featuring live match score streaming, sports fixture filtering, and an admin control panel for real-time WebSocket settings.

## Features

- **User Dashboard**:
  - Live match list with sport filtering (Cricket, Football, Basketball, Tennis, Esports) and real-time status badges (`LIVE`, `UPCOMING`, `COMPLETED`).
  - Live Match Details page connecting to dedicated Socket.IO rooms (`match:<matchId>`) with zero-latency score and telemetry updates.
- **Admin Control Panel**:
  - Match fixture creation form with reactive validation.
  - Global Socket Settings modal to adjust streaming frequency, telemetry modes (`SCORE`, `FULL`, `STATISTICS`), and binary/compression switches.
  - Per-match override configuration modals with instant Redis pub/sub broadcasting.
- **Real-Time Engine**:
  - Encapsulated Socket.IO client service with MessagePack binary payload decoding (`@msgpack/msgpack`).
- **Reactive State**:
  - Built using Angular 19 Signals (`signal()`, `computed()`) for fine-grained reactivity.

## Tech Stack

- **Framework**: Angular 19 (Standalone Components, Signals, Reactive Forms, Router)
- **Real-Time Client**: Socket.IO Client (`socket.io-client`)
- **Binary Serialization**: `@msgpack/msgpack`
- **Iconography**: FontAwesome 6+

## Project Structure

```text
src/app/
├── core/
│   ├── guards/
│   │   └── auth.guard.ts           # Route protection for admin/user paths
│   └── services/
│       ├── auth.ts                 # Authentication, user signals & cookie session sync
│       ├── match.ts                # REST API client for match fixtures & admin settings
│       └── realtime.ts             # Socket.IO client wrapper & MessagePack decoder
└── features/
    ├── admin/
    │   └── matches/                # Admin fixture management & socket config modals
    ├── auth/                       # Login & authentication view
    └── user/
        ├── matches/                # Public match list & status filter view
        └── match-details/          # Live match score telemetry view
```

## Quick Start

### 1. Requirements
* Node.js 20+
* Backend API running at `http://localhost:3000`

### 2. Installation & Running
```bash
# Install dependencies
npm install

# Start local dev server
npm start
# or: ng serve
```

Navigate to `http://localhost:4200/`. The app will automatically reload on source changes.

### 3. Default Accounts
- **Admin**: `admin` / `admin123`
- **User**: `user` / `password123`

---

## Build & Test Scripts

```bash
# Build production bundle
npm run build

# Run unit tests (Vitest)
npm run test
```

## Backend API & WebSocket Integration

- **REST API Base**: `http://localhost:3000/api`
- **WebSocket Host**: `ws://localhost:3000` (`transports: ['websocket']`, `withCredentials: true`)
