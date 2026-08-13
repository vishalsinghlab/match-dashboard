# Match Dashboard — Frontend Technical & User Documentation

Welcome to the official frontend technical and user documentation for **Match Dashboard**.

---

## 1. Executive Summary & Overview

**Match Dashboard** is a modern single-page application built with **Angular 19** and **TypeScript**. It serves as the primary client interface for the **Match Realtime** ecosystem, catering to two distinct user personas:

1. **End Users**: Browse live/upcoming sports fixtures and view real-time live match scores with zero page refreshes.
2. **Administrators**: Configure dynamic WebSocket telemetry settings (intervals, data payloads, binary toggles) globally or on a per-fixture basis.

---

## 2. Technical Stack & Architecture

- **Web Framework**: Angular 19 (Standalone Components, Reactive Forms, Signals, Router)
- **State Management**: Angular Signals (`signal()`, `computed()`, `effect()`)
- **Realtime Gateway Client**: Socket.IO Client (`socket.io-client` v4)
- **Binary Deserializer**: `@msgpack/msgpack`
- **UI Styling & Utilities**: Custom CSS Variables (Design System), FontAwesome 6+ icons

---

## 3. Application Portals & User Workflows

### 3.1 User Portal

#### Matches Hub (`/user/matches`)
- **Live Fixtures Grid**: Displays live, upcoming, and completed sports matches.
- **Sport Category Filters**: Filter fixtures by sport type (Cricket, Football, Basketball, Tennis, Esports).
- **Status Badges**: Visual indicators (`LIVE`, `UPCOMING`, `FINISHED`) with animated pulse dots for active feeds.

#### Match Details View (`/user/matches/:matchId`)
- **Dynamic Socket Subscription**: On page load, connects to `ws://localhost:3000` with `withCredentials: true` (sending session cookies).
- **Room Subscriptions**: Emits `match:join` for the selected match ID.
- **Binary Stream Decoding**: Receives binary frames (`Uint8Array`) on `match:update`, decodes them via `@msgpack/msgpack`, and updates signal states in real time.
- **Connection Health Badge**: Shows live Socket connection state (`Connected`, `Disconnected`, `Reconnecting`).

---

### 3.2 Admin Control Center (`/admin/matches`)

#### Fixture Management
- **Create Fixture Modal**: Form to create new sports match fixtures with date/time pickers and team selection.

#### Global Socket Settings Control
- **Global Defaults Modal**: Allows admins to configure backend streaming defaults:
  - **Stream Interval**: Update frequency in milliseconds (e.g. `3000ms`, `5000ms`).
  - **Data Payload Type**: Choose between `SCORE` (minimal), `FULL` (score + venue), or `STATISTICS` (full telemetry).
  - **Binary & Compression Toggles**: Enable/disable MessagePack and Brotli compression.

#### Per-Fixture Stream Configuration Overrides
- **Fixture Setting Modal**: Override global defaults for specific high-priority matches.
  - Enable **Per-Fixture Override**.
  - Set custom update interval (e.g., `5000ms` / 5 seconds).
  - Click **Save & Broadcast Settings** to emit an instant `config:updated` signal over Redis Pub/Sub without server or client restarts!

---

## 4. Architectural Highlights & Data Handling

### 4.1 Cookie Authentication Sync
Authentication state is managed by `AuthService` ([auth.ts](file:///c:/Users/user/Desktop/match-realtime-app/frontend/match-dashboard/src/app/core/services/auth.ts)):
- When a user logs in, the backend sends an `HttpOnly` `session` cookie.
- `RealtimeService` ([realtime.ts](file:///c:/Users/user/Desktop/match-realtime-app/frontend/match-dashboard/src/app/core/services/realtime.ts)) initializes Socket.IO with `withCredentials: true`.
- The browser automatically passes the auth cookie during the WebSocket handshake header.

### 4.2 Binary MessagePack Decoding Pipeline
```text
Socket Server (Binary Uint8Array) ──► RealtimeService (onMatchUpdate) ──► `@msgpack/msgpack` decode() ──► Angular Signal state update ──► UI Renders Live Score
```

---

## 5. Codebase Directory Structure

```text
src/app/
├── app.config.ts                   # Application providers (Router, HttpClient)
├── app.routes.ts                   # Role-gated route definitions
├── app.ts                          # Root component
├── core/
│   ├── guards/
│   │   └── auth.guard.ts           # Route guards for ADMIN & USER roles
│   └── services/
│       ├── auth.ts                 # Login/logout & session signals
│       ├── match.ts                # REST API HTTP client
│       └── realtime.ts             # Socket.IO client & MessagePack decoder
└── features/
    ├── admin/
    │   └── matches/                # Admin fixture management & setting modals
    ├── auth/
    │   └── login/                  # Login view
    └── user/
        ├── matches/                # User fixture hub view
        └── match-details/          # Live match score telemetry view
```

---

## 6. Local Setup, Build & Testing Guide

### Prerequisites
- Node.js 20+
- Backend API running on `http://localhost:3000`

### Running Development Server
```bash
# Install dependencies
npm install

# Start Angular local server
npm start
# or: ng serve
```
Open your browser at `http://localhost:4200/`.

### Default Credentials
- **Admin**: `admin` / `admin123`
- **User**: `user` / `password123`

### Production Build & Unit Testing
```bash
# Build optimized production bundle
npm run build

# Run unit tests (Vitest)
npm run test
```
