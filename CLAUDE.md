# CLAUDE_ESSENTIAL.md

Essential guide for Claude Code when working with this Next.js 15 POS system.

## 🎯 Project Overview

**Offline-First PWA POS** for tablets/iPads - Single-page architecture with perfect backend sync
- Target: iPad Air 2+, iOS 15+
- Student context: 6th semester, new to React/Next.js (from C# WinForms)
- Always: Complete code, clear explanations, ask if <95% confident

## 🏗️ Core Architecture

### Three-Tier Data System
```
SLOTS (UI State) → CART (Temp View) → ORDER OVERLAYS (Source of Truth)
     ↓                  ↓                       ↓
IndexedDB         In-Memory Only            IndexedDB
```

**Critical Flow:**
1. Menu → Add item → Cart auto-creates Order Overlay (IndexedDB)
2. Cart syncs with Overlay (all changes → IndexedDB)
3. Complete order → Overlay stays, Slot clears
4. Online → Sync Service sends completed orders to backend
5. Daily cleanup removes old synced orders

### Storage Distribution
```typescript
localStorage (5MB):
  "pos-order-counter": "0123"  // Fast incremental order IDs

IndexedDB (50GB+):
  - Order Overlays: Full order data (items, customer, totals, sync status)
  - Slots: UI state (id, status, timers, orderRefId reference)

Zustand (In-Memory):
  - Cart: Temporary UI window (no persistence)
  - Navigation: SPA state-based routing (no URLs)
```

## 📦 Key Stores & Responsibilities

### cart-new.ts - Temporary UI Window
- Display/edit current slot's order items
- Auto-sync changes to Order Overlay
- **NO persistence** (pure UI state)
```typescript
addItem() → Auto-creates overlay via cartSyncService
removeItem() → Syncs or removes overlay if empty
updateQuantity() → Syncs changes
```

### order-overlay.ts - Single Source of Truth
- **All order data** lives here (IndexedDB)
- Sync status tracking (pending/synced)
- Provides data to cart and orders page
```typescript
upsertFromCart() → Save/update order
getTodaysOrders() → Orders page display
markOrderSynced() → Backend confirmation
```

### unified-slots.ts - UI Containers
- Lightweight: id, status, timers, orderRefId only
- Persists across app restarts (IndexedDB)
```typescript
setSlotProcessing() → Start order, set orderRefId
setSlotAvailable() → Clear slot, remove orderRefId
computeTimers() → Update elapsed time (1s interval)
```

### navigation.ts - SPA Routing
- Pure state-based (no URLs!)
- Instant navigation (4-6x faster than URL routing)
```typescript
navigateToHome()
navigateToMenu('D1', 'dine-in', 'normal')
navigateToOrders()
```

## 🔑 Critical Patterns

### SSR Safety (ALWAYS Required)
```typescript
// ALWAYS guard IndexedDB access
const getDB = () => {
  if (typeof window === 'undefined') return null;
  return db;
};
```

### Cart Auto-Sync Pattern



```typescript
// In cart-new.ts actions:
addItem: (item) => {
  // 1. Update cart state immediately
  const updatedCart = { ...cart, items: [...items, item] };
  
  // 2. Auto-sync to overlay (background)
  syncCartToOverlay({
    orderId: cart.orderId,
    slotId: cart.slotId,
    items: updatedCart.items,
    customer: cart.customer,
    total: updatedCart.total,
    paymentStatus: 'unpaid',
    status: 'active'
  }).catch(error => console.error('Sync failed:', error));
}
```

### Order ID Generation
```typescript
// localStorage counter for fast, offline-safe IDs
generateOrderNumber(): "0001", "0002", "0003"...
// Existing orders NEVER change IDs
// New orders get next increment
```

## 💰 Key Features

### Payment Workflows
- **Pay Now**: Payment → Paid → Processing → Complete
- **Pay Later**: Unpaid → Processing → Later: Complete Payment
- Manager PIN required for editing paid items

### Differential Charging ✅
```typescript
// Professional POS pattern (Square/Toast/Clover style)
// Edit paid item → Only charge price difference
// Creates unpaid "upgrade" item for difference
// Example: $11 burger + $2 bacon = $2 charge, not $13
```

### Navigation (SPA)
```typescript
// NO URL routing - pure state changes
navigateToMenu('D1', 'dine-in', 'payment');  // Instant!
// Benefits: 4-6x faster, zero URL bugs, native app feel
```

## ✅ Development Rules

1. **Order Overlay First** - All order data → IndexedDB immediately
2. **Cart Never Persists** - Pure UI state (in-memory only)
3. **Slots Persist** - IndexedDB for survival across restarts
4. **Tailwind Only** - Never use CSS/style tags
5. **SSR Guards** - Always check `typeof window` before IndexedDB
6. **Complete Code** - No TODOs, placeholders, or "// rest of code"

## 🚫 Anti-Patterns

- ❌ Storing order data in slots (use orderRefId reference only)
- ❌ Cart persistence (causes hydration issues)
- ❌ Multiple truth sources for same data
- ❌ URL-based routing (use navigation store)
- ❌ Silent failures (always log errors)

## 🛠️ Tech Stack

- Next.js 15 + React 18 + TypeScript (strict)
- Zustand (professional patterns with selectors)
- IndexedDB + Dexie (offline storage)
- Tailwind CSS (utility-first, no style tags)
- PWA with next-pwa

## 📂 Essential Files

```
src/types/pos.ts                    # Core type definitions
src/lib/store/
  ├── order-overlay.ts              # Data source of truth (IndexedDB)
  ├── cart-new.ts                   # Cart UI window (in-memory)
  ├── unified-slots.ts              # Slot management (IndexedDB)
  └── navigation.ts                 # SPA routing (in-memory)
src/lib/services/
  └── cartSyncService.ts            # Centralized cart→overlay sync
src/app/page.tsx                    # SPA root (conditional rendering)
```

## 📝 Commands

```bash
npm run dev          # Start dev server (port 3000)
npm run build        # Production build
npm run type-check   # TypeScript validation
npx kill-port 3000   # Kill port when needed
```

## 🎯 When Reading Code

**Always check these files for context:**
1. `src/types/pos.ts` - Understand data structures
2. `src/lib/store/order-overlay.ts` - How orders are stored
3. `src/lib/store/cart-new.ts` - How cart syncs to overlays
4. Related component files before making changes

**Before making changes:**
- Understand the three-tier architecture
- Check if it affects overlay sync
- Verify SSR safety (typeof window checks)
- Test offline behavior

## 🏆 Production Ready

✅ Offline-first with perfect sync
✅ Pay now/later workflows
✅ Differential charging (professional POS)
✅ PWA SPA navigation (no URLs)
✅ Manager PIN security
✅ Zero data loss guarantees
✅ Scalable for millions of users

---

**Philosophy:** Native iPad app experience with instant state changes, zero URL complexity, and bulletproof offline-first data persistence.