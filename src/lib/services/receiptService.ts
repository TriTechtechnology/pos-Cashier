/**
 * Frontend Receipt Generation Service
 *
 * PURPOSE: Generate receipts offline-first, matching backend format exactly
 * This allows printing receipts immediately without waiting for backend sync
 *
 * LINKS WITH:
 * - Order Overlay Store: Gets order data from IndexedDB
 * - Auth Store: Gets cashier information
 * - Branch Settings: Gets branch information
 */

import type { OverlayOrder } from '@/lib/store/order-overlay';
import type { OrderItem } from '@/types/pos';

export interface ReceiptData {
  format: 'thermal';
  content: string; // Formatted receipt text for printing
  data: {
    orderNumber: string;
    orderDate: string; // Format: DD/MM/YYYY HH:mm:ss
    branchName: string;
    branchAddress: string;
    branchPhone: string;
    branchEmail: string;
    vatNumber: string;
    cashierName: string;
    customerName: string;
    customerPhone: string;
    items: Array<{
      name: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
      notes: string; // Variations and add-ons combined
    }>;
    subTotal: number;
    taxTotal: number;
    discount: number;
    grandTotal: number;
    currency: string;
    taxMode: 'exclusive' | 'inclusive';
    taxRate: number;
    paymentMethod: string;
    amountPaid: number;
    change: number;
    receiptFooter: string;
    status: string;
  };
}

export interface BranchInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  vatNumber: string;
  currency: string;
  taxMode: 'exclusive' | 'inclusive';
  taxRate: number;
}

/**
 * Generate receipt from order overlay (offline-first)
 */
export async function generateReceiptFromOrder(
  order: OverlayOrder,
  cashierName: string,
  branchInfo: BranchInfo,
  cashReceived?: number,
  change?: number
): Promise<ReceiptData> {
  // Calculate subtotal from items
  const subTotal = order.items.reduce((sum, item) => sum + item.total, 0);

  // Calculate tax (backend uses exclusive tax)
  const taxTotal = branchInfo.taxMode === 'exclusive'
    ? Math.round(subTotal * (branchInfo.taxRate / 100) * 100) / 100
    : 0;

  // Grand total
  const grandTotal = Math.round((subTotal + taxTotal) * 100) / 100;

  // Format order date
  const orderDate = formatOrderDate(order.placedAt);

  // Transform items to receipt format
  const items = order.items.map(item => {
    // Build notes from modifiers
    const notes = buildItemNotes(item);

    return {
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.price,
      lineTotal: item.total,
      notes
    };
  });

  // Prepare receipt data
  const receiptData: ReceiptData['data'] = {
    orderNumber: order.id,
    orderDate,
    branchName: branchInfo.name,
    branchAddress: branchInfo.address,
    branchPhone: branchInfo.phone,
    branchEmail: branchInfo.email,
    vatNumber: branchInfo.vatNumber,
    cashierName,
    customerName: order.customer?.name || 'Guest',
    customerPhone: order.customer?.phone || '',
    items,
    subTotal,
    taxTotal,
    discount: 0, // No discount support yet
    grandTotal,
    currency: branchInfo.currency,
    taxMode: branchInfo.taxMode,
    taxRate: branchInfo.taxRate,
    paymentMethod: order.paymentMethod || 'cash',
    amountPaid: cashReceived || grandTotal,
    change: change || 0,
    receiptFooter: 'Thank you for your business!',
    status: order.status === 'completed' ? 'completed' : 'placed'
  };

  // Generate thermal receipt content
  const content = generateThermalReceipt(receiptData);

  return {
    format: 'thermal',
    content,
    data: receiptData
  };
}

/**
 * Build item notes from modifiers (variations + add-ons)
 */
function buildItemNotes(item: OrderItem): string {
  const notes: string[] = [];

  // Add variations
  if (item.modifiers?.variations && item.modifiers.variations.length > 0) {
    item.modifiers.variations.forEach(variation => {
      notes.push(variation.name);
    });
  }

  // Add add-ons
  if (item.modifiers?.addOns && item.modifiers.addOns.length > 0) {
    item.modifiers.addOns.forEach(addon => {
      notes.push(addon.name);
    });
  }

  // Add special instructions
  if (item.modifiers?.specialInstructions) {
    notes.push(item.modifiers.specialInstructions);
  }

  return notes.join(' | ');
}

/**
 * Get branch timezone (Asia/Karachi default)
 */
function getBranchTimezone(): string {
  if (typeof window === 'undefined') return 'Asia/Karachi';

  try {
    const data = localStorage.getItem('pos-branch-config-storage');
    if (!data) return 'Asia/Karachi';
    const parsed = JSON.parse(data);
    return parsed?.state?.config?.timezone || 'Asia/Karachi';
  } catch {
    return 'Asia/Karachi';
  }
}

/**
 * Format date to match backend format: DD/MM/YYYY HH:mm:ss
 * Uses branch timezone for proper localization
 */
function formatOrderDate(date: Date): string {
  const d = new Date(date);
  const timezone = getBranchTimezone();

  // Format with timezone
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(d);
  const day = parts.find(p => p.type === 'day')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const year = parts.find(p => p.type === 'year')?.value;
  const hour = parts.find(p => p.type === 'hour')?.value;
  const minute = parts.find(p => p.type === 'minute')?.value;
  const second = parts.find(p => p.type === 'second')?.value;

  return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
}

/**
 * Generate thermal receipt content matching backend format exactly
 * Width: 42 characters (standard thermal printer)
 */
function generateThermalReceipt(data: ReceiptData['data']): string {
  const WIDTH = 42;
  const line = '='.repeat(WIDTH);
  const dashed = '-'.repeat(WIDTH);

  let receipt = '';

  // Header - Branch info (centered)
  receipt += centerText(data.branchName, WIDTH) + '\n';
  receipt += centerText(data.branchAddress, WIDTH) + '\n';
  receipt += line + '\n';

  // Order info
  receipt += `Order #: ${data.orderNumber}\n`;
  receipt += `Date: ${data.orderDate}\n`;
  receipt += `Cashier: ${data.cashierName}\n`;
  receipt += `Customer: ${data.customerName}\n`;
  receipt += `Status: ${data.status.toUpperCase()}\n`;
  receipt += dashed + '\n';

  // Column headers
  receipt += 'Item              Qty      Price      Total\n';
  receipt += dashed + '\n';

  // Items
  data.items.forEach(item => {
    // Truncate long item names to prevent wrapping
    const itemName = item.name.length > WIDTH ? item.name.substring(0, WIDTH - 3) + '...' : item.name;
    receipt += `${itemName}\n`;

    // Quantity, price, total (second line, right-aligned with proper spacing)
    // Format the values with consistent width
    const qty = String(item.quantity);
    const price = `${data.currency} ${formatPrice(item.unitPrice)}`;
    const total = `${data.currency} ${formatPrice(item.lineTotal)}`;

    // Build the line with proper spacing (right-aligned)
    // Format: "                    1 PKR 899.00 PKR 899.00"
    const itemLine = rightText(`${qty} ${price} ${total}`, WIDTH);
    receipt += itemLine + '\n';

    // Notes (if any) - wrap long notes
    if (item.notes) {
      const notePrefix = '  Note: ';
      const maxNoteWidth = WIDTH - notePrefix.length;
      const wrappedNotes = wrapText(item.notes, maxNoteWidth);
      wrappedNotes.forEach((line, index) => {
        if (index === 0) {
          receipt += `${notePrefix}${line}\n`;
        } else {
          receipt += `  ${' '.repeat(notePrefix.length - 2)}${line}\n`;
        }
      });
    }
  });

  receipt += dashed + '\n';

  // Totals (right-aligned)
  receipt += rightText(`Subtotal: ${data.currency} ${formatPrice(data.subTotal)}`, WIDTH) + '\n';

  if (data.taxRate > 0) {
    receipt += rightText(`Tax (${data.taxRate}%): ${data.currency} ${formatPrice(data.taxTotal)}`, WIDTH) + '\n';
  }

  receipt += line + '\n';
  receipt += rightText(`TOTAL: ${data.currency} ${formatPrice(data.grandTotal)}`, WIDTH) + '\n';
  receipt += line + '\n';

  // Footer
  receipt += '\n';
  receipt += centerText(data.receiptFooter, WIDTH) + '\n';
  receipt += '\n';
  receipt += centerText('Powered by Tritech POS', WIDTH) + '\n';

  return receipt;
}

/**
 * Format price with 2 decimal places
 */
function formatPrice(price: number): string {
  return price.toFixed(2);
}

/**
 * Center text within width
 */
function centerText(text: string, width: number): string {
  const padding = Math.max(0, Math.floor((width - text.length) / 2));
  return ' '.repeat(padding) + text;
}

/**
 * Right-align text within width
 */
function rightText(text: string, width: number): string {
  const padding = Math.max(0, width - text.length);
  return ' '.repeat(padding) + text;
}

/**
 * Wrap text to fit within width
 */
function wrapText(text: string, width: number): string[] {
  if (text.length <= width) {
    return [text];
  }

  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (currentLine.length === 0) {
      currentLine = word;
    } else if ((currentLine + ' ' + word).length <= width) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Get branch info from environment or settings
 * TODO: Load from settings/branch API in production
 */
export function getBranchInfo(): BranchInfo {
  // In production, this would come from backend or settings
  // For now, use environment variables or defaults
  return {
    name: process.env.NEXT_PUBLIC_BRANCH_NAME || 'POS Branch',
    address: process.env.NEXT_PUBLIC_BRANCH_ADDRESS || 'Branch Address',
    phone: process.env.NEXT_PUBLIC_BRANCH_PHONE || '',
    email: process.env.NEXT_PUBLIC_BRANCH_EMAIL || '',
    vatNumber: process.env.NEXT_PUBLIC_VAT_NUMBER || '',
    currency: 'PKR',
    taxMode: 'exclusive',
    taxRate: 5 // 5% tax
  };
}

/**
 * Print receipt content in new window
 * Uses sessionStorage to avoid URI encoding issues with special characters
 */
export function printReceiptContent(receiptContent: string, orderNumber: string): void {
  // Store receipt content in sessionStorage (avoids URL encoding issues)
  const receiptKey = `receipt-${orderNumber}-${Date.now()}`;
  sessionStorage.setItem(receiptKey, receiptContent);

  // Open print page in new tab with just the receipt key
  const printUrl = `/print-receipt?key=${receiptKey}`;
  window.open(printUrl, '_blank');
}
