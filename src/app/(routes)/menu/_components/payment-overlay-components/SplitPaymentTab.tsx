import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';

interface SplitPaymentTabProps {
  total: number;
  paymentStatus: string;
  onSplitPayment: (splits: SplitBillData) => void;
}

export interface SplitBillData {
  numberOfPersons: number;
  amountPerPerson: number;
  totalAmount: number;
}

export const SplitPaymentTab: React.FC<SplitPaymentTabProps> = React.memo(({
  total,
  paymentStatus,
  onSplitPayment
}) => {
  const [numberOfPersons, setNumberOfPersons] = useState(2);

  // Calculate amount per person
  const amountPerPerson = useMemo(() => {
    return Math.ceil((total / numberOfPersons) * 100) / 100; // Round up to nearest paisa
  }, [total, numberOfPersons]);

  // Ensure minimum of 2 persons for split bill
  const handleDecrement = () => {
    if (numberOfPersons > 2) {
      setNumberOfPersons(prev => prev - 1);
    }
  };

  const handleIncrement = () => {
    if (numberOfPersons < 20) { // Max 20 persons
      setNumberOfPersons(prev => prev + 1);
    }
  };

  const handleConfirmSplit = () => {
    onSplitPayment({
      numberOfPersons,
      amountPerPerson,
      totalAmount: total
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-text-primary">Split Bill</h3>
        <p className="text-sm text-text-secondary">Divide the bill equally among guests</p>
      </div>

      {/* Number of Persons Selector */}
      <div className="bg-muted rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-text-secondary">Number of Persons</span>
          <div className="flex items-center gap-4">
            <button
              onClick={handleDecrement}
              disabled={numberOfPersons <= 2}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                numberOfPersons <= 2
                  ? 'bg-muted text-text-muted cursor-not-allowed'
                  : 'bg-card border border-border text-text-primary hover:bg-primary/10 active:scale-95'
              }`}
            >
              <Minus className="w-5 h-5" />
            </button>

            <span className="text-3xl font-bold text-text-primary min-w-[3ch] text-center">
              {numberOfPersons}
            </span>

            <button
              onClick={handleIncrement}
              disabled={numberOfPersons >= 20}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                numberOfPersons >= 20
                  ? 'bg-muted text-text-muted cursor-not-allowed'
                  : 'bg-card border border-border text-text-primary hover:bg-primary/10 active:scale-95'
              }`}
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Select Buttons */}
        <div className="flex gap-2">
          {[2, 3, 4, 5, 6].map((num) => (
            <button
              key={num}
              onClick={() => setNumberOfPersons(num)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                numberOfPersons === num
                  ? 'bg-primary text-white'
                  : 'bg-card border border-border text-text-primary hover:bg-primary/10'
              }`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      {/* Split Summary */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Total Bill</span>
          <span className="font-semibold text-text-primary">{formatCurrency(total)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Number of Persons</span>
          <span className="font-semibold text-text-primary">{numberOfPersons}</span>
        </div>

        <div className="border-t border-border pt-3">
          <div className="flex justify-between">
            <span className="text-lg font-medium text-text-primary">Per Person</span>
            <span className="text-xl font-bold text-primary">{formatCurrency(amountPerPerson)}</span>
          </div>
        </div>
      </div>


      {/* Confirm Button */}
      <Button
        variant="fill"
        className="w-full h-11 flex-shrink-0 bg-success hover:bg-success/90 text-white font-bold text-sm disabled:bg-muted disabled:text-text-secondary shadow-lg"
        onClick={handleConfirmSplit}
        disabled={paymentStatus === 'processing'}
      >
        {paymentStatus === 'processing' ? (
          <span className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Processing...
          </span>
        ) : (
          'Confirm Split Payment'
        )}
      </Button>
    </div>
  );
});

SplitPaymentTab.displayName = 'SplitPaymentTab';
