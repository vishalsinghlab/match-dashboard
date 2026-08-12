# Real-Time Match Platform — Build Specification

## 1. Overview

A web application with two surfaces — an **admin panel** and a **user panel** — connected by a real-time layer. Admins configure what socket data gets served; users see a live match list and live match-detail pages. All data is authenticated via cookies and delivered over WebSockets in compressed binary form, fanned out through Redis pub/sub, on a microservice backend.

**Core pieces to build:**
1. Auth service (cookie-based sessions)
2. Admin service (dynamic socket/match settings)
3. Match service (match list + metadata)
4. Socket gateway service (WebSocket connections, cookie auth, binary/compressed payloads)
5. Publisher/worker service (feeds data into Redis)
6. Redis (pub/sub broker, optionally session store)
7. Database (users, settings, match metadata)
8. Frontend (admin panel, user panel, match-list page, match-detail page)

---

## 2. System Architecture

```
                        ┌────────────────────────┐
                        │      Client web app     │
                        │  User panel + Admin panel│
                        └───────────┬─────────────┘
                                    │ HTTPS (cookie attached)
                                    ▼
                        ┌────────────────────────┐
                        │      API gateway         │
                        │ Routes requests, checks   │
                        │ cookie on every call      │
                        └───┬───────────┬─────────┬─┘
                            │           │         │
                 ┌──────────▼───┐ ┌─────▼──────┐ ┌─▼────────────┐
                 │ Auth service │ │Admin service│ │ Match service │
                 │ Login,       │ │ Dynamic     │ │ List + match   │
                 │ sessions,    │ │ socket      │ │ metadata        │
                 │ cookies      │ │ settings    │ │                 │
                 └──────┬───────┘ └──────┬──────┘ └───────┬─────────┘
                        │                │                │
                        └────────────────┼────────────────┘
                                         ▼
                                 ┌───────────────┐
                                 │   Database     │
                                 │ Users, settings,│
                                 │ match metadata  │
                                 └───────────────┘


        Real-time layer (parallel to the above):

┌────────────┐   WS handshake    ┌────────────────┐   subscribe   ┌───────────────┐   publish   ┌────────────┐
│   Client    │ ───+ cookie────▶ │ Socket gateway  │ ─────────────▶│ Redis pub/sub │◀────────────│  Publisher  │
│ list/detail │                  │ Validates cookie,│               │ Per-match      │             │  (worker)   │
│    page     │◀── binary push ──│ subscribes,      │               │ channels       │             │             │
└────────────┘   (compressed)    │ compresses out    │              └───────────────┘             └────────────┘
                                  └────────────────┘
```

---

## 3. Services — What Each One Needs

### 3.1 Auth Service
- `POST /login` — validate credentials, create session, set cookie
- `POST /logout` — invalidate session, clear cookie
- `GET /me` — return current user from cookie (for frontend bootstrapping)
- Internal `validate(cookie)` function/endpoint that other services (especially the socket gateway) call to verify a session
- **Cookie settings:** `httpOnly`, `secure`, `sameSite=Lax` (or `strict`), reasonable expiry, rotate on privilege change
- Session storage: Redis (fast lookups, natural TTL) or DB — Redis is preferable given you're already running it
- Decide: raw session ID (opaque, looked up in Redis) vs signed JWT (self-verifying, no lookup needed but harder to revoke). For a system with an admin who can change settings live, a lookup-based session is usually easier to reason about (instant revocation).

### 3.2 Admin Service
- CRUD endpoints for socket/match configuration (e.g. which channels are active, what fields are broadcast, per-match overrides, refresh intervals)
- All writes must be **admin-authenticated** (role check on top of cookie auth)
- On every config change, publish a `config-updated` event to a Redis channel so live socket gateway instances can hot-reload without a restart
- Persist configuration to the database (source of truth); Redis event is just the "wake up and re-read" signal

### 3.3 Match Service
- `GET /matches` — list matches (paginated/filterable as needed)
- `GET /matches/:id` — match metadata/detail
- Plain REST, cookie-authenticated like any normal API — no socket logic here

### 3.4 Socket Gateway Service (core new component)
- Accepts WebSocket upgrade requests
- Reads the cookie from the handshake request headers (browsers send it automatically on same-origin WS connections)
- Calls the Auth service (or verifies a local signed token) to validate the session **before** completing the upgrade; reject with 401/403 if invalid
- On the **match-list page**: subscribes the client to one or more general Redis channels, driven by the admin's dynamic configuration
- On the **match-detail page**: subscribes to a match-specific channel, e.g. `match:{matchId}`
- Serializes outbound messages as **binary + compressed**:
  - Serialize with MessagePack or Protocol Buffers (both far more compact than JSON, and binary by nature)
  - Optionally deflate/gzip on top if payloads are large and repetitive
  - Send as WebSocket binary frames, not text frames
- Must be **stateless/horizontally scalable** — any gateway instance should be able to serve any client, because Redis (not local memory) is the shared source of truth for both config and live data. This lets you run multiple gateway instances behind a load balancer.
- Handle disconnect/reconnect cleanly: unsubscribe from Redis channels when a client disconnects, resubscribe on reconnect, and re-validate the cookie on every reconnect (don't just trust the first handshake forever)

### 3.5 Publisher / Worker Service
- Whatever produces match data — a live feed integration, a simulator, or a sample-data generator for now
- Publishes updates to the relevant Redis channel(s) (`match:{id}`, or a general `matches` channel for the list view)
- Should also be able to react to `config-updated` events from the Admin service if the shape/frequency of published data depends on admin settings

### 3.6 Redis
- **Pub/sub broker**: connects publisher → socket gateway instances
- **Session store** (optional but recommended): fast cookie validation without hitting the database on every socket connect
- **Config-change signal**: admin service publishes here, gateway subscribes

### 3.7 Database
- Users/credentials table
- Admin settings/configuration table
- Match metadata table
- Standard relational DB (Postgres) is a safe default; use whatever the team already runs

### 3.8 Frontend
- **Admin panel**: settings form(s) for socket/match configuration, calling the Admin service
- **User panel — match list**: initial REST call to Match service for the list, then a WebSocket connection for live updates (scores, status changes, etc.)
- **User panel — match detail**: on mount, opens a second WebSocket scoped to that match ID; closes it cleanly on unmount/navigation away
- Both socket connections must handle: connect, auth failure, disconnect, and reconnect states gracefully in the UI

---

## 4. Socket Authentication Flow (Detail)

1. User logs in via the Auth service → receives an `httpOnly`, `secure` cookie
2. Every subsequent HTTP request automatically carries this cookie (handled by the browser)
3. When the frontend opens a WebSocket connection, the browser **also sends cookies** on the upgrade request automatically (same-origin) — you don't need to manually attach a token
4. The Socket gateway, on receiving the upgrade request:
   - Extracts the cookie from the request headers
   - Validates it against the Auth service / session store
   - If valid → completes the WS handshake, subscribes the client to the appropriate Redis channel(s)
   - If invalid/missing → rejects the upgrade (close with 401/403-equivalent close code)
5. On logout, the Auth service invalidates the session; the gateway should detect this (e.g. periodic re-check, or a "session revoked" pub/sub event) and force-disconnect any open sockets tied to that session
6. On reconnect (network drop, tab refocus), repeat validation — don't assume a previously-valid connection stays valid indefinitely

**Things to decide early:**
- Session lookup vs JWT (affects how "instant" logout/revocation can be)
- Cookie `sameSite` policy vs any cross-origin needs (if the socket gateway is on a different subdomain than the main app, this gets trickier — same-origin keeps things simple)
- Reconnection/backoff strategy on the client

---

## 5. Redis Channel Naming (Suggested)

| Purpose | Channel pattern |
|---|---|
| Match list updates | `matches:list` |
| Single match live data | `match:{matchId}` |
| Admin config change signal | `config:updated` |
| Session revocation signal (optional) | `session:revoked:{sessionId}` |

---

## 6. Suggested Binary/Compression Approach

- **Serialization:** MessagePack (simpler to adopt, good language support) or Protocol Buffers (stricter schema, slightly more setup, best for cross-service consistency)
- **Compression:** only add gzip/deflate on top if payloads are large/repetitive enough to benefit — for small frequent match-update messages, serialization format alone (msgpack/protobuf) may already be sufficient and adding compression overhead per small frame can cost more than it saves. Benchmark before committing.
- **Transport:** WebSocket **binary frames**, not text/JSON frames

---

## 7. Suggested Build Order (Phases)

1. **Foundation:** Auth service + cookie sessions + DB schema for users
2. **Core REST:** Match service (list/detail) + Admin service (settings CRUD), gated behind cookie auth
3. **Redis wiring:** stand up Redis, get a simple publisher pushing sample JSON data into a channel
4. **Socket gateway v1:** WS connection + cookie validation + Redis subscribe + JSON payloads (prove the real-time path works end-to-end)
5. **Binary/compression pass:** swap JSON payloads for MessagePack/Protobuf binary frames
6. **Admin-driven dynamic config:** wire `config-updated` events so admin changes affect live socket behavior without redeploy
7. **Frontend integration:** match list + match detail pages consuming the sockets, with reconnect/error handling
8. **Scaling/hardening:** multiple gateway instances behind a load balancer, session revocation on logout, monitoring/logging on socket connect/disconnect rates

---

