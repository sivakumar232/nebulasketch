# NebulaSketch - System Architecture

## Overview

NebulaSketch is a real-time collaborative drawing game (like Skribbl.io) built with a monorepo architecture. Players join rooms, take turns drawing words, and others guess what's being drawn.

## Technology Stack

**Frontend:** Next.js 16 (React 19) + Konva.js + Tailwind CSS + Zustand  
**Backend API:** Express.js + TypeScript  
**WebSocket:** ws library + Custom Game Engine  
**Data:** Redis (primary) + PostgreSQL (minimal, via Prisma)  
**Monorepo:** Turborepo + pnpm

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (Next.js)                                     │
│  - Canvas rendering (Konva)                             │
│  - Real-time UI updates                                 │
│  - State management (useShapes hook)                    │
└────────────────┬────────────────────────────────────────┘
                 │
        HTTP     │     WebSocket
                 │
┌────────────────┴────────────────┬───────────────────────┐
│  REST API (Express)             │  WebSocket Server     │
│  Port: 3001                     │  Port: 8080           │
│  - Room creation                │  - Real-time drawing  │
│  - Shape retrieval              │  - Game engine        │
└─────────────────────────────────┴───────────────────────┘
                 │
                 │
┌────────────────┴────────────────────────────────────────┐
│  Data Layer                                             │
│  Redis (cache, TTL) + PostgreSQL (future persistence)  │
└─────────────────────────────────────────────────────────┘
```

## Project Structure

```
draw-app/
├── apps/
│   ├── backend/              # REST API (Express)
│   │   └── src/
│   │       ├── room/         # Room CRUD
│   │       ├── middlewares/  # Auth, validation
│   │       └── index.ts      # Server entry
│   │
│   ├── ws-backend/           # WebSocket server
│   │   └── src/
│   │       ├── gameEngine.ts # Game logic
│   │       ├── words.ts      # Word bank
│   │       └── index.ts      # WS server
│   │
│   └── web/                  # Next.js frontend
│       └── app/
│           ├── canvas/[roomId]/  # Canvas page
│           ├── components/       # UI components
│           ├── hooks/            # useWebSocket, etc.
│           └── providers/        # IdentityContext
│
└── packages/
    ├── backend-common/       # Shared config, Redis
    ├── common/               # Shared types, validation
    └── db/                   # Prisma schema
```

## Core Components

### 1. Frontend (apps/web)

**Canvas.tsx** - Main drawing interface
- Konva Stage for rendering shapes
- Mouse event handling (draw, select, transform)
- Game state overlays (waiting, word selection, game over)
- Chat interface and player list

**useShapes.tsx** - State management hook
- Manages shapes array and drawing state
- WebSocket message handling
- Optimistic updates for smooth UX
- Live draft synchronization (throttled to 30fps)

**useWebSocket.ts** - WebSocket connection
- Establishes connection with guest credentials
- Handles reconnection
- Message sending/receiving

**IdentityContext.tsx** - Guest identity
- Generates unique guest ID (stored in localStorage)
- Manages guest name
- Provides identity to all components

### 2. REST API (apps/backend)

**Endpoints:**
- `POST /api/room/create` - Create room with unique slug (nanoid)
- `GET /api/room/:slug` - Get room data
- `GET /api/room/:slug/shapes` - Get all shapes

**Room Service:**
- Generates 6-character slugs
- Stores rooms in Redis with 24h TTL
- Returns room metadata

### 3. WebSocket Server (apps/ws-backend)

**Connection Management:**
```typescript
interface User {
  ws: WebSocket;
  userId: string;
  name: string;
  rooms: string[];
}
```

**Message Types (Client → Server):**
- `join_room` - Join room, load shapes
- `start_game` - Admin starts game (requires 2+ players)
- `pick_word` - Drawer selects word
- `chat` - Send message or guess
- `draw` - Finalize shape (persisted)
- `draft_draw` - Live preview (not persisted)
- `delete_shape` - Remove shape
- `return_to_lobby` - Admin resets game

**Message Types (Server → Client):**
- `user_list_update` - User join/leave, admin info
- `init_shapes` - All shapes on join
- `game_state_update` - Game state changes
- `draw` / `draft_draw` / `delete_shape` - Shape updates
- `chat` - Chat messages
- `correct_guess` / `close_guess` - Guess feedback
- `clear_canvas` - Clear all shapes

**GameEngine.ts** - Game logic
```typescript
interface RoomGameData {
  state: "lobby" | "starting" | "picking_word" | "drawing" | "round_over" | "game_over";
  round: number;
  maxRounds: number;
  drawOrder: string[];        // Shuffled players
  currentDrawerId: string;
  wordOptions: string[];      // 3 random words
  currentWord: string;
  wordHint: string;           // "e_e_h_nt"
  timerEndsAt: number;
  scores: Record<string, number>;
  guessedCorrectly: string[];
}
```

**Game Flow:**
1. LOBBY → Admin clicks start
2. STARTING → 3s countdown
3. PICKING_WORD → Drawer picks word (10s timeout)
4. DRAWING → 80s round, hints at 50% and 25% time
5. ROUND_OVER → 5s reveal
6. Next drawer or GAME_OVER

**Scoring:**
- Correct guess: 300 points
- Drawer bonus: 50 points per correct guess
- Close guess: Visual feedback only

### 4. Data Storage

**Redis (Primary Storage):**
```
room:{slug}           → Hash (id, name, adminId, status) [24h TTL]
elements:{roomSlug}   → Hash (shapeId → JSON shape) [24h TTL]
participants:{roomSlug} → Set (guest names) [24h TTL]
```

**PostgreSQL (Minimal Usage):**
```prisma
Room { id, slug, name, adminId, status, canvas }
Canvas { id, roomId, elements }
Element { id, canvasId, type, data, createdBy }
```

## Data Flow Examples

### Room Creation
```
User → Frontend → POST /api/room/create → Backend
  → Generate slug (nanoid)
  → Store in Redis (24h TTL)
  → Return slug
  → Frontend navigates to /canvas/{slug}
```

### Drawing Flow
```
User draws → startDrawing() → Local draft state
  → Mouse move → updateDrawing() → Update draft
  → useEffect throttles → Send draft_draw (30fps) → Server broadcasts
  → Other users see live preview in remoteDrafts

User releases → finishDrawing() → Add to local shapes (optimistic)
  → Send draw message → Server persists to Redis
  → Server broadcasts → Other users add shape
```

### Guessing Flow
```
Player types → Send chat message → Server checks if drawer (blocked)
  → GameEngine.handleGuess()
  → Compare to currentWord (case-insensitive)
  → If correct: Award points, broadcast correct_guess
  → If close (Levenshtein ≤2): Broadcast close_guess
  → If wrong: Broadcast as chat
```

## Key Features

**Real-time Collaboration:**
- Live drawing previews (draft_draw messages)
- Optimistic updates for smooth UX
- Automatic admin succession on disconnect

**Game Mechanics:**
- Turn-based drawing
- Word selection from 3 options
- Progressive hints (reveal letters over time)
- Scoring system with leaderboard
- Round and game management

**Room Management:**
- Unique 6-character slugs
- 24h TTL with automatic cleanup
- Admin controls (start game, return to lobby)
- Minimum 2 players to start

**Drawing Tools:**
- Pen/Line tool
- Eraser tool
- Selection and transformation
- Color picker (10 colors)
- Stroke width (4 sizes)

## Performance Optimizations

1. **Throttling:** Draft updates limited to 30fps
2. **Optimistic Updates:** UI updates before server confirmation
3. **Redis Caching:** Fast in-memory storage with TTL
4. **Efficient Broadcasting:** Only send to users in same room
5. **Connection Cleanup:** Remove stale connections automatically

## Security

**Current:**
- Guest-based authentication (no accounts)
- Guest ID in localStorage
- Admin permission checks
- Room membership verification
- Input validation with Zod

**Future:**
- JWT user authentication
- Private rooms with passwords
- Rate limiting
- Content moderation

## Deployment

**Development:**
```bash
pnpm install
pnpm dev  # Starts all services (Turborepo)
```

**Services:**
- Frontend: http://localhost:3000
- REST API: http://localhost:3001
- WebSocket: ws://localhost:8080
- Redis: localhost:6379 (Docker)

**Docker:**
```bash
docker-compose up  # Starts Redis
```

## Environment Variables

```env
# apps/backend/.env
JWT_SECRET=your-secret-key-min-32-chars
PORT=3001
NODE_ENV=development
REDIS_URL=redis://localhost:6379

# apps/web/.env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:8080
```

## Future Enhancements

- User accounts and authentication
- Saved canvas history
- More drawing tools (shapes, text)
- Canvas export (PNG, SVG)
- Private rooms
- Custom word lists
- Mobile optimization
- Voice chat integration


---

## Current Limitations & Missing Features

### Critical Limitations

**1. No Persistence**
- Rooms expire after 24 hours (Redis TTL)
- All drawings lost when room expires
- No way to save or export canvases
- No user accounts or login system
- PostgreSQL database exists but barely used

**2. Limited Drawing Tools**
- Only pen and eraser available
- No shapes (rectangle, circle, arrow planned but not in UI)
- No text tool
- No fill/bucket tool
- No layers or grouping
- No undo/redo functionality

**3. No Canvas Controls**
- No pan or zoom
- Fixed canvas size
- No grid or rulers
- No snap-to-grid
- No alignment tools

**4. Scalability Issues**
- In-memory game state (lost on server restart)
- Single WebSocket server (no horizontal scaling)
- No load balancing
- All users in one server instance
- Redis as single point of failure

**5. Security Gaps**
- No rate limiting on WebSocket messages
- No input sanitization for drawings
- No protection against malicious shapes
- CORS wide open (all origins allowed)
- No HTTPS/WSS in production setup
- Guest IDs easily spoofed

**6. Game Limitations**
- Fixed word bank (hardcoded in words.ts)
- No custom word lists
- No difficulty levels
- No team mode
- No spectator mode
- Can't kick players
- No voting system

**7. Mobile Experience**
- Not optimized for touch
- No touch gestures
- Small UI elements
- Canvas too large for mobile screens
- No responsive toolbar

**8. Network Issues**
- No reconnection with state recovery
- Lost connection = lost game progress
- No offline mode
- No connection quality indicator
- Draft messages can flood network (30fps)

**9. User Experience Gaps**
- No tutorial or onboarding
- No sound effects or music
- No animations for game events
- No emoji reactions
- No player avatars
- Can't change name mid-game
- No game history or stats

**10. Monitoring & Debugging**
- No error tracking (Sentry, etc.)
- No analytics
- No performance monitoring
- Console.log only debugging
- No admin dashboard
- No room management tools

### Missing Features (Planned but Not Implemented)

**Drawing Features:**
- [ ] Rectangle, circle, arrow tools (schema exists, UI missing)
- [ ] Text tool (schema exists, UI missing)
- [ ] Fill color (only stroke color works)
- [ ] Eraser size control
- [ ] Copy/paste/duplicate
- [ ] Undo/redo stack
- [ ] Layer management
- [ ] Shape rotation
- [ ] Opacity control

**Canvas Features:**
- [ ] Pan and zoom
- [ ] Infinite canvas
- [ ] Canvas background color
- [ ] Grid overlay
- [ ] Snap to grid
- [ ] Rulers and guides
- [ ] Canvas export (PNG, SVG, JSON)
- [ ] Canvas templates

**Collaboration Features:**
- [ ] Live cursor tracking (other users' cursors)
- [ ] User presence indicators
- [ ] Viewport synchronization
- [ ] Collaborative selection
- [ ] User color coding
- [ ] Voice chat
- [ ] Video chat

**Game Features:**
- [ ] Custom word lists
- [ ] Difficulty settings
- [ ] Team mode (2v2, etc.)
- [ ] Spectator mode
- [ ] Vote to skip
- [ ] Vote to kick
- [ ] Power-ups or bonuses
- [ ] Achievements
- [ ] Leaderboards (global)
- [ ] Game replays

**User Features:**
- [ ] User accounts and login
- [ ] Profile customization
- [ ] Avatar upload
- [ ] Friend system
- [ ] Private messaging
- [ ] Game history
- [ ] Statistics tracking
- [ ] Saved drawings gallery

**Room Features:**
- [ ] Private rooms with passwords
- [ ] Room settings (rounds, time, etc.)
- [ ] Room templates
- [ ] Persistent rooms (don't expire)
- [ ] Room search/browse
- [ ] Room categories
- [ ] Max players limit control

**Technical Improvements:**
- [ ] WebSocket reconnection with state recovery
- [ ] Horizontal scaling (multiple WS servers)
- [ ] Load balancing
- [ ] Redis cluster
- [ ] Database connection pooling
- [ ] Caching strategy
- [ ] CDN for static assets
- [ ] Rate limiting
- [ ] DDoS protection

### Known Bugs & Issues

**1. Duplicate Connections**
- Fast refresh can create duplicate users
- Partially fixed but edge cases remain

**2. Admin Succession**
- Admin can change unexpectedly on reconnect
- No clear indication of admin change

**3. Shape Synchronization**
- Rare race conditions on simultaneous draws
- No conflict resolution for overlapping edits

**4. Timer Drift**
- Client/server time can drift
- Timers may be slightly off

**5. Memory Leaks**
- Long-running games may accumulate memory
- No cleanup of old game states

**6. Chat Scroll**
- Auto-scroll can be jumpy
- Doesn't scroll when new messages arrive if user scrolled up

**7. Canvas Performance**
- Many shapes (>100) can slow down rendering
- No virtualization or culling

**8. Mobile Keyboard**
- Keyboard covers chat input on mobile
- No viewport adjustment

### Architecture Weaknesses

**1. Tight Coupling**
- Frontend directly depends on WebSocket message format
- Hard to change protocol without breaking clients
- No versioning strategy

**2. No API Gateway**
- REST and WebSocket on different ports
- No unified entry point
- Hard to add authentication layer

**3. State Management**
- Game state split between Redis and in-memory
- No single source of truth
- Hard to debug state issues

**4. No Event Sourcing**
- Can't replay events
- Can't recover from crashes
- No audit trail

**5. Monolithic WebSocket Server**
- All logic in one file (index.ts is 300+ lines)
- Hard to test
- Hard to maintain

**6. No Testing**
- Zero unit tests
- Zero integration tests
- Zero e2e tests
- Manual testing only

**7. No CI/CD**
- No automated builds
- No automated deployments
- No staging environment

**8. Environment Management**
- .env files not validated
- No secrets management
- Hardcoded URLs in some places

### Performance Bottlenecks

**1. Redis Single Point of Failure**
- All data in one Redis instance
- No replication
- No failover

**2. WebSocket Broadcasting**
- O(n) broadcast to all users in room
- No message batching
- JSON serialization overhead

**3. Shape Storage**
- All shapes loaded on join
- No pagination
- No lazy loading

**4. Frontend Rendering**
- All shapes rendered every frame
- No canvas virtualization
- No dirty region tracking

**5. Network Overhead**
- Draft messages every 32ms (30fps)
- No compression
- No binary protocol

### Comparison with Skribbl.io

**What We Have:**
✅ Real-time drawing
✅ Turn-based gameplay
✅ Word guessing
✅ Scoring system
✅ Multiple rounds
✅ Chat

**What We're Missing:**
❌ More drawing tools
❌ Better mobile support
❌ Custom word lists
❌ Private rooms
❌ Kick/vote features
❌ Better UI/UX polish
❌ Sound effects
❌ Animations
❌ User accounts
❌ Global leaderboards

### Priority Fixes Needed

**High Priority:**
1. Add undo/redo functionality
2. Implement more drawing tools (shapes, text)
3. Add canvas export (PNG at minimum)
4. Fix mobile responsiveness
5. Add rate limiting and security
6. Implement proper error handling
7. Add reconnection with state recovery

**Medium Priority:**
8. User accounts and authentication
9. Private rooms with passwords
10. Custom word lists
11. Better admin controls
12. Canvas pan/zoom
13. Performance optimizations
14. Testing suite

**Low Priority:**
15. Voice/video chat
16. Achievements and stats
17. Team mode
18. Spectator mode
19. Advanced drawing features
20. Social features

### Technical Debt

- No TypeScript strict mode
- Inconsistent error handling
- No logging framework
- No monitoring/alerting
- No documentation for API
- No code comments in complex areas
- No design system documentation
- Hardcoded magic numbers
- Copy-pasted code in places
- No dependency injection
- Global state in WebSocket server

### Recommendations for Production

**Before Launch:**
1. Add comprehensive testing
2. Implement rate limiting
3. Add error tracking (Sentry)
4. Set up monitoring (Datadog, etc.)
5. Add HTTPS/WSS
6. Implement proper CORS
7. Add input validation everywhere
8. Set up CI/CD pipeline
9. Create staging environment
10. Load testing

**For Scale:**
1. Redis cluster with replication
2. Multiple WebSocket servers with Redis pub/sub
3. Load balancer (nginx)
4. CDN for static assets
5. Database connection pooling
6. Horizontal scaling strategy
7. Caching layer
8. Message queue for async tasks


---

## Detailed Explanation of Key Issues

### 1. No Tests - What This Means

**Current State:**
```bash
# No test files exist anywhere in the project
apps/backend/src/          # No *.test.ts files
apps/ws-backend/src/       # No *.test.ts files
apps/web/app/              # No *.test.tsx files
```

**Why This Is Bad:**

**A. Can't Verify Code Works**
```typescript
// Example: Room creation function
async create(name?: string, adminId?: string) {
  const slug = generateslug();
  // What if generateslug() returns duplicate?
  // What if Redis is down?
  // What if name is too long?
  // NO TESTS = NO CONFIDENCE
}
```

**B. Fear of Refactoring**
- Change one line → might break everything
- No way to know what broke
- Developers afraid to improve code
- Technical debt accumulates

**C. Bugs Reach Production**
```typescript
// Real example from codebase:
if (Math.hypot(x2 - x1, y2 - y1) < 3) {
  // What if this calculation is wrong?
  // No test to catch it!
}
```

**What Tests Should Exist:**

**Unit Tests** - Test individual functions
```typescript
// apps/backend/src/room/room.service.test.ts
describe('Room Service', () => {
  test('creates room with unique slug', async () => {
    const room = await createroomService.create('Test Room');
    expect(room.slug).toHaveLength(6);
    expect(room.name).toBe('Test Room');
  });

  test('handles Redis failure gracefully', async () => {
    // Mock Redis to fail
    await expect(createroomService.create()).rejects.toThrow();
  });
});
```

**Integration Tests** - Test components together
```typescript
// apps/backend/src/room/room.integration.test.ts
describe('Room API', () => {
  test('POST /api/room/create returns valid room', async () => {
    const response = await request(app)
      .post('/api/room/create')
      .send({ name: 'Test Room' });
    
    expect(response.status).toBe(200);
    expect(response.body.slug).toBeDefined();
  });
});
```

**E2E Tests** - Test entire user flow
```typescript
// apps/web/e2e/drawing.test.ts
test('user can draw and others see it', async () => {
  // User 1 creates room
  await page1.goto('/');
  await page1.click('[data-testid="create-room"]');
  
  // User 2 joins room
  const roomUrl = await page1.url();
  await page2.goto(roomUrl);
  
  // User 1 draws
  await page1.mouse.move(100, 100);
  await page1.mouse.down();
  await page1.mouse.move(200, 200);
  await page1.mouse.up();
  
  // User 2 should see the drawing
  await expect(page2.locator('canvas')).toContainShape();
});
```

**WebSocket Tests** - Test real-time features
```typescript
// apps/ws-backend/src/index.test.ts
describe('WebSocket Server', () => {
  test('broadcasts draw message to other users', async () => {
    const client1 = new WebSocket('ws://localhost:8080');
    const client2 = new WebSocket('ws://localhost:8080');
    
    // Client 1 joins room
    client1.send(JSON.stringify({ type: 'join_room', roomId: 'test' }));
    
    // Client 2 joins same room
    client2.send(JSON.stringify({ type: 'join_room', roomId: 'test' }));
    
    // Client 1 draws
    client1.send(JSON.stringify({ 
      type: 'draw', 
      shape: { id: '1', type: 'line' } 
    }));
    
    // Client 2 should receive it
    const message = await waitForMessage(client2);
    expect(message.type).toBe('draw');
    expect(message.shape.id).toBe('1');
  });
});
```

**Impact of No Tests:**
- 🔴 Can't refactor safely
- 🔴 Bugs discovered by users, not developers
- 🔴 No confidence in deployments
- 🔴 Hard to onboard new developers
- 🔴 Regression bugs common

---

### 2. No CI/CD - What This Means

**Current Deployment Process:**
```bash
# Manual, error-prone process:
1. Developer writes code on laptop
2. Developer manually runs: pnpm build
3. Developer manually tests in browser
4. Developer commits to git
5. Developer SSHs into server
6. Developer manually runs: git pull
7. Developer manually runs: pnpm install
8. Developer manually runs: pnpm build
9. Developer manually restarts services
10. Developer manually checks if it works
11. If broken, manually rollback
```

**Problems:**
- ❌ Forgot to run build? Broken deployment
- ❌ Forgot to install dependencies? Broken deployment
- ❌ Typo in command? Broken deployment
- ❌ Different Node version on server? Broken deployment
- ❌ Forgot to restart service? Old code still running
- ❌ No way to rollback quickly
- ❌ Downtime during deployment

**What CI/CD Should Look Like:**

**CI (Continuous Integration)** - Automated Testing
```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      
      # Install dependencies
      - run: pnpm install
      
      # Type checking
      - run: pnpm check-types
      
      # Linting
      - run: pnpm lint
      
      # Unit tests
      - run: pnpm test
      
      # Build
      - run: pnpm build
      
      # E2E tests
      - run: pnpm test:e2e
```

**CD (Continuous Deployment)** - Automated Deployment
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      # Build Docker images
      - run: docker build -t app/backend ./apps/backend
      - run: docker build -t app/ws-backend ./apps/ws-backend
      - run: docker build -t app/web ./apps/web
      
      # Push to registry
      - run: docker push app/backend
      - run: docker push app/ws-backend
      - run: docker push app/web
      
      # Deploy to production
      - run: kubectl apply -f k8s/
      
      # Health check
      - run: curl https://api.example.com/health
      
      # Rollback if failed
      - if: failure()
        run: kubectl rollout undo deployment/backend
```

**Benefits of CI/CD:**
- ✅ Every commit automatically tested
- ✅ Can't merge broken code
- ✅ Deployments are consistent
- ✅ Zero-downtime deployments
- ✅ Easy rollback
- ✅ Deploy 10x per day safely
- ✅ Catch bugs before production

**Current vs. With CI/CD:**

| Scenario | Without CI/CD | With CI/CD |
|----------|---------------|------------|
| Deploy time | 30 minutes manual | 5 minutes automated |
| Broken deploy | Discover in production | Blocked by CI |
| Rollback | Manual, 15 minutes | Automatic, 1 minute |
| Confidence | Low (manual steps) | High (automated) |
| Downtime | 5-10 minutes | 0 seconds (blue-green) |

---

### 3. Tight Coupling - What This Means

**Current Problem:**

**Frontend Directly Depends on Backend Message Format**
```typescript
// Frontend: apps/web/app/canvas/_components/useShapes.tsx
useWebSocket(roomId, guestId, guestName, (payload) => {
  // TIGHTLY COUPLED: Frontend knows exact message structure
  if (payload.type === "draw") {
    setShapes(prev => [...prev, payload.shape]);
  }
  if (payload.type === "game_state_update") {
    setGameData(payload.data);
  }
  // If backend changes message format, frontend breaks!
});
```

```typescript
// Backend: apps/ws-backend/src/index.ts
// Sends message in specific format
socket.send(JSON.stringify({
  type: "draw",
  shape: { id: "1", type: "line", points: [10, 20] }
}));

// If we change this to:
socket.send(JSON.stringify({
  type: "draw",
  element: { ... }  // Changed "shape" to "element"
}));
// Frontend breaks immediately!
```

**Why This Is Bad:**

**A. Can't Change Backend Without Breaking Frontend**
```typescript
// Backend developer wants to improve message format:
// OLD:
{ type: "draw", shape: { id: "1", x: 10, y: 20 } }

// NEW (better):
{ 
  type: "draw", 
  version: 2,
  timestamp: 1234567890,
  shape: { id: "1", position: { x: 10, y: 20 } }
}

// Problem: All existing clients break!
```

**B. No Versioning**
```typescript
// Old clients and new clients use same WebSocket
// No way to support both simultaneously
// Must force all users to refresh
```

**C. Hard to Test**
```typescript
// Can't test frontend without real backend
// Can't test backend without real frontend
// Can't mock easily
```

**D. Multiple Clients Impossible**
```typescript
// Want to build mobile app?
// Must duplicate all message handling logic
// Any backend change breaks web AND mobile
```

**How Tight Coupling Looks:**

```
Frontend ←→ Backend
   ↓           ↓
Knows exact   Knows exact
message       message
format        format

Change one = Break both
```

**Better Architecture (Loose Coupling):**

**Solution 1: API Contract / Schema**
```typescript
// packages/common/src/websocket-protocol.ts
// SHARED CONTRACT between frontend and backend

export const DrawMessageSchema = z.object({
  type: z.literal("draw"),
  version: z.number(),
  shape: z.object({
    id: z.string(),
    type: z.enum(["line", "rect", "ellipse"]),
    // ... full schema
  })
});

export type DrawMessage = z.infer<typeof DrawMessageSchema>;
```

```typescript
// Backend validates against schema
const message = DrawMessageSchema.parse(payload);
socket.send(JSON.stringify(message));
```

```typescript
// Frontend validates against schema
const message = DrawMessageSchema.parse(JSON.parse(data));
setShapes(prev => [...prev, message.shape]);
```

**Benefits:**
- ✅ Both sides use same schema
- ✅ TypeScript catches mismatches at compile time
- ✅ Runtime validation catches bad data
- ✅ Can version messages

**Solution 2: API Gateway / Adapter Pattern**
```typescript
// Frontend uses abstract interface
interface DrawingAPI {
  sendShape(shape: Shape): void;
  onShapeReceived(callback: (shape: Shape) => void): void;
}

// WebSocket implementation
class WebSocketDrawingAPI implements DrawingAPI {
  sendShape(shape: Shape) {
    // Converts to WebSocket format
    this.ws.send(JSON.stringify({ type: "draw", shape }));
  }
  
  onShapeReceived(callback) {
    this.ws.on('message', (data) => {
      const msg = JSON.parse(data);
      if (msg.type === "draw") {
        callback(msg.shape);
      }
    });
  }
}

// Now frontend uses interface, not WebSocket directly
const api: DrawingAPI = new WebSocketDrawingAPI();
api.sendShape(myShape);
```

**Benefits:**
- ✅ Frontend doesn't know about WebSocket
- ✅ Can swap WebSocket for HTTP polling
- ✅ Can swap for different protocol
- ✅ Easy to mock for testing

**Solution 3: Message Versioning**
```typescript
// Backend supports multiple versions
socket.on('message', (data) => {
  const msg = JSON.parse(data);
  
  if (msg.version === 1) {
    handleV1Message(msg);
  } else if (msg.version === 2) {
    handleV2Message(msg);
  }
});

// Old clients still work
// New clients get new features
// Gradual migration
```

**Real-World Example of Tight Coupling Problem:**

```typescript
// Week 1: Backend sends
{ type: "user_list_update", users: ["Alice", "Bob"] }

// Frontend expects array of strings
setUsers(payload.users);

// Week 2: Backend needs to send more info
{ type: "user_list_update", users: [
  { userId: "1", name: "Alice" },
  { userId: "2", name: "Bob" }
]}

// Frontend breaks! Expected string[], got object[]
// All users see error
// Must deploy frontend and backend simultaneously
// Risky!
```

**With Loose Coupling:**
```typescript
// Backend sends versioned message
{ 
  version: 2,
  type: "user_list_update", 
  users: [{ userId: "1", name: "Alice" }]
}

// Frontend checks version
if (payload.version === 1) {
  setUsers(payload.users.map(name => ({ name })));
} else if (payload.version === 2) {
  setUsers(payload.users);
}

// Old clients still work
// New clients get new features
// No breaking change
```

**Summary:**

| Issue | Current State | Impact | Solution |
|-------|---------------|--------|----------|
| **No Tests** | Zero test files | Can't refactor safely, bugs in production | Add Jest, Playwright, write tests |
| **No CI/CD** | Manual deployment | Error-prone, slow, downtime | GitHub Actions, automated pipeline |
| **Tight Coupling** | Frontend knows backend format | Can't change without breaking | Shared schemas, versioning, adapters |

**Priority to Fix:**
1. **Add basic tests** (unit tests for critical functions)
2. **Set up CI** (run tests on every commit)
3. **Add shared types** (packages/common for message schemas)
4. **Set up CD** (automated deployment)
5. **Refactor to loose coupling** (adapter pattern, versioning)
