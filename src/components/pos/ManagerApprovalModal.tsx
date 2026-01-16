/**
 * Manager Approval Modal Component
 *
 * PURPOSE: Professional POS manager approval for sensitive operations like:
 * - Voiding paid items (refunds)
 * - Marking paid items as waste
 * - Modifying completed orders
 *
 * COMPLIANCE: Meets restaurant POS audit requirements for paid item modifications
 */

'use client';

import React, { useState } from 'react';
import { Shield, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ManagerApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: (pin: string, reason: string, inventoryReversal?: boolean) => void;
  operation: 'void' | 'waste' | 'modify' | 'refund' | 'cancel';
  itemName?: string;
  amount?: number;
  showInventoryReversal?: boolean;
}

export const ManagerApprovalModal: React.FC<ManagerApprovalModalProps> = ({
  isOpen,
  onClose,
  onApprove,
  operation,
  itemName,
  amount,
  showInventoryReversal = false
}) => {
  const [pin, setPin] = useState('');
  const [reason, setReason] = useState('');
  const [inventoryReversal, setInventoryReversal] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const operationLabels = {
    void: 'Void Item',
    waste: 'Mark as Waste',
    modify: 'Modify Paid Item',
    refund: 'Process Refund',
    cancel: 'Cancel Order'
  };

  const operationDescriptions = {
    void: 'This will void the paid item and process a refund',
    waste: 'This will mark the item as waste (no refund)',
    modify: 'This will allow modification of the paid item',
    refund: 'This will process a refund for the customer',
    cancel: 'This will cancel the entire processing order'
  };

  const handleApprove = () => {
    if (!pin.trim()) {
      setError('Manager PIN is required');
      return;
    }

    if (!reason.trim()) {
      setError('Reason is required for audit trail');
      return;
    }

    onApprove(pin, reason, showInventoryReversal ? inventoryReversal : undefined);
    handleClose();
  };

  const handleClose = () => {
    setPin('');
    setReason('');
    setInventoryReversal(false);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card border border-border rounded-2xl p-6 max-w-md mx-4 w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                Manager Approval Required
              </h2>
              <p className="text-sm text-text-secondary">
                {operationLabels[operation]}
              </p>
            </div>
          </div>
          <Button variant="icon" size="sm" onClick={handleClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Operation Details */}
        <div className="mb-6 p-4 bg-background rounded-lg border border-border">
          <p className="text-sm text-text-secondary mb-2">
            {operationDescriptions[operation]}
          </p>
          {itemName && (
            <p className="font-medium text-text-primary">
              Item: {itemName}
            </p>
          )}
          {amount && (
            <p className="font-medium text-text-primary">
              Amount: Rs. {amount.toFixed(0)}
            </p>
          )}
        </div>

        {/* Manager PIN */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-text-primary mb-2">
            Manager PIN
          </label>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full p-3 bg-background border border-border rounded-lg text-text-primary"
            placeholder="Enter manager PIN"
            maxLength={6}
          />
        </div>

        {/* Reason */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-text-primary mb-2">
            Reason (Required for Audit)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full p-3 bg-background border border-border rounded-lg text-text-primary resize-none"
            placeholder="Enter reason for this operation..."
            rows={3}
            maxLength={200}
          />
          <p className="text-xs text-text-secondary mt-1">
            {reason.length}/200 characters
          </p>
        </div>

        {/* Inventory Reversal Toggle */}
        {showInventoryReversal && (
          <div className="mb-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={inventoryReversal}
                onChange={(e) => setInventoryReversal(e.target.checked)}
                className="w-4 h-4 text-amber-600 bg-background border border-border rounded focus:ring-amber-500"
              />
              <div>
                <span className="text-sm font-medium text-text-primary">
                  Reverse Inventory
                </span>
                <p className="text-xs text-text-secondary">
                  Return cancelled items back to inventory
                </p>
              </div>
            </label>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="line"
            className="flex-1"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            variant="fill"
            className="flex-1 bg-amber-600 hover:bg-amber-700"
            onClick={handleApprove}
          >
            Approve
          </Button>
        </div>
      </div>
    </div>
  );
};