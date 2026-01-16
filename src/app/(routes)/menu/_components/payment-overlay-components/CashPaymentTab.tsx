import React from 'react';
import { Button } from '@/components/ui/button';
import { Keypad } from '@/components/ui/Keypad';
import { Banknote, Minus } from 'lucide-react';

interface CashPaymentTabProps {
  cashAmount: string;
  cashChange: number;
  total: number;
  paymentStatus: string;
  formatCurrency: (amount: number) => string;
  onKeypadInput: (value: string) => void;
  onKeypadClear: () => void;
  onKeypadBackspace: () => void;
  onCashPayment: () => void;
}

const CURRENCY_DENOMINATIONS = [
  { value: 100, label: '100' },
  { value: 500, label: '500' },
  { value: 1000, label: '1K' },
  { value: 5000, label: '5K' }
];

export const CashPaymentTab: React.FC<CashPaymentTabProps> = React.memo(({
  cashAmount,
  cashChange,
  total,
  paymentStatus,
  formatCurrency,
  onKeypadInput,
  onKeypadClear,
  onKeypadBackspace,
  onCashPayment
}) => {
  const currentAmount = parseFloat(cashAmount) || 0;
  const isInsufficientAmount = currentAmount < total;
  const hasChange = cashChange > 0;

  const handleDenominationClick = (value: number) => {
    const newAmount = currentAmount + value;
    // Convert to string without decimal if whole number, otherwise preserve decimals
    const amountStr = newAmount % 1 === 0 ? newAmount.toString() : newAmount.toFixed(2);
    // Clear first then set the new amount to avoid appending issues
    onKeypadClear();
    // Use timeout to ensure clear completes first
    setTimeout(() => {
      for (const char of amountStr) {
        onKeypadInput(char);
      }
    }, 0);
  };

  const handleExactAmount = () => {
    const amountStr = total % 1 === 0 ? total.toString() : total.toFixed(2);
    // Clear first then set exact amount
    onKeypadClear();
    setTimeout(() => {
      for (const char of amountStr) {
        onKeypadInput(char);
      }
    }, 0);
  };

  return (
    <div className="flex flex-col h-full gap-2">
      {/* Amount Display Section - Compact */}
      <div className="bg-background rounded-lg p-2.5 border border-border flex-shrink-0">
        <label className={`text-[10px] font-bold block mb-0.5 uppercase tracking-wide ${
          hasChange ? 'text-green-700 dark:text-green-500' : 'text-text-secondary'
        }`}>
          {hasChange ? `Change Due - ${formatCurrency(cashChange)}` : 'Cash Received'}
        </label>
        <div className="flex items-center justify-between gap-2">
          <div className="text-2xl font-bold text-text-primary tabular-nums tracking-tight">
            {formatCurrency(currentAmount)}
          </div>
          {/* Clear Button - Circle */}
          <button
            onClick={onKeypadClear}
            className="flex-shrink-0 w-8 h-8 rounded-full bg-destructive/10 hover:bg-destructive/20 border-2 border-destructive/30 hover:border-destructive/50 flex items-center justify-center transition-all active:scale-95 touch-manipulation"
            title="Clear amount"
          >
            <Minus className="w-3.5 h-3.5 text-destructive" />
          </button>
        </div>

        {/* Insufficient Amount Warning - Compact */}
        {currentAmount > 0 && isInsufficientAmount && (
          <div className="mt-1.5 bg-destructive/10 border border-destructive/30 rounded-md p-1">
            <span className="text-[9px] font-medium text-destructive">
              Need {formatCurrency(total - currentAmount)} more
            </span>
          </div>
        )}
      </div>

      {/* Quick Denomination Buttons - Same style as keypad */}
      <div className="flex-shrink-0">
        <div className="flex items-center gap-1 mb-1">
          <Banknote className="w-3 h-3 text-text-secondary" />
          <span className="text-[9px] font-medium text-text-secondary uppercase tracking-wide">Quick Add</span>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {CURRENCY_DENOMINATIONS.map((denomination) => (
            <button
              key={denomination.value}
              onClick={() => handleDenominationClick(denomination.value)}
              className="h-9 text-xs font-semibold bg-background border border-border rounded-lg hover:bg-muted transition-colors active:scale-95 touch-manipulation"
            >
              {denomination.label}
            </button>
          ))}
          <button
            onClick={handleExactAmount}
            className="h-9 text-xs font-semibold bg-background border border-border rounded-lg hover:bg-muted transition-colors active:scale-95 touch-manipulation"
          >
            Exact
          </button>
        </div>
      </div>

      {/* Keypad - Takes remaining space exactly */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <Keypad
          onInput={onKeypadInput}
          onClear={onKeypadClear}
          onBackspace={onKeypadBackspace}
        />
      </div>

      {/* Confirm Button - Fixed height at bottom */}
      <Button
        variant="fill"
        className="w-full h-11 flex-shrink-0 bg-success hover:bg-success/90 text-white font-bold text-sm disabled:bg-muted disabled:text-text-secondary shadow-lg"
        onClick={onCashPayment}
        disabled={isInsufficientAmount || paymentStatus === 'processing'}
      >
        {paymentStatus === 'processing' ? (
          <span className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Processing...
          </span>
        ) : (
          `Confirm ${formatCurrency(currentAmount)}`
        )}
      </Button>
    </div>
  );
});

CashPaymentTab.displayName = 'CashPaymentTab';
