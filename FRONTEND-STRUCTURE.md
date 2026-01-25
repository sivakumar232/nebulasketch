# Next.js Frontend Structure - Complete Guide

## Current Structure (What You Have)

```
apps/web/
├── app/
│   ├── favicon.ico
│   ├── fonts/
│   │   ├── GeistMonoVF.woff
│   │   └── GeistVF.woff
│   ├── globals.css
│   ├── layout.tsx              # Root layout
│   ├── page.module.css
│   └── page.tsx                # Home page
│
├── public/
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
│
├── .gitignore
├── eslint.config.js
├── next-env.d.ts
├── next.config.js
├── package.json
├── README.md
└── tsconfig.json
```

---

## Complete Structure (What You Need)

```
apps/web/
├── app/                        # Next.js 14 App Router
│   │
│   ├── (auth)/                 # Auth route group (optional layout)
│   │   ├── layout.tsx          # Auth-specific layout
│   │   ├── login/
│   │   │   └── page.tsx        # Login page
│   │   └── signup/
│   │       └── page.tsx        # Signup page
│   │
│   ├── canvas/                 # Canvas routes
│   │   └── [roomId]/           # Dynamic room route
│   │       ├── page.tsx        # Main canvas page
│   │       └── loading.tsx     # Loading state (optional)
│   │
│   ├── dashboard/              # User dashboard (optional)
│   │   └── page.tsx            # List of user's rooms
│   │
│   ├── fonts/                  # ✅ Already exists
│   │   ├── GeistMonoVF.woff
│   │   └── GeistVF.woff
│   │
│   ├── favicon.ico             # ✅ Already exists
│   ├── globals.css             # ✅ Already exists
│   ├── layout.tsx              # ✅ Root layout
│   └── page.tsx                # ✅ Home/landing page
│
├── components/                 # 🆕 CREATE THIS FOLDER
│   │
│   ├── canvas/                 # Canvas-related components
│   │   ├── TldrawCanvas.tsx    # Tldraw wrapper (Tldraw version)
│   │   ├── Canvas.tsx          # Main canvas (Konva version)
│   │   ├── CanvasRenderer.tsx  # Render elements (Konva version)
│   │   └── Viewport.tsx        # Pan/zoom controls (Konva version)
│   │
│   ├── toolbar/                # Toolbar components
│   │   ├── Toolbar.tsx         # Main toolbar
│   │   ├── ToolButton.tsx      # Individual tool button
│   │   └── StylePanel.tsx      # Color/stroke controls
│   │
│   ├── collaboration/          # Collaboration features
│   │   ├── UserCursors.tsx     # Render other users' cursors
│   │   ├── UserList.tsx        # Active users sidebar
│   │   └── PresenceIndicator.tsx # User presence badges
│   │
│   └── ui/                     # Shared UI components
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       └── Tooltip.tsx
│
├── lib/                        # 🆕 CREATE THIS FOLDER
│   │
│   ├── api/                    # API client functions
│   │   ├── client.ts           # Base API client
│   │   ├── auth.ts             # Auth API calls
│   │   ├── canvas.ts           # Canvas API calls
│   │   ├── elements.ts         # Element API calls
│   │   └── rooms.ts            # Room API calls
│   │
│   ├── websocket/              # WebSocket client
│   │   ├── client.ts           # WebSocket connection
│   │   ├── handlers.ts         # Message handlers
│   │   └── types.ts            # WebSocket types
│   │
│   ├── store/                  # State management (Zustand)
│   │   ├── canvas-store.ts     # Canvas state
│   │   ├── collaboration-store.ts # Collaboration state
│   │   ├── auth-store.ts       # Auth state
│   │   └── history-store.ts    # Undo/redo state
│   │
│   └── utils/                  # Utility functions
│       ├── geometry.ts         # Math/geometry helpers
│       ├── colors.ts           # Color utilities
│       └── export.ts           # Export utilities
│
├── hooks/                      # 🆕 CREATE THIS FOLDER
│   ├── useWebSocket.ts         # WebSocket connection hook
│   ├── useCanvas.ts            # Canvas state hook
│   ├── useCollaboration.ts     # Collaboration hook
│   ├── useSelection.ts         # Selection hook
│   ├── useHistory.ts           # Undo/redo hook
│   └── useAuth.ts              # Auth hook
│
├── types/                      # 🆕 CREATE THIS FOLDER (optional)
│   └── index.ts                # Frontend-specific types
│
├── public/                     # ✅ Static assets
│   ├── icons/                  # Tool icons (optional)
│   └── [existing SVGs]
│
├── .env.local                  # 🆕 CREATE THIS
├── .gitignore                  # ✅ Already exists
├── eslint.config.js            # ✅ Already exists
├── next-env.d.ts               # ✅ Already exists
├── next.config.js              # ✅ Already exists
├── package.json                # ✅ Update with dependencies
├── README.md                   # ✅ Already exists
└── tsconfig.json               # ✅ Already exists
```

---

## Detailed Breakdown

### **1. App Router Structure** (`app/`)

#### **Route Groups:**
```
app/
├── (auth)/           # Routes: /login, /signup
├── canvas/[roomId]/  # Routes: /canvas/1, /canvas/abc
└── dashboard/        # Route: /dashboard
```

#### **Key Files:**

**`app/layout.tsx`** - Root layout (already exists)
```tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

**`app/page.tsx`** - Home page (already exists)
```tsx
export default function Home() {
  return <div>Landing page</div>
}
```

**`app/canvas/[roomId]/page.tsx`** - 🆕 Main canvas page
```tsx
'use client'

export default function CanvasPage({ params }) {
  const roomId = params.roomId
  return <div>Canvas for room {roomId}</div>
}
```

---

### **2. Components** (`components/`)

#### **Organization:**
```
components/
├── canvas/          # Canvas-specific
├── toolbar/         # Toolbar UI
├── collaboration/   # Real-time features
└── ui/             # Reusable UI
```

#### **Example Component:**

**`components/canvas/TldrawCanvas.tsx`**
```tsx
'use client'

import { Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'

export default function TldrawCanvas({ roomId }) {
  return <Tldraw />
}
```

---

### **3. Library Code** (`lib/`)

#### **API Client** (`lib/api/`)
```
lib/api/
├── client.ts        # Axios/fetch wrapper
├── auth.ts          # login(), signup()
├── canvas.ts        # getCanvas(), saveCanvas()
└── elements.ts      # createElement(), updateElement()
```

#### **WebSocket** (`lib/websocket/`)
```
lib/websocket/
├── client.ts        # WebSocket connection
├── handlers.ts      # Message handlers
└── types.ts         # Message types
```

#### **State Management** (`lib/store/`)
```
lib/store/
├── canvas-store.ts         # Elements, viewport
├── collaboration-store.ts  # Users, cursors
└── auth-store.ts          # User session
```

---

### **4. Hooks** (`hooks/`)

Custom React hooks for reusable logic:

```
hooks/
├── useWebSocket.ts      # WebSocket connection
├── useCanvas.ts         # Canvas state
├── useCollaboration.ts  # Presence, cursors
├── useSelection.ts      # Element selection
└── useHistory.ts        # Undo/redo
```

---

### **5. Configuration Files**

#### **`.env.local`** - 🆕 CREATE THIS
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:8080
```

#### **`package.json`** - Update dependencies
```json
{
  "dependencies": {
    "next": "^15.1.6",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tldraw": "^2.0.0",        // For Tldraw version
    "zustand": "^4.5.0",       // State management
    "axios": "^1.6.0"          // API calls
  }
}
```

---

## File Creation Order

### **Phase 1: Basic Setup** (Day 1)
1. Create `.env.local`
2. Update `package.json` dependencies
3. Create `lib/api/client.ts`
4. Create `hooks/useAuth.ts`

### **Phase 2: Canvas Page** (Day 2)
5. Create `app/canvas/[roomId]/page.tsx`
6. Create `components/canvas/TldrawCanvas.tsx`
7. Create `lib/store/canvas-store.ts`

### **Phase 3: Collaboration** (Day 3)
8. Create `lib/websocket/client.ts`
9. Create `hooks/useWebSocket.ts`
10. Create `lib/store/collaboration-store.ts`

### **Phase 4: UI Components** (Day 4)
11. Create `components/collaboration/UserList.tsx`
12. Create `components/collaboration/UserCursors.tsx`
13. Create `components/toolbar/Toolbar.tsx`

---

## Quick Start Commands

```bash
# Navigate to web app
cd apps/web

# Install dependencies
pnpm add tldraw zustand axios

# Create folders
mkdir -p components/{canvas,toolbar,collaboration,ui}
mkdir -p lib/{api,websocket,store,utils}
mkdir -p hooks
mkdir -p types

# Create env file
touch .env.local

# Start dev server
pnpm dev
```

---

## Key Points

✅ **App Router** - Use Next.js 14 app directory  
✅ **Client Components** - Canvas needs `'use client'`  
✅ **Dynamic Routes** - `[roomId]` for room-specific pages  
✅ **Organized Structure** - Separate concerns (components, lib, hooks)  
✅ **Environment Variables** - Use `.env.local` for config  

Ready to start building the frontend? 🚀
