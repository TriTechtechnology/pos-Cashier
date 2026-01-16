/**
 * INPUT VALIDATION SCHEMAS - SECURITY & DATA INTEGRITY
 *
 * Zod schemas for validating user input and preventing:
 * - XSS attacks (string sanitization)
 * - SQL injection (when backend connected)
 * - Data corruption (invalid values)
 * - Type coercion issues
 *
 * Usage:
 * import { OrderItemSchema, CustomerInfoSchema } from '@/lib/validation/schemas';
 * const result = OrderItemSchema.safeParse(data);
 * if (!result.success) {
 *   logger.error('Validation failed', result.error);
 * }
 */

import { z } from 'zod';

// ============================================================================
// HELPER SCHEMAS
// ============================================================================

/**
 * Safe string schema - prevents XSS and injection attacks
 * Trims whitespace, limits length, removes dangerous characters
 */
const SafeStringSchema = (maxLength = 200) => z
  .string()
  .trim()
  .min(1, 'This field is required')
  .max(maxLength, `Maximum ${maxLength} characters allowed`)
  .refine(
    (val) => !/<script|javascript:|on\w+=/i.test(val),
    'Invalid characters detected'
  );

/**
 * Optional safe string
 */
const OptionalSafeStringSchema = (maxLength = 200) => z
  .string()
  .trim()
  .max(maxLength)
  .optional()
  .or(z.literal(''));

/**
 * Price schema - validates monetary values
 */
const PriceSchema = z
  .number()
  .min(0, 'Price cannot be negative')
  .max(1000000, 'Price exceeds maximum allowed')
  .refine(
    (val) => Number.isFinite(val),
    'Invalid price value'
  );

/**
 * Quantity schema - validates item quantities
 */
const QuantitySchema = z
  .number()
  .int('Quantity must be a whole number')
  .min(1, 'Quantity must be at least 1')
  .max(1000, 'Quantity exceeds maximum allowed');

/**
 * Phone number schema - flexible but validated
 */
const PhoneSchema = z
  .string()
  .trim()
  .regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format')
  .min(7, 'Phone number too short')
  .max(20, 'Phone number too long')
  .optional();

/**
 * Email schema
 */
const EmailSchema = z
  .string()
  .trim()
  .email('Invalid email format')
  .max(100, 'Email too long')
  .optional();

// ============================================================================
// CART ITEM VALIDATION
// ============================================================================

/**
 * Modifier schema
 */
export const ModifierSchema = z.object({
  id: SafeStringSchema(50),
  name: SafeStringSchema(100),
  price: PriceSchema
});

/**
 * Cart item modifiers schema
 */
export const CartItemModifiersSchema = z.object({
  variations: z.array(ModifierSchema).optional(),
  addOns: z.array(ModifierSchema).optional(),
  specialInstructions: OptionalSafeStringSchema(500),
  notes: OptionalSafeStringSchema(500)
});

/**
 * Cart item schema
 */
export const CartItemSchema = z.object({
  id: SafeStringSchema(100),
  name: SafeStringSchema(200),
  description: OptionalSafeStringSchema(500),
  price: PriceSchema,
  quantity: QuantitySchema,
  totalPrice: PriceSchema,
  category: SafeStringSchema(100),
  modifiers: CartItemModifiersSchema.optional(),
  isPaid: z.boolean().optional(),
  paidQuantity: z.number().int().min(0).optional(),
  originalOrderId: OptionalSafeStringSchema(50),
  originalPaidPrice: PriceSchema.optional()
});

// ============================================================================
// CUSTOMER VALIDATION
// ============================================================================

/**
 * Customer info schema
 */
export const CustomerInfoSchema = z.object({
  id: OptionalSafeStringSchema(50),
  name: OptionalSafeStringSchema(100),
  phone: PhoneSchema,
  email: EmailSchema,
  specialInstructions: OptionalSafeStringSchema(1000),
  loyaltyCardId: OptionalSafeStringSchema(50),
  currentStamps: z.number().int().min(0).optional(),
  totalStamps: z.number().int().min(0).optional(),
  totalOrders: z.number().int().min(0).optional(),
  totalSpent: PriceSchema.optional()
});

// ============================================================================
// ORDER VALIDATION
// ============================================================================

/**
 * Order type enum
 */
export const OrderTypeSchema = z.enum(['dine-in', 'take-away', 'delivery', 'draft']);

/**
 * Payment status enum
 */
export const PaymentStatusSchema = z.enum(['paid', 'unpaid']);

/**
 * Order status enum
 */
export const OrderStatusSchema = z.enum([
  'active',
  'completed',
  'cancelled',
  'pending',
  'ready'
]);

/**
 * Order item schema
 */
export const OrderItemSchema = z.object({
  id: SafeStringSchema(100),
  name: SafeStringSchema(200),
  quantity: QuantitySchema,
  price: PriceSchema,
  total: PriceSchema,
  notes: OptionalSafeStringSchema(500),
  modifiers: CartItemModifiersSchema.optional(),
  isPaid: z.boolean().optional(),
  originalOrderId: OptionalSafeStringSchema(50)
});

/**
 * Order schema - complete order validation
 */
export const OrderSchema = z.object({
  id: SafeStringSchema(100),
  slotId: SafeStringSchema(50),
  orderType: OrderTypeSchema,
  status: OrderStatusSchema.optional(),
  items: z.array(OrderItemSchema).min(1, 'Order must have at least one item'),
  total: PriceSchema,
  subtotal: PriceSchema.optional(),
  tax: PriceSchema.optional(),
  customer: CustomerInfoSchema.optional(),
  paymentMethod: z.enum(['cash', 'card', 'online']).optional(),
  paymentStatus: PaymentStatusSchema.optional(),
  specialInstructions: OptionalSafeStringSchema(1000),
  placedAt: z.date().or(z.string().datetime()),
  updatedAt: z.date().or(z.string().datetime()),
  syncStatus: z.enum(['pending', 'syncing', 'synced', 'failed']).optional(),
  orderDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional()
});

// ============================================================================
// MENU ITEM VALIDATION
// ============================================================================

/**
 * Menu item schema
 */
export const MenuItemSchema = z.object({
  id: SafeStringSchema(100),
  name: SafeStringSchema(200),
  description: OptionalSafeStringSchema(500),
  price: PriceSchema,
  category: SafeStringSchema(100),
  image: OptionalSafeStringSchema(300),
  available: z.boolean()
});

// ============================================================================
// SYNC PAYLOAD VALIDATION
// ============================================================================

/**
 * Sync order payload schema - for backend integration
 */
export const SyncOrderPayloadSchema = OrderSchema.extend({
  deviceId: SafeStringSchema(50),
  syncedAt: z.string().datetime()
});

// ============================================================================
// VALIDATION HELPER FUNCTIONS
// ============================================================================

/**
 * Validate and sanitize input
 * Returns validated data or throws error
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`Validation failed: ${messages.join(', ')}`);
    }
    throw error;
  }
}

/**
 * Validate and sanitize input (safe version)
 * Returns success/failure with error details
 */
export function validateInputSafe<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const result = schema.safeParse(data);
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      const errors = result.error.errors.map(
        err => `${err.path.join('.')}: ${err.message}`
      );
      return { success: false, errors };
    }
  } catch (error) {
    return { success: false, errors: ['Validation error occurred'] };
  }
}

/**
 * Sanitize string to prevent XSS
 */
export function sanitizeString(input: string, maxLength = 200): string {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
}

/**
 * Validate price value
 */
export function isValidPrice(price: number): boolean {
  return (
    typeof price === 'number' &&
    Number.isFinite(price) &&
    price >= 0 &&
    price <= 1000000
  );
}

/**
 * Validate quantity value
 */
export function isValidQuantity(quantity: number): boolean {
  return (
    typeof quantity === 'number' &&
    Number.isInteger(quantity) &&
    quantity >= 1 &&
    quantity <= 1000
  );
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type SafeCartItem = z.infer<typeof CartItemSchema>;
export type SafeOrderItem = z.infer<typeof OrderItemSchema>;
export type SafeOrder = z.infer<typeof OrderSchema>;
export type SafeCustomerInfo = z.infer<typeof CustomerInfoSchema>;
export type SafeMenuItem = z.infer<typeof MenuItemSchema>;
export type SafeSyncPayload = z.infer<typeof SyncOrderPayloadSchema>;
