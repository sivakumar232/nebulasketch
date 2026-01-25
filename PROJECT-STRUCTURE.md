# NebulaSketch - Complete Project Structure

## Current Structure Overview

```
draw-app/
├── apps/
│   ├── backend/              # REST API (Express.js)
│   ├── ws-backend/           # WebSocket server
│   └── web/                  # Next.js frontend
├── packages/
│   ├── backend-common/       # Shared backend utilities
│   ├── common/               # Shared utilities
│   ├── db/                   # Prisma database
│   ├── eslint-config/        # ESLint config
│   ├── typescript-config/    # TypeScript config
│   └── ui/                   # Shared UI components
└── [config files]
```

---

## Detailed File Structure (What You Need to Build)

### **1. Backend API** (`apps/backend/src/`)

```
apps/backend/
├── src/
│   ├── auth/                    # ✅ Already exists
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.routes.ts
│   │   └── auth.validator.ts
│   │
│   ├── room/                    # ✅ Already exists
│   │   ├── room.controller.ts
│   │   ├── room.service.ts
│   │   ├── room.routes.ts
│   │   └── room.validator.ts
│   │
│   ├── canvas/                  # 🆕 CREATE THIS
│   │   ├── canvas.controller.ts
│   │   ├── canvas.service.ts
│   │   ├── canvas.routes.ts
│   │   └── canvas.validator.ts
│   │
│   ├── element/                 # 🆕 CREATE THIS
│   │   ├── element.controller.ts
│   │   ├── element.service.ts
│   │   ├── element.routes.ts
│   │   └── element.validator.ts
│   │
│   ├── middlewares/             # ✅ Already exists
│   │   ├── auth.middleware.ts
│   │   └── validate.middleware.ts
│   │
│   ├── routes.ts                # ✅ Update to add canvas/element routes
│   └── index.ts                 # ✅ Already exists
│
├── package.json
└── tsconfig.json
```

---

### **2. WebSocket Server** (`apps/ws-backend/src/`)

```
apps/ws-backend/
├── src/
│   ├── handlers/                # 🆕 CREATE THIS
│   │   ├── presence.handler.ts  # Join/leave/cursor/viewport
│   │   ├── canvas.handler.ts    # Element create/update/delete
│   │   └── chat.handler.ts      # Chat messages (optional)
│   │
│   ├── services/                # 🆕 CREATE THIS
│   │   └── room.service.ts      # Room state management
│   │
│   ├── types/                   # 🆕 CREATE THIS
│   │   └── index.ts             # User, RoomState types
│   │
│   └── index.ts                 # ✅ Update with new handlers
│
├── package.json
└── tsconfig.json
```

---

### **3. Frontend - Tldraw Version** (`apps/web/`)

```
apps/web/
├── app/
│   ├── (auth)/                  # ✅ Already exists (optional)
│   │   ├── login/
│   │   └── signup/
│   │
│   ├── canvas/                  # 🆕 CREATE THIS
│   │   └── [roomId]/
│   │       └── page.tsx         # Main canvas page with Tldraw
│   │
│   ├── layout.tsx               # ✅ Already exists
│   └── page.tsx                 # ✅ Already exists (home page)
│
├── components/                  # 🆕 CREATE THIS
│   ├── canvas/
│   │   └── TldrawCanvas.tsx     # Tldraw wrapper component
│   │
│   └── ui/                      # Shared UI components
│       ├── Toolbar.tsx
│       └── UserList.tsx
│
├── lib/                         # 🆕 CREATE THIS
│   ├── api/
│   │   ├── canvas.ts            # Canvas API calls
│   │   └── elements.ts          # Element API calls
│   │
│   ├── websocket/
│   │   └── client.ts            # WebSocket client
│   │
│   └── store/
│       └── collaboration.ts     # Collaboration state (Zustand)
│
├── hooks/                       # 🆕 CREATE THIS
│   ├── useWebSocket.ts          # WebSocket connection hook
│   ├── useCanvas.ts             # Canvas state hook
│   └── useCollaboration.ts      # Collaboration features hook
│
├── package.json                 # ✅ Update with tldraw
└── tsconfig.json
```

---

### **4. Frontend - Konva Version** (Different Branch)

```
apps/web/
├── app/
│   └── canvas/[roomId]/
│       └── page.tsx             # Main canvas page with Konva
│
├── components/
│   ├── canvas/
│   │   ├── Canvas.tsx           # Main Konva Stage
│   │   ├── CanvasRenderer.tsx   # Render all elements
│   │   ├── ElementRenderer.tsx  # Render individual element
│   │   └── Viewport.tsx         # Pan/zoom controls
│   │
│   ├── toolbar/
│   │   ├── Toolbar.tsx          # Main toolbar
│   │   ├── ToolButton.tsx       # Tool selection buttons
│   │   └── StylePanel.tsx       # Color/stroke controls
│   │
│   └── collaboration/
│       ├── UserCursors.tsx      # Other users' cursors
│       └── UserList.tsx         # Active users sidebar
│
├── lib/
│   ├── canvas/
│   │   ├── engine.ts            # Canvas engine
│   │   ├── tools/
│   │   │   ├── rectangle.ts
│   │   │   ├── circle.ts
│   │   │   ├── line.ts
│   │   │   └── text.ts
│   │   └── utils/
│   │       ├── geometry.ts
│   │       └── transform.ts
│   │
│   └── store/
│       ├── canvas-store.ts      # Canvas state (Zustand)
│       └── history.ts           # Undo/redo stack
│
└── hooks/
    ├── useCanvas.ts
    ├── useSelection.ts
    └── useHistory.ts
```

---

### **5. Database** (`packages/db/`)

```
packages/db/
├── prisma/
│   ├── schema.prisma            # ✅ Updated with Canvas/Element
│   └── migrations/              # Generated migrations
│
├── src/
│   ├── generated/               # Generated Prisma client
│   │   └── prisma/
│   ├── client.ts                # Prisma client export
│   └── index.ts
│
└── package.json
```

---

### **6. Shared Packages**

#### **Canvas Types** (`packages/canvas-types/`) - 🆕 CREATE THIS

```
packages/canvas-types/
├── src/
│   └── index.ts                 # All TypeScript types
│       ├── Element types
│       ├── Canvas types
│       ├── WebSocket message types
│       └── User presence types
│
├── package.json
└── tsconfig.json
```

#### **Backend Common** (`packages/backend-common/`)

```
packages/backend-common/
├── src/
│   ├── config.ts                # ✅ Already exists (JWT_SECRET, etc.)
│   └── index.ts
│
└── package.json
```

---

## File Creation Priority

### **Phase 1: Database & Types** (Day 1)
1. ✅ Update `packages/db/prisma/schema.prisma`
2. 🆕 Create `packages/canvas-types/src/index.ts`
3. Run migrations

### **Phase 2: Backend API** (Day 2)
4. 🆕 Create `apps/backend/src/canvas/` (all files)
5. 🆕 Create `apps/backend/src/element/` (all files)
6. ✅ Update `apps/backend/src/routes.ts`

### **Phase 3: WebSocket** (Day 3)
7. 🆕 Create `apps/ws-backend/src/handlers/`
8. 🆕 Create `apps/ws-backend/src/services/`
9. 🆕 Create `apps/ws-backend/src/types/`
10. ✅ Update `apps/ws-backend/src/index.ts`

### **Phase 4: Frontend (Tldraw)** (Day 4-5)
11. 🆕 Create `apps/web/app/canvas/[roomId]/page.tsx`
12. 🆕 Create `apps/web/components/canvas/TldrawCanvas.tsx`
13. 🆕 Create `apps/web/lib/websocket/client.ts`
14. 🆕 Create `apps/web/hooks/useWebSocket.ts`

---

## Key Files Summary

| File | Purpose | Status |
|------|---------|--------|
| `schema.prisma` | Database models | ✅ Updated |
| `canvas-types/index.ts` | Shared TypeScript types | 🆕 Create |
| `canvas.service.ts` | Canvas CRUD logic | 🆕 Create |
| `element.service.ts` | Element CRUD logic | 🆕 Create |
| `ws-backend/index.ts` | WebSocket server | ✅ Update |
| `canvas/[roomId]/page.tsx` | Main canvas page | 🆕 Create |
| `useWebSocket.ts` | WebSocket hook | 🆕 Create |

---

## Next Steps

1. **Create canvas-types package** (shared types)
2. **Build backend services** (canvas & element)
3. **Enhance WebSocket server** (collaboration)
4. **Build frontend** (Tldraw first, then Konva)

Ready to start building? 🚀
