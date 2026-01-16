/**
 * TillModal Component - Universal Till Operations Modal
 *
 * PURPOSE: Single premium modal for both opening and closing till
 * Adapts UI based on mode (open/close) for consistent UX
 *
 * FEATURES:
 * - mode="open": Clock in with opening balance
 * - mode="close": Clock out with cash counting & reconciliation
 * - Large time display for shift awareness
 * - Smooth slide-up animation from bottom
 * - Professional validation and error handling
 * - Backend integration with offline support
 *
 * DESIGN PRINCIPLES:
 * - Polymorphic: One component, multiple modes
 * - DRY: Shared layout, animation, validation logic
 * - Accessible: Touch-friendly, clear affordances
 * - Professional: Industry-standard POS aesthetics
 *
 * WHY ONE MODAL:
 * - Consistent user experience (same flow for open/close)
 * - Less code duplication (shared animation, backdrop, layout)
 * - Easier maintenance (one component to style/test)
 * - Smaller bundle size
 *
 * LINKS WITH:
 * - Till Store: Opens/closes till session in IndexedDB
 * - Till API: Syncs with backend (openTill/closeTill)
 * - Auth Store: Gets user data
 */

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth';
import { useTillStore } from '@/lib/store/till';
import { openTill, openTillMock, closeTill, closeTillMock } from '@/lib/api/till';
import { formatTime } from '@/lib/utils/format';
import type { CashCounts } from '@/types/pos';
import { Keypad } from '@/components/ui/Keypad';

interface TillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: 'open' | 'close';
  systemAmount?: number; // For close mode - expected amount from system
}

const DENOMINATIONS = [
  { value: 5000, label: 'PKR 5000' },
  { value: 1000, label: 'PKR 1000' },
  { value: 500, label: 'PKR 500' },
  { value: 100, label: 'PKR 100' },
  { value: 50, label: 'PKR 50' },
  { value: 20, label: 'PKR 20' },
  { value: 10, label: 'PKR 10' },
];

export const TillModal: React.FC<TillModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  mode,
  systemAmount = 0,
}) => {
  const user = useAuthStore(state => state.user);
  const tillStore = useTillStore();
  const currentSession = tillStore.currentSession;

  // State - Simple balance input for open mode
  const [balance, setBalance] = useState('');
  const [note, setNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);

  // State - Cash counting for close mode
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [calculatedTotal, setCalculatedTotal] = useState(0);
  const [selectedDenomination, setSelectedDenomination] = useState<number | null>(null);
  const [keypadInput, setKeypadInput] = useState('');

  // UI State
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // No auto-check on mount - always show the form
  // User must manually open till each session

  // Slide-up animation on mount
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  // Calculate total from cash counts (close mode)
  useEffect(() => {
    if (mode === 'close') {
      const total = DENOMINATIONS.reduce((sum, denom) => {
        const count = counts[denom.value.toString()] || 0;
        return sum + denom.value * count;
      }, 0);
      setCalculatedTotal(total);
    }
  }, [counts, mode]);

  // Reset form when mode changes
  useEffect(() => {
    setBalance('');
    setNote('');
    setShowNoteInput(false);
    setCounts({});
    setCalculatedTotal(0);
    setSelectedDenomination(null);
    setKeypadInput('');
  }, [mode]);

  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const sanitizedValue = value.replace(/[^0-9.]/g, '');
    setBalance(sanitizedValue);
  };

  const handleClearBalance = () => {
    setBalance('');
  };

  const handleCountChange = (denomination: number, value: string) => {
    const numValue = parseInt(value) || 0;
    setCounts(prev => ({
      ...prev,
      [denomination.toString()]: Math.max(0, numValue),
    }));
  };

  const handleResetCounts = () => {
    setCounts({});
    setNote('');
    setSelectedDenomination(null);
    setKeypadInput('');
  };

  const handleDenominationSelect = (denomination: number) => {
    setSelectedDenomination(denomination);
    const currentCount = counts[denomination.toString()] || 0;
    setKeypadInput(currentCount.toString());
  };

  const handleKeypadInput = (value: string) => {
    const newInput = keypadInput + value;
    setKeypadInput(newInput);

    if (selectedDenomination !== null) {
      const numValue = parseInt(newInput) || 0;
      handleCountChange(selectedDenomination, numValue.toString());
    }
  };

  const handleKeypadClear = () => {
    setKeypadInput('');
    if (selectedDenomination !== null) {
      handleCountChange(selectedDenomination, '0');
    }
  };

  const handleKeypadBackspace = () => {
    const newInput = keypadInput.slice(0, -1);
    setKeypadInput(newInput);

    if (selectedDenomination !== null) {
      const numValue = parseInt(newInput) || 0;
      handleCountChange(selectedDenomination, numValue.toString());
    }
  };

  const handleSlideDown = () => {
    // Trigger slide-down animation
    setIsAnimating(false);
    // Wait for animation to complete, then call onClose
    setTimeout(() => {
      onClose();
    }, 500); // Match transition duration
  };

  const handleSubmit = async () => {
    // Determine amount based on mode
    const amount = mode === 'open' ? parseFloat(balance) : calculatedTotal;

    if (!amount || amount < 0) {
      alert(`Please enter a valid ${mode === 'open' ? 'opening' : 'closing'} balance`);
      return;
    }

    if (!user) {
      alert('User not authenticated');
      return;
    }

    if (!user.posId) {
      alert('POS Terminal not selected. Please log in again and select a terminal.');
      console.error(`❌ [TILL MODAL] Missing posId in user object`);
      return;
    }

    setIsProcessing(true);

    try {
      if (mode === 'open') {
        await handleOpenTill(amount);
      } else {
        await handleCloseTill(amount);
      }
    } catch (error) {
      console.error(`❌ [TILL MODAL] Failed to ${mode} till:`, error);
      alert(`Failed to ${mode} till. Please try again.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenTill = async (amount: number) => {
    // Validate required user data
    if (!user?.posId || !user?.branchId || !user?.id) {
      throw new Error('Missing required user data (posId, branchId, or userId). Please re-login.');
    }

    console.log('🏦 [TILL MODAL] Opening till...', {
      posId: user.posId,
      branchId: user.branchId,
      userId: user.id,
      openingAmount: amount,
    });

    const enableMock = process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA === 'true';
    console.log(`🎯 [TILL MODAL] Using ${enableMock ? 'MOCK' : 'REAL'} API for till open`);

    const apiResponse = enableMock
      ? await openTillMock({
          posId: user.posId,
          branchId: user.branchId,
          openingAmount: amount,
          notes: note || undefined,
        })
      : await openTill({
          posId: user.posId,
          branchId: user.branchId,
          openingAmount: amount,
          notes: note || undefined,
        });

    if (!apiResponse.success) {
      // With backend sync in place, "already open" errors should not happen
      // If they do, it means there's a race condition or sync failure
      console.error('❌ [TILL MODAL] Failed to open till in backend:', apiResponse.error);

      // Extract error message
      let errorMsg = apiResponse.message || 'Failed to open till';
      if (typeof apiResponse.error === 'string') {
        errorMsg = apiResponse.error;
      } else if (typeof apiResponse.error === 'object' && apiResponse.error !== null) {
        const errorObj = apiResponse.error as Record<string, unknown>;
        if (typeof errorObj.message === 'string') {
          errorMsg = errorObj.message;
        }
      }

      throw new Error(errorMsg);
    }

    console.log('✅ [TILL MODAL] Till opened in backend, tillSessionId:', apiResponse.tillSessionId);

    await tillStore.openTill({
      posId: user.posId,
      branchId: user.branchId,
      userId: user.id,
      openingAmount: amount,
      openingNotes: note || undefined,
      tillSessionId: apiResponse.tillSessionId,
    });

    console.log('✅ [TILL MODAL] Till opened successfully');
    onSuccess();
  };

  const handleCloseTill = async (amount: number) => {
    if (!currentSession) {
      throw new Error('No active till session to close');
    }

    // Validate required user data
    if (!user?.posId || !user?.branchId || !user?.id) {
      throw new Error('Missing required user data (posId, branchId, or userId). Please re-login.');
    }

    console.log('🏦 [TILL MODAL] Closing till...', {
      posId: user.posId,
      branchId: user.branchId,
      tillSessionId: currentSession.id,
      declaredAmount: amount,
      systemAmount,
    });

    // Build cash counts object
    const cashCounts: CashCounts = {};
    Object.keys(counts).forEach(key => {
      if (counts[key] > 0) {
        cashCounts[key] = counts[key];
      }
    });

    // Detect mock mode
    const isMockTillSession = currentSession.id.startsWith('till-') ||
                              currentSession.id.startsWith('mock-') ||
                              !/^[0-9a-fA-F]{24}$/.test(currentSession.id);

    const enableMock = process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA === 'true' || isMockTillSession;

    if (isMockTillSession) {
      console.warn(`⚠️ [TILL MODAL] Till session was opened in MOCK mode (ID: ${currentSession.id})`);
      console.warn(`⚠️ [TILL MODAL] Forcing MOCK API for till close to match opening mode`);
    }

    console.log(`🎯 [TILL MODAL] Using ${enableMock ? 'MOCK' : 'REAL'} API for till close`);

    // Close in IndexedDB first
    await tillStore.closeTill({
      declaredClosingAmount: amount,
      systemClosingAmount: systemAmount,
      closingCashCounts: Object.keys(cashCounts).length > 0 ? cashCounts : undefined,
      closingNotes: note || undefined,
    });

    console.log('✅ [TILL MODAL] Till closed in IndexedDB');

    // Sync to backend
    const apiResponse = enableMock
      ? await closeTillMock({
          posId: user.posId,
          branchId: user.branchId,
          tillSessionId: currentSession.id,
          declaredClosingAmount: amount,
          systemClosingAmount: systemAmount,
          cashCounts: Object.keys(cashCounts).length > 0 ? cashCounts : undefined,
          notes: note || undefined,
        })
      : await closeTill({
          posId: user.posId,
          branchId: user.branchId,
          tillSessionId: currentSession.id,
          declaredClosingAmount: amount,
          systemClosingAmount: systemAmount,
          cashCounts: Object.keys(cashCounts).length > 0 ? cashCounts : undefined,
          notes: note || undefined,
        });

    if (!apiResponse.success) {
      console.error('❌ [TILL MODAL] Failed to close till in backend:', apiResponse.error);
      throw new Error(apiResponse.message || apiResponse.error);
    }

    console.log('✅ [TILL MODAL] Till closed in backend');
    onSuccess();
  };

  if (!isOpen) return null;

  const difference = mode === 'close' ? calculatedTotal - systemAmount : 0;
  const isDifferencePositive = difference > 0;
  const currentAmount = mode === 'open' ? parseFloat(balance) || 0 : calculatedTotal;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={isProcessing ? undefined : mode === 'close' ? handleSlideDown : undefined}
      />

      {/* Modal - Slide up from bottom */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 transition-transform duration-500 ease-out ${
          isAnimating ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="bg-background rounded-t-3xl shadow-2xl max-h-[100vh] overflow-hidden flex flex-col">
          {/* Close Button - Only show for close mode */}
          {mode === 'close' && (
            <button
              onClick={handleSlideDown}
              disabled={isProcessing}
              className="absolute top-6 right-6 z-10 text-muted-foreground hover:text-text-primary transition-colors disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>
          )}

          {/* Header - Time Display */}
          <div className="flex justify-center pt-12 pb-6 px-6">
            <div className="text-center">
              <div className="text-7xl md:text-8xl font-semibold text-text-secondary mb-4">
                {formatTime(currentTime)}
              </div>
              <div className="text-xl font-semibold text-text-secondary">
                {mode === 'open'
                  ? `Welcome ${user?.name || 'User'}! Ready to start your shift?`
                  : `${user?.name || 'User'}, time to close your shift`}
              </div>
            </div>
          </div>

          {/* Main Content - Scrollable without scrollbar */}
          <div className="flex-1 overflow-y-auto px-6 pb-8 scrollbar-hide">
            <div className="flex flex-col items-center max-w-2xl mx-auto">
              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-normal text-text-primary mb-8 text-center">
                {mode === 'open'
                  ? 'Please Enter Your Opening Balance'
                  : 'Count Your Cash & Close Till'}
              </h1>

              {mode === 'open' ? (
                /* OPEN MODE - Simple Balance Input */
                <>
                  <div className="w-full max-w-md mb-8">
                    <div className="relative">
                      <input
                        type="text"
                        value={balance}
                        onChange={handleBalanceChange}
                        placeholder="0.00"
                        disabled={isProcessing}
                        className="w-full px-4 py-4 bg-card text-text-primary rounded-full border-2 border-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-center text-2xl font-mono tracking-widest disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      />
                      {balance && !isProcessing && (
                        <button
                          type="button"
                          onClick={handleClearBalance}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Enter the cash amount in your till drawer
                    </p>
                  </div>
                </>
              ) : (
                /* CLOSE MODE - Cash Counting Grid */
                <>
                  {/* Summary Cards - System Design Colors */}
                  <div className="w-full mb-6 grid grid-cols-2 gap-3">
                    {/* Expected Amount */}
                    <div className="p-4 bg-accent/30 rounded-xl border border-border shadow-sm">
                      <div className="text-xs font-medium text-muted-foreground mb-1">Expected</div>
                      <div className="text-xl font-bold text-text-primary">PKR {systemAmount.toFixed(0)}</div>
                    </div>

                    {/* Total Counted */}
                    <div className={`p-4 rounded-xl border shadow-sm ${
                      calculatedTotal === systemAmount
                        ? 'bg-primary/10 border-primary'
                        : calculatedTotal > systemAmount
                        ? 'bg-accent/40 border-border'
                        : 'bg-accent/40 border-border'
                    }`}>
                      <div className={`text-xs font-medium mb-1 ${
                        calculatedTotal === systemAmount ? 'text-primary'
                        : 'text-muted-foreground'
                      }`}>Counted</div>
                      <div className={`text-xl font-bold ${
                        calculatedTotal === systemAmount ? 'text-primary'
                        : 'text-text-primary'
                      }`}>PKR {calculatedTotal.toFixed(0)}</div>
                    </div>
                  </div>

                  {/* Variance Indicator */}
                  {calculatedTotal !== systemAmount && (
                    <div className="w-full mb-6 p-3 rounded-xl flex items-center justify-between bg-accent/30 border border-border">
                      <span className="text-sm font-semibold text-text-secondary">
                        {isDifferencePositive ? '↑ Over' : '↓ Short'}
                      </span>
                      <span className="text-lg font-bold text-text-primary">
                        {isDifferencePositive ? '+' : '−'}PKR {Math.abs(difference).toFixed(0)}
                      </span>
                    </div>
                  )}

                  {/* Cash Counting - Split Layout: Counters + Keypad */}
                  <div className="w-full mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-text-secondary">Count Cash</h3>
                      <button
                        onClick={handleResetCounts}
                        disabled={isProcessing}
                        className="text-xs font-medium text-muted-foreground hover:text-text-primary active:scale-95 transition-all disabled:opacity-50"
                      >
                        Reset All
                      </button>
                    </div>

                    <div className="flex gap-4">
                      {/* Left: Compact Counter List */}
                      <div className="flex-1 space-y-1.5">
                        {DENOMINATIONS.map(denom => {
                          const count = Number(counts[denom.value.toString()] || 0);
                          const total = count * denom.value;
                          const isSelected = selectedDenomination === denom.value;

                          return (
                            <div
                              key={denom.value}
                              onClick={() => handleDenominationSelect(denom.value)}
                              className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-primary/10 border-primary shadow-sm'
                                  : 'bg-background border-border hover:bg-accent/20'
                              }`}
                            >
                              {/* Denomination */}
                              <div className="flex-1 min-w-0">
                                <div className={`text-sm font-semibold ${isSelected ? 'text-primary' : 'text-text-primary'}`}>
                                  {denom.label.replace('PKR ', '')}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {total > 0 ? `PKR ${total.toLocaleString()}` : '—'}
                                </div>
                              </div>

                              {/* Controls */}
                              <div className="flex items-center gap-1">
                                {/* Minus */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (count > 0) {
                                      handleCountChange(denom.value, (count - 1).toString());
                                      if (isSelected) {
                                        setKeypadInput((count - 1).toString());
                                      }
                                    }
                                  }}
                                  disabled={isProcessing || count === 0}
                                  className="w-9 h-9 flex items-center justify-center bg-background border border-border text-text-secondary rounded-md font-bold text-lg active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed touch-manipulation transition-all hover:bg-accent/20 select-none"
                                >
                                  −
                                </button>

                                {/* Count Display */}
                                <div className="w-12 h-9 flex items-center justify-center bg-accent/30 border border-border rounded-md">
                                  <span className="text-base font-bold text-text-primary">{count}</span>
                                </div>

                                {/* Plus */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleCountChange(denom.value, (count + 1).toString());
                                    if (isSelected) {
                                      setKeypadInput((count + 1).toString());
                                    }
                                  }}
                                  disabled={isProcessing}
                                  className="w-9 h-9 flex items-center justify-center bg-primary text-primary-foreground rounded-md font-bold text-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation transition-all hover:brightness-90 select-none"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Right: Keypad Area */}
                      <div className="w-36 flex flex-col gap-3">
                        {selectedDenomination !== null ? (
                          <>
                            {/* Selected Denomination Display */}
                            <div className="w-full text-center p-2 bg-primary/10 border border-primary rounded-lg">
                              <div className="text-xs font-medium text-primary mb-1">
                                {DENOMINATIONS.find(d => d.value === selectedDenomination)?.label.replace('PKR ', '')}
                              </div>
                              <div className="text-2xl font-bold text-text-primary">
                                {keypadInput || '0'}
                              </div>
                            </div>

                            {/* Keypad - Centered */}
                            <div className="w-full flex justify-center">
                              <div className="w-fit">
                                <Keypad
                                  onInput={handleKeypadInput}
                                  onClear={handleKeypadClear}
                                  onBackspace={handleKeypadBackspace}
                                  showDecimal={false}
                                />
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="h-full w-full flex items-center justify-center p-4 bg-accent/10 border border-border rounded-lg">
                            <p className="text-xs text-center text-muted-foreground">
                              Tap a denomination to use keypad
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={!currentAmount || isProcessing || currentAmount < 0}
                className="px-12 py-4 bg-primary text-primary-foreground rounded-full font-semibold text-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl active:scale-95 mb-6"
              >
                {isProcessing
                  ? mode === 'open'
                    ? 'Opening Till...'
                    : 'Closing Till...'
                  : mode === 'open'
                  ? 'CLOCK IN!'
                  : 'CLOSE TILL & END SHIFT'}
              </button>

              {/* Add Note Toggle */}
              <button
                onClick={() => setShowNoteInput(!showNoteInput)}
                disabled={isProcessing}
                className="px-6 py-2 bg-transparent border-2 border-border text-text-secondary rounded-full text-sm font-medium hover:bg-accent/20 hover:text-text-primary hover:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {showNoteInput ? 'Hide Note' : 'Add a Note'}
              </button>

              {/* Note Input */}
              {showNoteInput && (
                <div className="w-full mt-6 animate-in slide-in-from-top-2 duration-300">
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={
                      mode === 'open'
                        ? 'Any notes about opening balance or shift start...'
                        : 'Explain any discrepancies or notes about your shift...'
                    }
                    disabled={isProcessing}
                    className="w-full px-4 py-3 bg-card text-text-primary rounded-2xl border-2 border-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Optional: Add context about your {mode === 'open' ? 'opening balance' : 'closing counts'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer - Info */}
          <div className="px-6 py-4 bg-accent/10 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              {user?.posId ? `Terminal: ${user.posId}` : 'No terminal selected'} • {new Date().toLocaleDateString()}
              {mode === 'close' && currentSession && ` • Session: ${currentSession.id.substring(0, 8)}...`}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
