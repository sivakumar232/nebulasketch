# NebulaSketch: Real-Time Multiplayer Drawing and Guessing Game

NebulaSketch is a full-stack, real-time multiplayer drawing game where players compete in Skribbl.io style word-guessing battles with live canvas synchronization, a custom game engine, real-time WebSocket communication, and Redis-backed session state.

The platform supports collaborative rooms with a complete game lifecycle: lobby waiting, word selection, timed drawing rounds with progressive hint reveals, live guessing, automatic scoring, and game-over leaderboards.

> Built to explore real-world backend engineering concepts such as real-time bidirectional communication, distributed state management, custom game engine design, event-driven canvas synchronization, and monorepo architecture with shared TypeScript packages.

---

## Deployment Status

> **Note:** The live deployment is currently paused to control cloud costs. The infrastructure can be spun up on demand via Docker Compose.

**Repository:** [https://github.com/your-username/nebulasketch](https://github.com/your-username/nebulasketch)

---

## Key Highlights

- Built a fully playable real-time multiplayer drawing game with synchronized canvas state across concurrent users
- Implemented a custom object-oriented game engine managing the full game lifecycle: lobby, word selection, timed drawing rounds, hint reveals, scoring, and game-over transitions
- Designed a Redis-first hot state architecture for ephemeral session data with 24-hour TTL and clean room lifecycle management
- Synchronized live canvas drawing across all players at up to 30fps using a throttled `draft_draw` event pipeline
- Implemented server-side word masking so non-drawers never receive the current word, even on reconnect
- Built automatic admin succession when the host disconnects, so games continue uninterrupted
- Applied Levenshtein distance for fuzzy close-guess detection, giving players a real-time "you are close!" feedback signal
- Architected as a Turborepo monorepo with three deployable apps sharing typed packages to eliminate interface drift across service boundaries
- Containerized each service with individual Dockerfiles for repeatable, environment-agnostic deployment

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js 15 Frontend                        │
│   Landing Page → Create/Join Room → /canvas/:roomId Game View   │
└──────────────┬────────────────────────────┬────────────────────-┘
               │ HTTP REST                  │ WebSocket (ws://)
               ▼                            ▼
┌──────────────────────┐      ┌─────────────────────────────────┐
│   HTTP Backend       │      │      WebSocket Server           │
│   Express :3001      │      │      ws :8080                   │
│                      │      │                                 │
│  POST /api/room/     │      │  In-memory connectedUsers[]     │
│  create              │      │  GameEngine (OOP state machine) │
│  GET  /api/room/:slug│      │  join_room, start_game,         │
│                      │      │  draw, draft_draw, chat,        │
│  JWT auth middleware │      │  pick_word, delete_shape        │
└──────────┬───────────┘      └────────────┬────────────────────┘
           │                               │
           └───────────────┬───────────────┘
                           │ hset / hget / expire / sadd
                           ▼
              ┌──────────────────────────┐
              │        Redis             │
              │                          │
              │  room:{slug}  → metadata │
              │  elements:{slug} → shapes│
              │  participants:{slug} → set│
              │  TTL: 24h (active rooms) │
              │  TTL: 60s (empty rooms)  │
              └──────────────────────────┘

              ┌──────────────────────────┐
              │     PostgreSQL (Prisma)  │
              │                          │
              │  Room, Canvas, Element   │
              │  (schema defined,        │
              │   persistence layer)     │
              └──────────────────────────┘
```

---

## Monorepo Structure

The project is organized as a Turborepo monorepo with `pnpm` workspaces.

```
nebulasketch/
├── apps/
│   ├── web/          # Next.js 15 frontend
│   ├── backend/      # Express HTTP API
│   └── ws-backend/   # WebSocket server + GameEngine
└── packages/
    ├── common/       # Shared TypeScript types (RoomGameData, etc.)
    ├── db/           # Prisma schema + generated client
    ├── backend-common/ # Shared config, JWT secret, Redis client
    ├── ui/           # Shared UI component stubs
    ├── eslint-config/ # Shared lint rules
    └── typescript-config/ # Shared tsconfig base
```

This structure means the `RoomGameData` type is defined once in `packages/common` and imported by both the WebSocket server and the frontend canvas hook — no duplicate interfaces, no version drift.

---

## Backend Services

### 1. HTTP Backend (`apps/backend`)

The HTTP backend is built with:

- Node.js + TypeScript
- Express.js
- JSON Web Tokens (`jsonwebtoken`)
- Zod (environment variable validation in `backend-common`)
- Redis (`ioredis`) via `@repo/backend-common`

#### Responsibilities

- Handles room creation requests and generates a unique nanoid slug
- Stores initial room metadata in Redis as a hash with a 24-hour TTL
- Exposes a GET endpoint to look up a room by slug before the WebSocket connection is established
- Provides a JWT auth middleware (`authMiddleware`) for protected routes
- Validates environment variables at startup using Zod, failing fast with clear error messages if `JWT_SECRET`, `PORT`, or `NODE_ENV` are missing or malformed

#### API Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/room/create` | Creates a new room, writes metadata to Redis, returns slug |
| `GET` | `/api/room/:slug` | Looks up a room by slug, returns status and metadata |
| `GET` | `/api/room/:roomId/shapes` | Returns all persisted shapes for a room from Redis |

---

### 2. WebSocket Server (`apps/ws-backend`)

The WebSocket server is built with:

- Node.js + TypeScript
- `ws` library (raw WebSocket, no Socket.io abstraction)
- Redis (`ioredis`) via `@repo/backend-common`
- `jsonwebtoken` for token verification on connection

#### Responsibilities

- Maintains an in-memory `connectedUsers[]` array tracking all active WebSocket connections with their `userId`, `name`, and which `rooms[]` they belong to
- Routes all incoming messages to the appropriate game logic based on `payload.type`
- Delegates the full game lifecycle to the `GameEngine` class
- Persists committed canvas shapes to Redis (`hset elements:{roomSlug}`)
- Manages admin ownership: reads and writes `adminId` to Redis; reassigns admin on disconnect if the host leaves
- Broadcasts a masked `game_state_update` to non-drawers, hiding `currentWord` so the word cannot be leaked via WebSocket inspection
- Cleans up Redis keys (with a 60-second shortened TTL) when a room becomes empty

#### Message Protocol

| Message Type | Direction | Description |
| --- | --- | --- |
| `join_room` | Client → Server | Registers user in room, triggers admin check, sends back `init_shapes` and current `game_state_update` |
| `start_game` | Client → Server | Host-only; delegates to `GameEngine.startGame()` with optional settings |
| `pick_word` | Client → Server | Drawer-only; delegates to `GameEngine.pickWord()` |
| `draw` | Client → Server | Committed shape; persisted to Redis and broadcast to room |
| `draft_draw` | Client → Server | Live stroke preview; broadcast to room but not persisted |
| `delete_shape` | Client → Server | Removes a shape from Redis and broadcasts deletion |
| `chat` | Client → Server | Runs through guess check; correct guesses are hidden from other guessers |
| `return_to_lobby` | Client → Server | Host-only; resets game state to lobby |
| `init_shapes` | Server → Client | Sent on join; delivers all persisted shapes for the room |
| `game_state_update` | Server → Client | Full game state snapshot; `currentWord` is nulled for non-drawers |
| `user_list_update` | Server → Client | Deduplicated list of connected users with names and current admin |
| `correct_guess` | Server → Client | Notifies room of a correct guess and broadcasts updated scores |
| `close_guess` | Server → Client | Notifies room when a guess is within Levenshtein distance 1–2 of the answer |
| `clear_canvas` | Server → Client | Emitted at the start of each turn; clears all shapes on all clients |

---

### 3. Game Engine (`apps/ws-backend/src/gameEngine.ts`)

The `GameEngine` is a self-contained TypeScript class injected with a `broadcast` callback. It has no direct dependency on WebSocket or Redis — making it fully testable in isolation.

The game engine is built with:

- Pure TypeScript, no external dependencies
- OOP class design with private state per room
- Timer management with `setTimeout` per game phase
- Levenshtein distance algorithm for fuzzy matching

#### Game State Machine

```
     ┌──────────┐
     │  lobby   │◄────────────────────────────────┐
     └────┬─────┘                                 │
          │ start_game (host, ≥2 players)          │
          ▼                                        │
     ┌──────────┐  3s countdown                   │
     │ starting │─────────────────────┐            │
     └──────────┘                     │            │
                                      ▼            │
                               ┌─────────────┐    │
                               │picking_word │    │
                               │ (10s timer) │    │
                               └──────┬──────┘    │
                                      │ word picked│ auto-picked
                                      ▼            │
                               ┌─────────────┐    │
                               │   drawing   │    │
                               │  (80s timer)│    │
                               │  hint @40s  │    │
                               │  hint @60s  │    │
                               └──────┬──────┘    │
                          all guessed │ time up    │
                                      ▼            │
                               ┌─────────────┐    │
                               │ round_over  │    │
                               │  (5s reveal)│    │
                               └──────┬──────┘    │
                           next turn  │  all rounds│
                                      │  complete  │
                               ┌──────┴──────┐    │
                               │  game_over  │────┘
                               └─────────────┘  return_to_lobby (host)
```

#### Scoring

- Correct guess: **300 points** for the guesser
- Drawer bonus: **+50 points** for each player who guesses correctly
- Scores are accumulated across all rounds and broadcast on every correct guess

#### Disconnect Handling

When a player disconnects mid-game:
- They are removed from `drawOrder`
- If they were the current drawer, the round ends immediately with a system chat message
- If fewer than 2 players remain in an active game, the game resets to lobby
- If the disconnected player was the admin, the next connected player is promoted

---

### 4. Frontend (`apps/web`)

The frontend is built with:

- Next.js 15 (App Router)
- React-Konva (canvas rendering engine)
- Tailwind CSS v4 + custom CSS design tokens
- Lucide React (icons)
- IBM Plex Mono + Space Grotesk (Google Fonts)

#### Responsibilities

- Guest identity management using browser `localStorage` via a React Context (`IdentityContext`)
- Room creation by calling the HTTP backend and navigating to `/canvas/:roomId`
- WebSocket connection lifecycle managed by `useWebSocket` hook, connecting on mount and disconnecting on unmount
- Canvas state managed by `useShapes` hook, which handles local shape mutations and broadcasts to peers
- Live draft sync: throttled to 30fps using `Date.now()` delta checks before each `draft_draw` emission
- Rendering all shape types (rect, ellipse, line, arrow, eraser) via React-Konva `<Stage>` and `<Layer>`
- Game UI overlays: word picker modal, "get ready" countdown, game-over leaderboard, and waiting-for-players screen
- Chat panel with real-time message feed, correct-guess notifications, and drawer chat lockout

#### Key Hooks

| Hook | Responsibility |
| --- | --- |
| `useWebSocket` | Opens WS connection, sends `join_room`, routes all incoming messages to a callback |
| `useShapes` | Manages local shape state, handles all WS message types, exposes drawing actions |
| `useGuestIdentity` | Reads/writes guest `name` and `guestId` from localStorage via context |
| `useWindowSize` | Provides responsive canvas dimensions |

---

## Canvas Drawing Flow

```
User mousedown on canvas
        │
        ▼
  startDrawing(x, y)
  ─ creates a local draft shape with a fresh UUID
  ─ setIsDrawing(true)
        │
   [mouse moves]
        │
        ▼
  updateDrawing(x, y)
  ─ updates draft dimensions locally
  ─ throttled draft_draw emitted to WS (~30fps)
  ─ remote peers render a live ghost stroke
        │
   [mouseup]
        │
        ▼
  finishDrawing(guestId)
  ─ validates minimum stroke size (abort if < 3px)
  ─ commits final shape to local shapes[]
  ─ sends { type: "draw", shape } to WS server
  ─ WS server persists shape to Redis hset
  ─ WS server broadcasts { type: "draw", shape } to all other room members
  ─ sends { type: "draft_draw", shape: null } to clear remote ghost
```

---

## Guess and Chat Flow

```
Player types a guess and submits
        │
        ▼
Frontend sends { type: "chat", text: guess }
        │
        ▼
WS Server receives the message
  ─ checks: is sender the drawer? → block (spoiler prevention)
  ─ passes to GameEngine.handleGuess()
        │
        ├─── Exact match (case-insensitive trim)
        │         │
        │         ▼
        │    Mark guesser in guessedCorrectly[]
        │    Add 300 points to guesser
        │    Add 50 bonus to drawer
        │    Broadcast { type: "correct_guess", scores }
        │    If all guessers done → endRound()
        │
        ├─── Close match (Levenshtein distance ≤ 2)
        │         │
        │         ▼
        │    Broadcast { type: "close_guess" } to room
        │    (guesser's text is NOT shown to room)
        │
        └─── Wrong guess
                  │
                  ▼
             Broadcast { type: "chat", text, name }
             (hidden from drawer to prevent spoilers)
```

---

## Redis State Schema

All runtime state lives in Redis. Keys use the room slug as the identifier.

| Key Pattern | Type | Contents | TTL |
| --- | --- | --- | --- |
| `room:{slug}` | Hash | `id`, `name`, `slug`, `adminId`, `status`, `createdAt` | 24h (active), 60s (empty) |
| `elements:{slug}` | Hash | `shapeId → JSON shape` (one field per shape) | 24h (active), 60s (empty) |
| `participants:{slug}` | Set | Guest names who have joined the room | 24h |

Shapes are stored as individual hash fields so a single `HSET` adds or updates one shape without rewriting the entire canvas — and a single `HDEL` removes exactly one shape.

---

## Data Flow: Joining a Room

```
1. User visits landing page, enters name
2. Clicks "Create Room" → POST /api/room/create
3. HTTP backend: nanoid(6) slug generated → hset room:{slug} in Redis → returns slug
4. Frontend navigates to /canvas/{slug}
5. useWebSocket: opens ws://{host}?token=guest&userId={guestId}
6. WS Server: verifies token, adds to connectedUsers[], sets up user record
7. Frontend sends { type: "join_room", roomId: slug, guestName }
8. WS Server:
   a. Admin check: if no admin or admin is offline → this user becomes admin
   b. redis.expire room, elements, participants keys → reset TTL
   c. redis.sadd participants → adds name to set
   d. broadcastUserList() → sends user_list_update to all in room
   e. loadShapesForRoom() → sends init_shapes with all persisted shapes
   f. gameEngine.getRoom() → sends game_state_update with current game phase
9. Canvas renders existing shapes; lobby overlay shown if game hasn't started
```

---

## Tech Stack

| Category | Technology |
| --- | --- |
| **Frontend** | Next.js 15, React, TypeScript, Tailwind CSS v4, React-Konva |
| **HTTP Backend** | Node.js, Express.js, TypeScript |
| **WebSocket Server** | Node.js, `ws` library, TypeScript |
| **Game Engine** | Custom OOP TypeScript class (no external deps) |
| **Hot State (Session)** | Redis (hashes, sets, TTL) via `ioredis` |
| **Cold State (Schema)** | PostgreSQL via Prisma ORM |
| **Monorepo Tooling** | Turborepo, pnpm workspaces |
| **Config Validation** | Zod (env schema validation at startup) |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`) |
| **Icons** | Lucide React |
| **Containerization** | Docker (individual Dockerfiles per app) |
| **Dev Orchestration** | Docker Compose (Redis) |

---

## Core Features

### Game Features

- No-login guest identity: name stored in `localStorage`, unique `guestId` generated per device
- Instant room creation with a 6-character nanoid slug
- Shareable room URL: paste the link to invite players
- Lobby waiting room with live player list; game cannot start with fewer than 2 players
- Customizable round count (admin selects 1–5 rounds before starting)
- 3-second animated countdown before the first turn
- Drawer selects from 3 random words with a 10-second timer; auto-picks if no selection
- 80-second drawing round with two progressive hint reveals (at 40s and 60s)
- Automatic round end when all guessers answer correctly
- 5-second round reveal phase showing the correct word
- Game-over leaderboard with animated first-place highlight
- Host can restart the game from the leaderboard screen

### Canvas Features

- Freehand pen drawing with configurable stroke width (S / M / L / XL)
- Rectangle and ellipse shape tools
- Eraser tool using `globalCompositeOperation: destination-out`
- Select tool with drag-to-reposition and resize handles (Konva Transformer)
- 10-color palette + live color preview swatch
- Live stroke preview broadcast to all spectators at ~30fps (throttled)
- Canvas cleared automatically at the start of each turn
- All committed shapes persisted to Redis and restored on reconnect or page refresh

### Security and Access Control

- Server-side word masking: `currentWord` is set to `null` in the `game_state_update` payload before broadcasting to non-drawers
- Only the drawer can emit `draw` and `draft_draw` events during an active round; all others are silently dropped
- Only the host (admin) can emit `start_game` and `return_to_lobby`; non-admin attempts return an error message
- Chat is blocked for the drawer during drawing phase to prevent accidental spoilers
- Correct guesses are hidden from other players (only the guesser and a system notification are shown)
- JWT middleware available on HTTP routes for protected endpoints

---

## Environment Variables

### HTTP Backend (`apps/backend/.env`)

```env
JWT_SECRET=          # Min 32 chars — validated by Zod at startup
PORT=3001
NODE_ENV=development
DATABASE_URL=        # PostgreSQL connection string (Prisma)
REDIS_URL=           # Redis connection string
```

### WebSocket Backend (reads from `apps/backend/.env` via `backend-common`)

```env
JWT_SECRET=          # Shared with HTTP backend via @repo/backend-common
REDIS_URL=           # Redis connection
```

### Frontend (`apps/web/.env`)

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:8080
```

---

## Local Development

### Prerequisites

- Node.js ≥ 18
- pnpm 9
- Docker (for Redis)

### Setup

```bash
# Clone the repository
git clone https://github.com/your-username/nebulasketch.git
cd nebulasketch/draw-app

# Install all workspace dependencies
pnpm install

# Start Redis via Docker Compose
docker compose up -d

# Copy environment files
cp apps/backend/.env.example apps/backend/.env
cp apps/web/.env.example apps/web/.env
# Edit each .env file with your values

# Run all services concurrently (Turborepo)
pnpm dev
```

This starts:
- `apps/web` → Next.js dev server at `http://localhost:3000`
- `apps/backend` → Express API at `http://localhost:3001`
- `apps/ws-backend` → WebSocket server at `ws://localhost:8080`

---

## How the Monorepo Shared Packages Work

### `packages/backend-common`

Shared between the HTTP backend and the WebSocket server. Contains:
- `config.ts`: Loads and validates the `.env` file using Zod. Traverses the directory tree upward to find `pnpm-workspace.yaml` (the monorepo root), then loads `apps/backend/.env` using an absolute path. This ensures both apps read from the same config file regardless of their working directory.
- `redis.ts`: Exports a single shared `ioredis` client instance.

### `packages/common`

Shared between all apps and packages. Contains:
- `types.ts`: The `RoomGameData` interface used by the game engine, the WS server, and the frontend canvas hook. One definition, zero drift.

### `packages/db`

Contains the Prisma schema and generated client. Currently defines `Room`, `Canvas`, and `Element` models backed by PostgreSQL. The schema is the persistence foundation for durable room history and element storage.

---

## Design Decisions

### Why Redis as the primary state store?

Game sessions are short-lived and require sub-millisecond read/write latency. Redis hash operations (`HSET`, `HGET`, `HGETALL`) perfectly match the shape-per-field storage model: adding one shape is a single `HSET` and deleting one is a single `HDEL` — no full-document rewrites. The 24-hour TTL ensures rooms expire automatically without a cleanup job, and the 60-second shortened TTL on empty rooms reclaims memory quickly.

### Why a raw `ws` library instead of Socket.io?

Using the bare `ws` library provides full control over the connection lifecycle and message protocol with zero magic. It also keeps the WebSocket server dependency surface minimal. The tradeoff — no built-in reconnection, rooms, or broadcasting abstractions — is intentional, because those concepts are implemented explicitly in the game engine and connection manager, making the architecture easier to reason about and debug.

### Why a custom game engine class instead of a state machine library?

The `GameEngine` class is instantiated once at server start and manages all rooms via a `Map<string, RoomGameData>`. It receives a `broadcast` callback at construction time and has no knowledge of WebSocket connections or Redis — making it fully unit-testable. The state machine logic is explicit TypeScript with clear state transitions, which is easier to trace in a debugger than an opaque library's internals.

### Why Turborepo?

With three deployable services sharing types, config, and the database client, code duplication across apps would inevitably cause interface drift (a type changed in one place but not another). Turborepo with pnpm workspaces makes cross-package imports (`@repo/common`, `@repo/backend-common`) first-class, and `turbo run dev` starts all services in parallel with dependency-aware caching.

---

## Known Limitations and Planned Improvements

- **No WebSocket reconnection:** If a user's connection drops, they must refresh the page. Adding exponential backoff reconnection with state restoration would significantly improve reliability.
- **Single WebSocket server instance:** The `connectedUsers[]` array is in-process memory. A second WS pod would not share room state. The fix is Redis Pub/Sub: each pod subscribes to per-room channels and forwards messages to its local connections.
- **No persistent user accounts:** Guest identity is `localStorage`-only. Adding authentication (JWT + PostgreSQL `User` table) would enable persistent scores, match history, and friend systems.
- **PostgreSQL not wired to runtime:** The Prisma schema for `Room`, `Canvas`, and `Element` is defined but the runtime writes only to Redis. Wiring Postgres would add durability to game results and room history.
- **Fixed word bank:** The current word bank is a small static list. A custom word pack feature (host pastes a comma-separated list) would extend game depth significantly.
- **No CI/CD pipeline:** There are no GitHub Actions workflows for type-checking, linting, or building on push.
