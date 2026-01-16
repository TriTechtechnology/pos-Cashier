'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Keypad } from '@/components/ui/Keypad';
import { Shield, X } from 'lucide-react';

interface ManagerPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  pinValue: string;
  pinError: string;
  onPinInput: (digit: string) => void;
  onPinClear: () => void;
  onPinBackspace: () => void;
  onPinSubmit: () => void;
}

export const ManagerPinModal: React.FC<ManagerPinModalProps> = React.memo(({
  isOpen,
  onClose,
  pinValue,
  pinError,
  onPinInput,
  onPinClear,
  onPinBackspace,
  onPinSubmit
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-secondary border border-border rounded-[16px] w-[380px] max-w-[90vw] p-5 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">Manager Authorization</h2>
              <p className="text-sm text-text-secondary">Enter manager PIN to edit paid order</p>
            </div>
          </div>
          <Button
            variant="icon-line"
            size="icon"
            onClick={onClose}
            className="w-8 h-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* PIN Display */}
        <div className="text-center p-4 bg-muted rounded-lg border border-border mb-4">
          <label className="text-sm font-medium text-text-secondary block mb-2">Manager PIN</label>
          <div className="text-2xl font-bold text-text-primary tracking-[0.5em] min-h-[2rem] flex items-center justify-center">
            {pinValue ? '●'.repeat(pinValue.length) : '----'}
          </div>
          {pinError && (
            <div className="text-sm text-destructive mt-2">
              {pinError}
            </div>
          )}
        </div>

        {/* Keypad */}
        <div className="mb-4">
          <Keypad
            onInput={onPinInput}
            onClear={onPinClear}
            onBackspace={onPinBackspace}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button
            variant="line"
            className="flex-1"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="fill"
            className="flex-1"
            onClick={onPinSubmit}
            disabled={pinValue.length !== 4}
          >
            Authorize
          </Button>
        </div>
      </div>
    </div>
  );
});

ManagerPinModal.displayName = 'ManagerPinModal';