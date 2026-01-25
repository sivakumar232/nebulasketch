# Konva Quick Start Guide

## Step 1: Install Dependencies

```bash
cd apps/web
pnpm add konva react-konva zustand
```

## Step 2: Create Basic Canvas Component

**File:** `apps/web/components/canvas/KonvaCanvas.tsx`

```tsx
'use client'

import { Stage, Layer, Rect } from 'react-konva'
import { useState } from 'react'

export default function KonvaCanvas() {
  const [rectangles, setRectangles] = useState<any[]>([])

  return (
    <Stage width={window.innerWidth} height={window.innerHeight}>
      <Layer>
        {rectangles.map((rect, i) => (
          <Rect
            key={i}
            x={rect.x}
            y={rect.y}
            width={rect.width}
            height={rect.height}
            fill="blue"
            draggable
          />
        ))}
      </Layer>
    </Stage>
  )
}
```

## Step 3: Use in Canvas Page

**File:** `apps/web/app/canvas/[roomId]/page.tsx`

```tsx
'use client'

import dynamic from 'next/dynamic'
import { useParams } from 'next/navigation'

// Import Konva dynamically (client-side only)
const KonvaCanvas = dynamic(
  () => import('@/components/canvas/KonvaCanvas'),
  { ssr: false }
)

export default function CanvasPage() {
  const params = useParams()
  const roomId = params.roomId as string

  return (
    <div className="h-screen w-screen">
      <KonvaCanvas />
    </div>
  )
}
```

## Step 4: Test It

```bash
pnpm dev
```

Visit: `http://localhost:3000/canvas/test`

---

## Next Steps

Follow `build-guide.md` to:
1. Add drawing tools
2. Implement selection
3. Connect WebSocket
4. Add collaboration

Ready to start building! 🚀
