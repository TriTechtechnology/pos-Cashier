/**
 * POS System Types
 * 
 * PURPOSE: Central type definitions for the entire POS system including menu items,
 * orders, customers, slots, and all related data structures.
 * 
 * LINKS WITH:
 * - All POS components: Use these types for props and state
 * - All API services: Define request/response data structures
 * - All Zustand stores: Use these types for state management
 * - All hooks: Use these types for return values and parameters
 * - Mock data: Matches these type definitions
 * 
 * WHY: Essential for TypeScript type safety. Provides consistent data structures
 * across the entire application and ensures type compatibility between components.
 */

// POS System Types

export type OrderType = 'dine-in' | 'take-away' | 'delivery' | 'draft';
// Order Status for KDS Integration
// Current: 'available' | 'processing' | 'completed' | 'draft' | 'occupied'
// KDS-ready: 'pending' | 'ready' | 'cancelled' (for kitchen workflow)
export type OrderStatus = 'available' | 'processing' | 'completed' | 'draft' | 'occupied' | 'pending' | 'ready' | 'cancelled';
export type PaymentStatus = 'paid' | 'unpaid';
export type TimeStatus = 'fresh' | 'warning' | 'overdue';

export interface Slot {
  id: string;
  number: string; // Auto-generated: D1, T1, DL1, DR1
  status: OrderStatus;
  orderType: OrderType;
  paymentStatus?: PaymentStatus; // For processing and draft orders
  timeStatus?: TimeStatus; // For processing orders - affects outline color
  startTime?: Date; // When order was placed
  elapsedTime?: string; // Format: "00:15" (MM:SS)
  customerCount?: number;
  isActive?: boolean;
  
  // Order data (when processing)
  orderId?: string;
  customerName?: string;
  orderDetails?: OrderItem[]; // For draft and processing orders
  orderTotal?: number;
  orderCustomer?: CustomerInfo;
  paymentMethod?: string;
  specialInstructions?: string;
  
  // Metadata
  createdAt?: Date;
  updatedAt?: Date;
  syncedAt?: Date; // For future sync functionality
}

export interface Order {
  id: string;
  slotId: string;
  orderType: OrderType;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  customerInfo?: CustomerInfo;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  notes?: string;
  modifiers?: CartItemModifiers;
  isPaid?: boolean; // Track individual item payment status for mixed payments
  originalOrderId?: string; // Track which order this item originally came from

  // Payment tracking for bulletproof paid item management
  paidQuantity?: number;      // How many of this item were paid for (for partial payments)
  originalPaidPrice?: number; // Original price that was paid (for differential charging)
  originalPaidModifiers?: CartItemModifiers; // Original modifiers that were paid for

  // 🎯 CRITICAL: Preserve uniqueId for cart item editing (added to fix modifier editing bug)
  uniqueId?: string; // Cart-specific unique identifier for editing operations

  // 🎯 PROFESSIONAL: Differential charging - modifier upgrade items (non-editable)
  isModifierUpgrade?: boolean; // True if this is a differential charge item (cannot be edited directly)
}

export interface CustomerInfo {
  id?: string;
  name?: string;
  phone?: string;
  email?: string;
  specialInstructions?: string;
  loyaltyCardId?: string;
  currentStamps?: number;
  totalStamps?: number;
  totalOrders?: number;
  totalSpent?: number;
  memberSince?: string;
  orderHistory?: OrderHistoryItem[];
  fullOrderData?: Order[];
}

export interface OrderHistoryItem {
  id: string;
  total: number;
  date: string;
  items: string[]; // Item names for display
  status: 'completed' | 'cancelled' | 'refunded';
  stampsEarned?: number; // Optional to maintain backward compatibility
  stampsRedeemed?: number; // Optional to maintain backward compatibility
}

export interface MenuItemAddon {
  id: string;
  name: string;
  price: number;
  required?: boolean;
}

export interface MenuItemVariation {
  id: string;
  name: string;
  price: number;
  required?: boolean;
}

export interface MenuItemModifiers {
  variations?: MenuItemVariation[];
  addOns?: MenuItemAddon[];
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  image?: string;
  available: boolean;
  // Modifiers (variations and addons from backend)
  modifiers?: MenuItemModifiers;
  // Custom item flags
  isCustomItem?: boolean; // True if this is a cashier-created custom item
  isCustomTemplate?: boolean; // True if this is the "Add Custom Item" template button
  createdAt?: Date; // When custom item was created
  createdBy?: string; // Which cashier created it
}

export interface CartItemModifiers {
  variations?: Array<{ id: string; name: string; price: number }>;
  addOns?: Array<{ id: string; name: string; price: number }>;
  specialInstructions?: string;
  notes?: string;
}

export interface CartItem extends MenuItem {
  modifiers?: CartItemModifiers;
  totalPrice: number;
  originalPrice: number;
  quantity: number;
  discount?: number;
}

export interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
}

// Loyalty System Types
export interface LoyaltyCard {
  id: string;
  customerId: string;
  stamps: number;
  maxStamps: number;
  rewards: LoyaltyReward[];
  lastVisit?: Date;
}

export interface LoyaltyReward {
  id: string;
  name: string;
  description: string;
  stampsRequired: number;
  discount?: number;
  freeItem?: string;
  isRedeemed: boolean;
}

// QR Code Types
export interface QRCodeData {
  type: 'loyalty' | 'order';
  data: LoyaltyCard | Order;
  timestamp: Date;
}

// POS Terminal & Till Management Types
export type TillStatus = 'closed' | 'open';

export interface POSTerminal {
  id: string;              // Frontend uses 'id'
  _id?: string;            // Backend returns '_id' (MongoDB)
  branchId: string;
  machineId: string;
  name: string;
  status: 'active' | 'inactive' | 'maintenance';
  metadata?: {
    ip?: string;
    location?: string;
    [key: string]: any;
  };
  lastSeenAt?: Date | null;
  createdBy?: string;
  updatedBy?: string | null;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  __v?: number;            // MongoDB version field
}

export interface CashCounts {
  [denomination: string]: number; // e.g., "100": 5, "50": 10, "20": 15
}

export interface TillSession {
  id: string;
  branchId: string;
  posId: string;
  userId: string;
  status: TillStatus;

  // Opening details
  openingAmount: number;
  openingCashCounts?: CashCounts;
  openingNotes?: string;
  openedAt: Date;

  // Closing details
  declaredClosingAmount?: number;
  systemClosingAmount?: number;
  closingCashCounts?: CashCounts;
  closingNotes?: string;
  closedAt?: Date;

  // Sync status
  syncStatus: 'pending' | 'synced' | 'failed';
  syncedAt?: Date;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// Branch Configuration Types (Pay Now/Pay Later, Receipt Settings)
export type PaymentMode = 'payNow' | 'payLater';

export interface ReceiptConfig {
  showLogo: boolean;
  logoUrl: string;
  showQRCode?: boolean;
  qrCodeData?: string;
  headerText?: string;
  footerText: string;
  showTaxBreakdown?: boolean;
  showItemCodes?: boolean;
  paperWidth?: number;
  fontSizeMultiplier?: number;
}

export interface PaymentMethodConfig {
  enabled: boolean;
  taxRateOverride?: number | null;
  minAmount?: number;
}

export interface PaymentMethodsConfig {
  cash: PaymentMethodConfig;
  card: PaymentMethodConfig;
  mobile: PaymentMethodConfig;
}

export interface TaxConfig {
  mode: 'inclusive' | 'exclusive';
  rate: number;
  vatNumber?: string;
}

export interface POSConfig {
  orderPrefix?: string;
  receiptFooter?: string;
  enableHoldOrders?: boolean;
  enableTableService: boolean;
  paymentMode: PaymentMode;
  receiptConfig: ReceiptConfig;
  paymentMethods: PaymentMethodsConfig;
}

export interface BranchConfig {
  branchId: string;
  branchName: string;
  currency: string;
  timezone?: string;
  tax?: TaxConfig;
  posConfig?: POSConfig;
  // Flattened fields from API response
  paymentMode?: PaymentMode;
  enableTableService?: boolean;
  receiptConfig?: ReceiptConfig;
  paymentMethods?: PaymentMethodsConfig;
}
