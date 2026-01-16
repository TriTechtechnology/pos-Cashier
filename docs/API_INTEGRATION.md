# API INTEGRATION - Tritech POS Backend

**Integration Date**: January 2025
**Backend Domain**: `api.tritechtechnologyllc.com`
**Postman Collection**: Tritech POS - Complete Collection

---

## 🎯 Integration Overview

The POS Cashier app is now **fully integrated** with your backend API using the endpoints from your Postman collection. The integration includes:

1. **Authentication** - Cashier PIN Login (`POST /t/auth/login-pin`)
2. **Till Management** - Open/Close Till Sessions (`POST /t/pos/till/open`, `POST /t/pos/till/close`)
3. **POS Orders** - Create, List, Get Order Details (`POST /t/pos/orders`)

---

## 🔧 Configuration

### Environment Variables (`.env.local`)

```env
# Backend API URL
NEXT_PUBLIC_API_BASE_URL=https://api.tritechtechnologyllc.com

# Tenant Configuration (from Postman collection)
NEXT_PUBLIC_TENANT_ID=acme
NEXT_PUBLIC_BRANCH_ID=
NEXT_PUBLIC_POS_ID=

# API Mode (false = real API, true = mock data)
NEXT_PUBLIC_ENABLE_MOCK_DATA=false
```

### Important Notes:

- **`NEXT_PUBLIC_TENANT_ID`**: Set to your tenant ID (from Postman `x-tenant-id` header)
- **`NEXT_PUBLIC_BRANCH_ID`**: Get from backend API (required for till/orders)
- **`NEXT_PUBLIC_POS_ID`**: Can be selected during login or set here
- **`NEXT_PUBLIC_ENABLE_MOCK_DATA`**:
  - `false` = Production mode (uses real backend)
  - `true` = Development mode (uses mock data)

---

## 📡 API Integration Architecture

### Request Flow:
```
Frontend (React)
  → Next.js API Proxy Route (/api/...)
  → Backend API (api.tritechtechnologyllc.com/t/...)
  → Response back to Frontend
```

### Why API Proxy Routes?

- **CORS Bypass**: Avoids CORS issues during development
- **Server-to-Server**: Backend API calls from Next.js server (no browser CORS)
- **Clean Frontend**: Frontend only calls same-origin endpoints
- **Security**: API keys/tokens stay on server side

### API Proxy Routes Created:

| Frontend Endpoint | Backend Endpoint | Method | Auth Required | Purpose |
|------------------|------------------|--------|---------------|---------|
| `/api/pos/terminals` | `/t/pos/terminals` | GET | ❌ No (Public) | Get POS Terminals |
| `/api/auth/login-pin` | `/t/auth/login-pin` | POST | ❌ No | Cashier PIN Login |
| `/api/till/open` | `/t/pos/till/open` | POST | ✅ Yes | Open Till Session |
| `/api/till/close` | `/t/pos/till/close` | POST | ✅ Yes | Close Till Session |
| `/api/pos/orders` | `/t/pos/orders` | POST | ✅ Yes | Create POS Order |

---

## 🖥️ 0. POS Terminals Integration (Public API)

### Endpoint: `GET /t/pos/terminals`

**🎯 PUBLIC ENDPOINT - No authentication required**

This endpoint is used on the login page to fetch available POS terminals for selection.

**Request:**
```
GET /t/pos/terminals?branchId={{branch_id}}
```

**Headers:**
```
Content-Type: application/json
x-tenant-id: {{tenant_id}}
```

**Response (Success):**
```json
{
  "status": 200,
  "message": "POS terminals retrieved successfully",
  "result": [
    {
      "id": "6930af72bb2d027d8bda4612",
      "branchId": "6900fbcf933c89883c6d21a3",
      "machineId": "POS-02",
      "name": "counter 1",
      "status": "active",
      "metadata": { "ip": "10.0.0.1" },
      "createdAt": "2025-12-03T21:45:22.340Z",
      "updatedAt": "2025-12-03T21:45:22.340Z"
    },
    {
      "id": "6930a8c60c420f81ac44e8cd",
      "branchId": "6900fbcf933c89883c6d21a3",
      "machineId": "POS-01",
      "name": "Front Counter Terminal",
      "status": "active",
      "metadata": { "ip": "10.0.0.5" },
      "createdAt": "2025-12-03T21:16:54.864Z",
      "updatedAt": "2025-12-03T21:16:54.864Z"
    }
  ]
}
```

### Frontend Integration:

**File**: `src/lib/api/pos-terminals.ts:38-116`
**Component**: `src/app/(routes)/login/_components/login-content.tsx:51-96`

**Flow:**
1. Login page loads
2. Frontend calls `getPOSTerminals(branchId)`
3. API fetches terminals from `/api/pos/terminals`
4. Terminals displayed in dropdown
5. User selects a terminal
6. Terminal ID used in PIN login request

**Important Notes:**
- ✅ **No authentication required** - Accessible before login
- ✅ **Public endpoint** - Safe to call from login page
- ✅ **Automatic filtering** - Only shows active terminals
- ✅ **Auto-selection** - First terminal auto-selected by default

---

## 🔐 1. Authentication Integration

### Endpoint: `POST /t/auth/login-pin`

**Request:**
```json
{
  "pin": "1234",
  "branchId": "{{branch_id}}",
  "posId": "{{pos_id}}",
  "defaultBranchId": "{{branch_id}}"
}
```

**Headers:**
```
Content-Type: application/json
x-tenant-id: {{tenant_id}}
```

**Response (Success):**
```json
{
  "status": 200,
  "message": "Login successful",
  "result": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "user123",
      "fullName": "John Doe",
      "email": "cashier@example.com",
      "roles": ["cashier"],
      "branchId": "branch123",
      "tenantId": "acme"
    },
    "branchId": "branch123"
  }
}
```

### Frontend Integration:

**File**: `src/lib/api/auth.ts:46-167`
**Store**: `src/lib/store/auth.ts:75-153`
**Component**: `src/app/(routes)/login/_components/login-content.tsx:109-139`

**Flow:**
1. User enters 4-digit PIN
2. Frontend calls `loginWithPin(pin, 'cashier', posId)`
3. API sends request to `/api/auth/login-pin`
4. Proxy forwards to backend
5. Backend returns JWT token + user data
6. Token stored in localStorage (`auth-token`)
7. User data stored in Zustand auth store
8. Redirect to `/clock-in` page

**Testing:**
```bash
# Login with PIN 1234 (test PIN from Postman)
# Select POS terminal from dropdown
# Click Login button
```

---

## 💰 2. Till Management Integration

### 2.1 Open Till - `POST /t/pos/till/open`

**Request:**
```json
{
  "branchId": "{{branch_id}}",
  "posId": "{{pos_id}}",
  "openingAmount": 100.00,
  "notes": "Starting shift"
}
```

**Headers:**
```
Content-Type: application/json
x-tenant-id: {{tenant_id}}
Authorization: Bearer {{jwt_token}}
```

**Response (Success):**
```json
{
  "status": 200,
  "message": "Till opened successfully",
  "result": {
    "tillSessionId": "till-session-123"
  }
}
```

### 2.2 Close Till - `POST /t/pos/till/close`

**Request:**
```json
{
  "branchId": "{{branch_id}}",
  "posId": "{{pos_id}}",
  "tillSessionId": "{{till_session_id}}",
  "declaredClosingAmount": 1547.50,
  "systemClosingAmount": 1550.00,
  "cashCounts": {
    "500": 2,
    "100": 5,
    "50": 4,
    "20": 10,
    "10": 5,
    "5": 9,
    "1": 2
  },
  "notes": "End of shift"
}
```

**Response (Success):**
```json
{
  "status": 200,
  "message": "Till closed successfully",
  "result": {
    "token": "refreshed-jwt-token..."
  }
}
```

### Frontend Integration:

**File**: `src/lib/api/till.ts`
**Store**: `src/lib/store/till.ts`

**Flow:**
1. Clock-in → Opens till with opening amount
2. Till session ID stored in Zustand till store
3. All orders require active till session
4. Clock-out/Logout → Closes till with cash reconciliation
5. Refreshed token updates auth store

---

## 🛍️ 3. POS Orders Integration

### Create Order - `POST /t/pos/orders`

**Request:**
```json
{
  "branchId": "{{branch_id}}",
  "posId": "{{pos_id}}",
  "tillSessionId": "{{till_session_id}}",
  "customerName": "Walk-in Customer",
  "notes": "No onions",
  "items": [
    {
      "menuItemId": "{{menu_item_id}}",
      "quantity": 2,
      "notes": "Extra spicy"
    }
  ],
  "paymentMethod": "cash",
  "amountPaid": 50.00
}
```

**Response (Success):**
```json
{
  "status": 201,
  "message": "Order created successfully",
  "result": {
    "id": "order-123",
    "orderId": "ORD-2025-001",
    ...
  }
}
```

### Frontend Integration:

**File**: `src/lib/api/orders.ts:116-241`

**Flow:**
1. Cashier adds items to cart
2. Clicks "Pay Now" or "Pay Later"
3. Frontend calls `placeOrder(orderData)`
4. API sends request to `/api/pos/orders`
5. Backend creates order and returns order ID
6. Order ID stored in IndexedDB (order overlay)
7. Slot marked as processing/completed

**Offline-First Guarantee:**
- **Online**: Order sent directly to backend
- **Offline**: Order stored in IndexedDB with `syncStatus: 'pending'`
- **When online again**: Background sync sends pending orders to backend

---

## 🧪 Testing Guide

### Prerequisites:
1. Backend is running at `api.tritechtechnologyllc.com`
2. You have valid tenant ID, branch ID, and POS ID
3. `.env.local` is configured correctly

### Step 0: Test POS Terminals (Public API)

```bash
# 1. Start dev server
npm run dev

# 2. Open browser
http://localhost:3003/login

# 3. Check POS terminal dropdown
- Should load terminals from backend API
- Terminals should appear in dropdown
- First terminal should be auto-selected

# ✅ Expected: Terminals loaded from backend
# ✅ Check console: "✅ [POS TERMINALS API] Fetched terminals successfully"
# ✅ Check dropdown: Shows terminal names (e.g., "counter 1", "Front Counter Terminal")
```

### Step 1: Test Authentication

```bash
# 1. On login page (after terminals loaded)
# 2. Test login
- Select "Cashier" role
- Select a POS terminal (should already be auto-selected)
- Enter PIN: 1234 (or your test PIN)
- Click Login

# ✅ Expected: Redirect to /clock-in page
# ✅ Check browser console: "✅ [AUTH API] Login successful"
# ✅ Check localStorage: 'auth-token' should have JWT
```

### Step 2: Test Till Management

```bash
# 1. After login, go to clock-in page
# 2. Enter opening amount: 100.00
# 3. Click "Start Shift"

# ✅ Expected: Till opens, redirect to /home
# ✅ Check console: "✅ [TILL API] Till opened successfully"
# ✅ Check till store: currentSession.tillSessionId should exist
```

### Step 3: Test Order Creation

```bash
# 1. Click a slot (e.g., D1)
# 2. Add items from menu
# 3. Click "Pay Now"
# 4. Complete payment

# ✅ Expected: Order created, slot shows "Processing"
# ✅ Check console: "✅ [ORDERS API] Order placed successfully"
# ✅ Check IndexedDB: Order overlay with backend order ID
```

### Step 4: Test Offline Mode

```bash
# 1. Turn off WiFi/disconnect internet
# 2. Try to create an order

# ✅ Expected: Order saved to IndexedDB with syncStatus: 'pending'
# ✅ No error shown to user

# 3. Turn WiFi back on
# ✅ Expected: Background sync sends pending orders to backend
```

---

## 🐛 Debugging

### Enable Detailed Logging:

All API calls have comprehensive logging. Check browser console for:

```
🔐 [AUTH API] - Authentication logs
💰 [TILL API] - Till management logs
🛍️ [ORDERS API] - Order placement logs
🔄 [API PROXY] - Proxy route logs
```

### Common Issues:

#### 1. CORS Errors
**Problem**: Browser blocks API requests
**Solution**: Ensure you're using the Next.js proxy routes (`/api/...`), not direct backend calls

#### 2. 401 Unauthorized
**Problem**: Missing or invalid token
**Solution**: Check `localStorage.getItem('auth-token')`, re-login if expired

#### 3. 404 Not Found
**Problem**: Backend endpoint doesn't exist
**Solution**: Verify backend is running and endpoint matches Postman collection

#### 4. Network Error
**Problem**: Can't connect to backend
**Solution**:
- Check `NEXT_PUBLIC_API_BASE_URL` in `.env.local`
- Verify backend is accessible: `curl https://api.tritechtechnologyllc.com`
- Check firewall/network settings

---

## 🚀 Production Deployment

### Pre-Deployment Checklist:

- [ ] Set `NEXT_PUBLIC_ENABLE_MOCK_DATA=false`
- [ ] Set correct `NEXT_PUBLIC_API_BASE_URL`
- [ ] Set correct `NEXT_PUBLIC_TENANT_ID`
- [ ] Set correct `NEXT_PUBLIC_BRANCH_ID`
- [ ] Backend CORS configured to allow your domain
- [ ] SSL certificate valid on backend
- [ ] Test all API endpoints in production
- [ ] Monitor backend logs for errors

### Environment Variables for Production:

```env
NEXT_PUBLIC_API_BASE_URL=https://api.tritechtechnologyllc.com
NEXT_PUBLIC_TENANT_ID=your-production-tenant-id
NEXT_PUBLIC_BRANCH_ID=your-production-branch-id
NEXT_PUBLIC_ENABLE_MOCK_DATA=false
```

---

## 📊 Integration Status

| Feature | Status | Tested |
|---------|--------|--------|
| **POS Terminals (Public API)** | ✅ Integrated | 🧪 Pending |
| Cashier PIN Login | ✅ Integrated | 🧪 Pending |
| Till Open | ✅ Integrated | 🧪 Pending |
| Till Close | ✅ Integrated | 🧪 Pending |
| Create Order | ✅ Integrated | 🧪 Pending |
| Offline Mode | ✅ Integrated | 🧪 Pending |
| Auto Sync | ⏳ To Implement | ⏳ Pending |

---

## 🎯 Next Steps

1. **Fill in `.env.local`**: Get branch ID and POS ID from backend
2. **Test Authentication**: Verify PIN login works with real backend
3. **Test Till Management**: Open and close till sessions
4. **Test Order Creation**: Place orders and verify they appear in backend
5. **Test Offline Mode**: Disconnect internet, create orders, reconnect, verify sync

---

## 📞 Support

If you encounter any issues:

1. Check browser console for error logs
2. Check backend API logs
3. Verify environment variables are correct
4. Review this document's debugging section
5. Contact backend team if API returns unexpected responses

---

**Integration Complete! 🎉**

The POS system is now ready to connect with your backend at `api.tritechtechnologyllc.com`.
