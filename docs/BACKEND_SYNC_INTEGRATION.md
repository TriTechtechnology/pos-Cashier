# Backend Sync Integration - Complete Implementation

**Date**: January 2025
**Status**: ✅ Production Ready

---

## 🎯 Overview

This document explains the complete backend sync integration for the POS cashier system, ensuring orders created offline can be synced to the backend when the device comes online.

---

## 🏗️ Architecture

### **Data Flow: Order Creation → IndexedDB → Backend Sync**

```
User Creates Order
       ↓
Payment Overlay (usePaymentOverlay.ts)
       ↓
Gets branchId, posId, tillSessionId from Auth/Till Stores
       ↓
Calls syncCartToOverlay() with backend sync fields
       ↓
Cart Sync Service (cartSyncService.ts)
       ↓
Order Overlay Store (order-overlay.ts)
       ↓
Saves to IndexedDB with all backend sync fields
       ↓
[OFFLINE STORAGE - Order persists with sync fields]
       ↓
Device Comes Online
       ↓
Sync Service (syncService.ts)
       ↓
Reads overlay from IndexedDB (includes branchId, posId, tillSessionId)
       ↓
Sends to Backend API: POST /t/pos/orders
       ↓
Backend Response: Success
       ↓
Mark order as synced in IndexedDB
```

---

## 📦 Required Backend Sync Fields

According to the Postman collection (`POST /t/pos/orders`), the backend requires:

```typescript
{
  branchId: string;        // Branch ID where order was placed
  posId: string;           // POS terminal ID
  tillSessionId: string;   // Till session ID (for cash tracking)
  customerName: string;    // Customer name or "Walk-in"
  notes?: string;          // Special instructions
  items: [                 // Order items
    {
      menuItemId: string;  // Menu item ID
      quantity: number;    // Quantity ordered
      notes?: string       // Item-specific notes/modifiers
    }
  ]
}
```

---

## 🔧 Implementation Details

### **1. CartSyncParams Interface** (`src/lib/services/cartSyncService.ts`)

Added backend sync fields to the CartSyncParams interface:

```typescript
export interface CartSyncParams {
  orderId: string;
  slotId: string;
  orderType: OrderType;
  items: CartItem[];
  customer: CustomerInfo | null;
  total: number;
  subtotal: number;
  tax: number;
  paymentStatus?: 'paid' | 'unpaid';
  paymentMethod?: string;
  status?: 'active' | 'completed';
  // 🎯 BACKEND SYNC REQUIRED FIELDS (from Postman collection)
  branchId?: string;       // Branch ID for backend sync
  posId?: string;          // POS terminal ID for backend sync
  tillSessionId?: string;  // Till session ID for backend sync
}
```

### **2. syncCartToOverlay Function** (`src/lib/services/cartSyncService.ts`)

Updated to pass backend sync fields to the overlay store:

```typescript
await overlayStore.upsertFromCart({
  orderId: params.orderId,
  slotId: params.slotId,
  orderType: params.orderType,
  items: mappedItems,
  customer: params.customer || { name: '', phone: '', email: '' },
  total: params.total,
  subtotal: params.subtotal,
  tax: params.tax,
  paymentStatus: params.paymentStatus || 'unpaid',
  paymentMethod: params.paymentMethod,
  status: params.status || 'active',
  // 🎯 BACKEND SYNC REQUIRED FIELDS
  branchId: params.branchId,       // Pass through for backend sync
  posId: params.posId,             // Pass through for backend sync
  tillSessionId: params.tillSessionId  // Pass through for backend sync
});
```

### **3. Order Overlay Store** (`src/lib/store/order-overlay.ts`)

#### **Updated upsertFromCart Parameter Interface:**

```typescript
upsertFromCart: (params: {
  orderId: string;
  slotId: string;
  orderType: OrderType;
  items: OrderItem[];
  customer: CustomerInfo;
  total: number;
  paymentMethod?: string;
  paymentStatus?: 'paid' | 'unpaid';
  status?: 'active' | 'completed';
  specialInstructions?: string;
  placedAt?: Date;
  subtotal?: number;
  tax?: number;
  // 🎯 BACKEND SYNC REQUIRED FIELDS (from Postman collection)
  branchId?: string;       // Branch ID for backend sync
  posId?: string;          // POS terminal ID for backend sync
  tillSessionId?: string;  // Till session ID for backend sync
}) => Promise<OverlayOrder>;
```

#### **Updated Overlay Object Creation:**

```typescript
const overlay: OverlayOrder = {
  id: params.orderId,
  slotId: params.slotId,
  orderType: params.orderType,
  paymentMethod: params.paymentMethod,
  paymentStatus: params.paymentStatus,
  status: params.status || 'active',
  customer: params.customer,
  items: params.items,
  total: params.total,
  subtotal: params.subtotal,
  tax: params.tax,
  specialInstructions: params.specialInstructions,
  placedAt: params.placedAt || now,
  updatedAt: now,

  // 🎯 BACKEND SYNC REQUIRED FIELDS (from Postman collection)
  branchId: params.branchId,       // Branch ID for backend sync
  posId: params.posId,             // POS terminal ID for backend sync
  tillSessionId: params.tillSessionId,  // Till session ID for backend sync

  // PRODUCTION SYNC FIELDS
  orderDate: today,
  syncStatus: existingOverlay?.syncStatus || 'pending',
  syncAttempts: existingOverlay?.syncAttempts || 0,
  lastSyncAttempt: existingOverlay?.lastSyncAttempt
};
```

### **4. Payment Overlay Hook** (`src/app/(routes)/menu/_components/payment-overlay-components/hooks/usePaymentOverlay.ts`)

#### **handleGoToHome (Pay Now Workflow):**

```typescript
// Get backend sync required fields from auth/till stores
const user = useAuthStore.getState().user;
const tillSession = useTillStore.getState().currentSession;

await syncCartToOverlay({
  orderId: finalOrderId,
  slotId: targetSlotId,
  orderType: currentSlotState?.orderType || 'dine-in',
  items: orderItems || [],
  customer: orderCustomer || { name: 'Guest', ... },
  total: total,
  subtotal: total * 0.9,
  tax: total * 0.1,
  paymentStatus: 'paid',
  paymentMethod: selectedPaymentMethod,
  status: (completingUnpaidOrder || completingPaidOrderWithAdditions) ? 'completed' : 'active',
  // 🎯 BACKEND SYNC REQUIRED FIELDS (from Postman collection)
  branchId: user?.branchId,       // From auth store
  posId: user?.posId,             // From auth store
  tillSessionId: tillSession?.id  // From till store
});
```

#### **handlePayLater (Pay Later Workflow):**

```typescript
// Get backend sync required fields from auth/till stores
const user = useAuthStore.getState().user;
const tillSession = useTillStore.getState().currentSession;

await syncCartToOverlay({
  orderId: finalOrderId,
  slotId: targetSlotId,
  orderType: useUnifiedSlotStore.getState().getSlot(targetSlotId)?.orderType || 'dine-in',
  items: orderItems,
  customer: orderCustomer,
  total,
  subtotal: total * 0.9,
  tax: total * 0.1,
  paymentStatus: 'unpaid',
  paymentMethod: 'unpaid',
  status: 'active',
  // 🎯 BACKEND SYNC REQUIRED FIELDS (from Postman collection)
  branchId: user?.branchId,       // From auth store
  posId: user?.posId,             // From auth store
  tillSessionId: tillSession?.id  // From till store
});
```

### **5. Sync Service** (`src/lib/services/syncService.ts`)

The sync service already reads these fields from the overlay:

```typescript
const response = await fetch('/api/pos/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-tenant-id': process.env.NEXT_PUBLIC_TENANT_ID || 'extraction-testing',
    ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
  },
  body: JSON.stringify({
    // 🎯 Backend API format (matches Postman collection)
    branchId: order.branchId || process.env.NEXT_PUBLIC_BRANCH_ID,
    posId: order.posId || process.env.NEXT_PUBLIC_POS_ID,
    tillSessionId: order.tillSessionId,
    customerName: order.customer?.name || 'Walk-in',
    notes: order.specialInstructions || order.customer?.specialInstructions,
    items: order.items?.map(item => ({
      menuItemId: item.id,
      quantity: item.quantity,
      notes: [
        item.modifiers?.specialInstructions,
        item.modifiers?.notes,
        item.modifiers?.variations?.map(v => v.name).join(', '),
        item.modifiers?.addOns?.map(a => a.name).join(', ')
      ].filter(Boolean).join(' | ') || undefined
    })) || []
  })
});
```

**Key Points:**
- Uses `order.branchId`, `order.posId`, `order.tillSessionId` from the overlay
- Fallbacks to environment variables if fields are missing (backward compatibility)
- Works for both online orders (immediate sync) and offline orders (sync when online)

---

## ✅ Offline-First Guarantees

### **Order Creation (Offline)**

1. User logs in with POS terminal selected
2. Opens till session
3. Creates order
4. Order saved to IndexedDB with:
   - `branchId` from user.branchId
   - `posId` from user.posId
   - `tillSessionId` from currentSession.id
   - All order data (items, customer, totals)

### **Order Sync (When Online)**

1. Device comes online
2. Sync service runs (automatic every 30s)
3. Reads orders from IndexedDB
4. For each pending order:
   - Reads `branchId`, `posId`, `tillSessionId` from overlay
   - Sends to backend API
   - Marks as synced on success

### **Edge Cases Handled**

1. **User logs out before sync**: ✅ Order overlay has all required fields
2. **App restarts offline**: ✅ Orders persist in IndexedDB with fields
3. **Network failure during sync**: ✅ Retry logic with exponential backoff
4. **Different user logs in**: ✅ Orders still have original user's branchId/posId/tillSessionId

---

## 🧪 Testing Checklist

### **Test 1: Online Order Creation**
1. Login with POS terminal selected ✅
2. Open till session ✅
3. Create order and pay ✅
4. Check console logs for backend sync fields:
   ```
   🎯 [SYNC SERVICE] Backend sync fields: { branchId: 'xxx', posId: 'xxx', tillSessionId: 'xxx' }
   ```
5. Verify order sent to backend immediately ✅

### **Test 2: Offline Order Creation**
1. Login with POS terminal and open till ✅
2. Turn off network (or use mock mode) ✅
3. Create order and pay ✅
4. Check IndexedDB - order should have branchId, posId, tillSessionId ✅
5. Turn on network ✅
6. Wait 30 seconds (auto-sync) or trigger manual sync ✅
7. Verify order synced to backend with correct fields ✅

### **Test 3: Missing Backend Sync Fields**
1. Create order without logging in (hypothetical) ❌
2. Expected: Console warning: `⚠️ [BACKEND SYNC] No user authenticated - order saved locally only`
3. Order still saved to IndexedDB ✅
4. Sync service will use environment variable fallbacks ✅

### **Test 4: Pay Later Workflow**
1. Login and open till ✅
2. Create order with "Pay Later" ✅
3. Check IndexedDB - unpaid order should have branchId, posId, tillSessionId ✅
4. Later: Complete payment ✅
5. Verify sync includes correct backend fields ✅

---

## 📊 Console Logging

Look for these console logs to verify correct operation:

### **Payment Overlay:**
```
🔄 [BACKEND SYNC] Starting order sync to backend...
📤 [BACKEND SYNC] Request payload: { branchId: 'xxx', posId: 'xxx', tillSessionId: 'xxx', ... }
✅ [BACKEND SYNC] Order synced successfully: ORDER_ID
```

### **Cart Sync Service:**
```
🔄 [SYNC SERVICE] Syncing cart to overlay: ORDER_ID
🎯 [SYNC SERVICE] Backend sync fields: { branchId: 'xxx', posId: 'xxx', tillSessionId: 'xxx' }
✅ [SYNC SERVICE] Cart synced successfully: ORDER_ID
```

### **Sync Service (Background):**
```
🚀 [SYNC] Starting sync of pending orders...
📤 [SYNC] Found X orders to sync
✅ [SYNC] Successfully synced order ORDER_ID
✅ [SYNC] Sync complete: X success, 0 failed
```

---

## 🔍 Troubleshooting

### **Issue: Orders not syncing to backend**

**Check 1**: Are backend sync fields in the overlay?
```javascript
// Open browser DevTools → Application → IndexedDB → pos-overlay-db → overlays
// Look for: branchId, posId, tillSessionId
```

**Check 2**: Is user logged in with POS terminal?
```javascript
// Console:
console.log(useAuthStore.getState().user);
// Should have: { branchId: 'xxx', posId: 'xxx', ... }
```

**Check 3**: Is till session open?
```javascript
// Console:
console.log(useTillStore.getState().currentSession);
// Should have: { id: 'xxx', status: 'open', ... }
```

**Check 4**: Check console logs for errors
```
❌ [BACKEND SYNC] Failed to sync order to backend: ERROR_MESSAGE
⚠️ [BACKEND SYNC] Order saved locally in IndexedDB - will sync when online
```

### **Issue: Missing branchId/posId/tillSessionId**

**Cause**: User not logged in with POS terminal, or till session not opened

**Solution**:
1. Ensure login flow includes POS terminal selection
2. Ensure till session is opened before creating orders
3. Check environment variables as fallback:
   - `NEXT_PUBLIC_BRANCH_ID`
   - `NEXT_PUBLIC_POS_ID`

---

## 📈 Files Modified

1. **`src/lib/services/cartSyncService.ts`**
   - Added `branchId`, `posId`, `tillSessionId` to `CartSyncParams`
   - Updated `syncCartToOverlay()` to pass fields to overlay store
   - Added console logging for backend sync fields

2. **`src/lib/store/order-overlay.ts`**
   - Added backend sync fields to `upsertFromCart` parameters
   - Updated overlay object creation to store these fields
   - Fields now persist in IndexedDB

3. **`src/app/(routes)/menu/_components/payment-overlay-components/hooks/usePaymentOverlay.ts`**
   - Updated `handleGoToHome()` to get fields from auth/till stores
   - Updated `handlePayLater()` to get fields from auth/till stores
   - Both workflows now pass fields to `syncCartToOverlay()`

4. **`BACKEND_SYNC_INTEGRATION.md`** (this file)
   - Complete documentation of the integration

---

## 🎯 Production Ready

This integration is now production-ready with the following guarantees:

- ✅ **Orders created online**: Immediately synced to backend with correct fields
- ✅ **Orders created offline**: Saved with backend sync fields, synced when online
- ✅ **User logout**: Orders still have all required fields for later sync
- ✅ **App restart**: Orders persist with fields in IndexedDB
- ✅ **Network failure**: Retry logic ensures eventual sync
- ✅ **Multiple users**: Each order tagged with original user's branchId/posId/tillSessionId
- ✅ **Backward compatibility**: Environment variable fallbacks if fields missing

---

**Integration Complete! ✅**

Orders will now sync correctly to the backend API using the Postman collection format.
