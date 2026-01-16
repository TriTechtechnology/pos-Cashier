/**
 * Receipt Printing Utilities
 *
 * PURPOSE: Handles receipt generation and printing for order placement.
 * Provides formatted receipts with order details, customer info, and totals.
 *
 * LINKS WITH:
 * - Payment Flow: Print receipt after successful payment
 * - Order Management: Print order details for kitchen/customer
 * - Settings: Printer configuration and business info
 *
 * WHY: Centralizes receipt formatting and printing logic.
 * Provides consistent receipt format across the application.
 */

import { formatCurrency } from './format';
import type { CartItem } from '@/lib/store/cart-new';

export interface ReceiptData {
  // Business Information
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  businessEmail?: string;
  businessTaxId?: string;

  // Order Information
  orderNumber: string;
  slotId: string;
  orderType: 'dine-in' | 'take-away' | 'delivery';
  paymentMethod: 'cash' | 'card' | 'online' | 'unpaid';
  placedAt: Date;

  // Customer Information
  customerName?: string;
  customerPhone?: string;
  specialInstructions?: string;

  // Order Items
  items: CartItem[];

  // Financial Details
  subtotal: number;
  tax: number;
  discount?: number;
  total: number;
  cashReceived?: number;
  change?: number;

  // Staff Information
  cashierName: string;
  cashierId?: string;
}

export interface PrinterConfig {
  enabled: boolean;
  printerName?: string;
  paperWidth: 80 | 58; // mm
  autoprint: boolean;
  copies: number;
  includeLogo: boolean;
  logoUrl?: string;
  footerMessage?: string;
}

// Default printer configuration
const defaultPrinterConfig: PrinterConfig = {
  enabled: true,
  paperWidth: 80,
  autoprint: false,
  copies: 1,
  includeLogo: false,
  footerMessage: 'Thank you for your business!'
};

// Default business information (can be overridden by settings)
const defaultBusinessInfo = {
  businessName: 'Coffee Shop POS',
  businessAddress: '123 Main Street, City, State 12345',
  businessPhone: '(555) 123-4567',
  businessEmail: 'info@coffeeshop.com'
};

/**
 * Generate formatted receipt text
 */
export const generateReceiptText = (
  receiptData: ReceiptData,
  config: Partial<PrinterConfig> = {}
): string => {
  const printerConfig = { ...defaultPrinterConfig, ...config };
  const width = printerConfig.paperWidth === 80 ? 48 : 32; // Characters per line

  const line = '='.repeat(width);
  const dashed = '-'.repeat(width);

  let receipt = '';

  // Header
  receipt += centerText(receiptData.businessName.toUpperCase(), width) + '\n';
  receipt += centerText(receiptData.businessAddress, width) + '\n';
  receipt += centerText(receiptData.businessPhone, width) + '\n';
  if (receiptData.businessEmail) {
    receipt += centerText(receiptData.businessEmail, width) + '\n';
  }
  receipt += line + '\n';

  // Order Information
  receipt += `Order #: ${receiptData.orderNumber}\n`;
  receipt += `Slot: ${receiptData.slotId}\n`;
  receipt += `Type: ${receiptData.orderType.replace('-', ' ').toUpperCase()}\n`;
  receipt += `Date: ${receiptData.placedAt.toLocaleString()}\n`;
  receipt += `Cashier: ${receiptData.cashierName}\n`;

  if (receiptData.customerName) {
    receipt += `Customer: ${receiptData.customerName}\n`;
  }
  if (receiptData.customerPhone) {
    receipt += `Phone: ${receiptData.customerPhone}\n`;
  }

  receipt += dashed + '\n';

  // Items
  receipt += leftRightText('ITEM', 'TOTAL', width) + '\n';
  receipt += dashed + '\n';

  receiptData.items.forEach(item => {
    // Item name and total
    const itemTotal = formatCurrency(item.totalPrice);
    receipt += leftRightText(
      `${item.name} x${item.quantity}`,
      itemTotal,
      width
    ) + '\n';

    // Modifiers
    if (item.modifiers?.variations?.length) {
      item.modifiers.variations.forEach(variation => {
        receipt += `  + ${variation.name}\n`;
      });
    }

    if (item.modifiers?.addOns?.length) {
      item.modifiers.addOns.forEach(addon => {
        receipt += `  + ${addon.name}\n`;
      });
    }

    if (item.modifiers?.specialInstructions) {
      receipt += `  * ${item.modifiers.specialInstructions}\n`;
    }
  });

  receipt += dashed + '\n';

  // Totals
  receipt += leftRightText('Subtotal:', formatCurrency(receiptData.subtotal), width) + '\n';
  receipt += leftRightText('Tax:', formatCurrency(receiptData.tax), width) + '\n';

  if (receiptData.discount && receiptData.discount > 0) {
    receipt += leftRightText('Discount:', `-${formatCurrency(receiptData.discount)}`, width) + '\n';
  }

  receipt += line + '\n';
  receipt += leftRightText('TOTAL:', formatCurrency(receiptData.total), width, true) + '\n';
  receipt += line + '\n';

  // Payment Information
  receipt += leftRightText(
    `Payment (${receiptData.paymentMethod.toUpperCase()}):`,
    formatCurrency(receiptData.total),
    width
  ) + '\n';

  if (receiptData.cashReceived && receiptData.change) {
    receipt += leftRightText('Cash Received:', formatCurrency(receiptData.cashReceived), width) + '\n';
    receipt += leftRightText('Change:', formatCurrency(receiptData.change), width) + '\n';
  }

  // Special Instructions
  if (receiptData.specialInstructions) {
    receipt += dashed + '\n';
    receipt += 'SPECIAL INSTRUCTIONS:\n';
    receipt += wordWrap(receiptData.specialInstructions, width) + '\n';
  }

  // Footer
  receipt += dashed + '\n';
  receipt += centerText(printerConfig.footerMessage || 'Thank you!', width) + '\n';
  receipt += centerText('Please retain this receipt', width) + '\n';

  // Tax ID if provided
  if (receiptData.businessTaxId) {
    receipt += centerText(`Tax ID: ${receiptData.businessTaxId}`, width) + '\n';
  }

  receipt += '\n\n\n'; // Extra lines for cutting

  return receipt;
};

/**
 * Generate kitchen receipt (simplified for kitchen use)
 */
export const generateKitchenReceiptText = (
  receiptData: ReceiptData,
  config: Partial<PrinterConfig> = {}
): string => {
  const printerConfig = { ...defaultPrinterConfig, ...config };
  const width = printerConfig.paperWidth === 80 ? 48 : 32;

  const line = '='.repeat(width);
  const dashed = '-'.repeat(width);

  let receipt = '';

  // Header
  receipt += centerText('KITCHEN ORDER', width) + '\n';
  receipt += line + '\n';

  // Order Information
  receipt += `Order #: ${receiptData.orderNumber}\n`;
  receipt += `Slot: ${receiptData.slotId} (${receiptData.orderType.toUpperCase()})\n`;
  receipt += `Time: ${receiptData.placedAt.toLocaleTimeString()}\n`;

  if (receiptData.customerName && receiptData.customerName !== 'Guest') {
    receipt += `Customer: ${receiptData.customerName}\n`;
  }

  receipt += dashed + '\n';

  // Items (kitchen focused)
  receiptData.items.forEach(item => {
    receipt += `${item.quantity}x ${item.name.toUpperCase()}\n`;

    // Modifiers (important for kitchen)
    if (item.modifiers?.variations?.length) {
      item.modifiers.variations.forEach(variation => {
        receipt += `   ${variation.name}\n`;
      });
    }

    if (item.modifiers?.addOns?.length) {
      item.modifiers.addOns.forEach(addon => {
        receipt += `   + ${addon.name}\n`;
      });
    }

    if (item.modifiers?.specialInstructions) {
      receipt += `   ** ${item.modifiers.specialInstructions.toUpperCase()} **\n`;
    }

    receipt += '\n';
  });

  // Special Instructions (prominent for kitchen)
  if (receiptData.specialInstructions) {
    receipt += line + '\n';
    receipt += centerText('SPECIAL INSTRUCTIONS', width) + '\n';
    receipt += line + '\n';
    receipt += centerText(receiptData.specialInstructions.toUpperCase(), width) + '\n';
    receipt += line + '\n';
  }

  receipt += `Items: ${receiptData.items.reduce((sum, item) => sum + item.quantity, 0)}\n`;
  receipt += `Time: ${receiptData.placedAt.toLocaleTimeString()}\n`;

  receipt += '\n\n\n'; // Extra lines for cutting

  return receipt;
};

/**
 * Print receipt using browser's print API or direct printer
 */
export const printReceipt = async (
  receiptData: ReceiptData,
  config: Partial<PrinterConfig> = {},
  kitchenCopy: boolean = false
): Promise<boolean> => {
  try {
    const printerConfig = { ...defaultPrinterConfig, ...config };

    // Generate receipt text
    const receiptText = kitchenCopy
      ? generateKitchenReceiptText(receiptData, printerConfig)
      : generateReceiptText(receiptData, printerConfig);

    // For web browser printing
    if (typeof window !== 'undefined') {
      const printWindow = window.open('', '_blank', 'width=300,height=600');

      if (!printWindow) {
        console.error('Failed to open print window');
        return false;
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt</title>
            <style>
              body {
                font-family: 'Courier New', monospace;
                font-size: 12px;
                line-height: 1.2;
                margin: 0;
                padding: 10px;
                white-space: pre;
              }
              @media print {
                body {
                  margin: 0;
                  padding: 0;
                }
              }
            </style>
          </head>
          <body>${receiptText}</body>
        </html>
      `);

      printWindow.document.close();

      if (printerConfig.autoprint) {
        printWindow.print();
        printWindow.close();
      }

      return true;
    }

    // For desktop/native app printing
    // This would integrate with a native printing library
    console.log('Receipt text:', receiptText);
    return true;

  } catch (error) {
    console.error('Failed to print receipt:', error);
    return false;
  }
};

/**
 * Helper functions for text formatting
 */
const centerText = (text: string, width: number): string => {
  const padding = Math.max(0, Math.floor((width - text.length) / 2));
  return ' '.repeat(padding) + text;
};

const leftRightText = (left: string, right: string, width: number, bold: boolean = false): string => {
  const totalLen = left.length + right.length;
  const spaces = Math.max(1, width - totalLen);
  const result = left + ' '.repeat(spaces) + right;
  return bold ? result.toUpperCase() : result;
};

const wordWrap = (text: string, width: number): string => {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + word).length <= width) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines.join('\n');
};

/**
 * Create receipt data from payment information
 */
export const createReceiptData = (
  orderData: {
    orderNumber: string;
    slotId: string;
    orderType: 'dine-in' | 'take-away' | 'delivery';
    paymentMethod: 'cash' | 'card' | 'online' | 'unpaid';
    items: CartItem[];
    customer?: {
      name?: string;
      phone?: string;
      specialInstructions?: string;
    };
    totals: {
      subtotal: number;
      tax: number;
      discount?: number;
      total: number;
    };
    payment?: {
      cashReceived?: number;
      change?: number;
    };
    cashier: {
      name: string;
      id?: string;
    };
  },
  businessInfo: Partial<typeof defaultBusinessInfo> = {}
): ReceiptData => {
  return {
    // Business info
    ...defaultBusinessInfo,
    ...businessInfo,

    // Order info
    orderNumber: orderData.orderNumber,
    slotId: orderData.slotId,
    orderType: orderData.orderType,
    paymentMethod: orderData.paymentMethod,
    placedAt: new Date(),

    // Customer info
    customerName: orderData.customer?.name,
    customerPhone: orderData.customer?.phone,
    specialInstructions: orderData.customer?.specialInstructions,

    // Items
    items: orderData.items,

    // Totals
    subtotal: orderData.totals.subtotal,
    tax: orderData.totals.tax,
    discount: orderData.totals.discount,
    total: orderData.totals.total,

    // Payment
    cashReceived: orderData.payment?.cashReceived,
    change: orderData.payment?.change,

    // Staff
    cashierName: orderData.cashier.name,
    cashierId: orderData.cashier.id
  };
};