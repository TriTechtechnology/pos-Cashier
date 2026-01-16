import React from 'react';
import { User, Mail, MapPin, Calendar, Star } from 'lucide-react';
import { CustomerInfo } from '@/types/pos';
import { formatCurrency } from '@/lib/utils/format';

interface CustomerInfoDisplayProps {
  customer: CustomerInfo;
  variant?: 'compact' | 'detailed';
  showActions?: boolean;
  onEdit?: () => void;
  onViewHistory?: () => void;
}

export const CustomerInfoDisplay: React.FC<CustomerInfoDisplayProps> = React.memo(({
  customer,
  variant = 'detailed',
  showActions = false,
  onEdit,
  onViewHistory
}) => {
  const isCompact = variant === 'compact';

  const containerClasses = isCompact
    ? 'p-3 border border-border rounded-lg bg-card'
    : 'p-4 border border-border rounded-lg bg-card space-y-3';

  const textSize = isCompact ? 'text-sm' : 'text-base';

  return (
    <div className={containerClasses}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className={`font-semibold text-text-primary ${textSize}`}>
              {customer.name || 'Guest Customer'}
            </h3>
            {customer.phone && (
              <p className="text-text-secondary text-sm">
                {customer.phone}
              </p>
            )}
          </div>
        </div>

        {showActions && (
          <div className="flex space-x-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-2 text-text-secondary hover:text-text-primary transition-colors"
                title="Edit customer"
              >
                <User className="w-4 h-4" />
              </button>
            )}
            {onViewHistory && (
              <button
                onClick={onViewHistory}
                className="p-2 text-text-secondary hover:text-text-primary transition-colors"
                title="View order history"
              >
                <Calendar className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Contact Information */}
      {variant === 'detailed' && (
        <div className="space-y-2">
          {customer.email && (
            <div className="flex items-center space-x-2 text-sm">
              <Mail className="w-4 h-4 text-text-secondary" />
              <span className="text-text-secondary">{customer.email}</span>
            </div>
          )}
          
          {customer.phone && (
            <div className="flex items-center space-x-2 text-sm">
              <MapPin className="w-4 h-4 text-text-secondary" />
              <span className="text-text-secondary">{customer.phone}</span>
            </div>
          )}
        </div>
      )}

      {/* Loyalty Information */}
      {customer.currentStamps !== undefined && (
        <div className="flex items-center space-x-2 text-sm">
          <Star className="w-4 h-4 text-yellow-500" />
          <span className="text-text-secondary">
            {customer.currentStamps} loyalty stamps
          </span>
        </div>
      )}

      {/* Total Spent */}
      {customer.totalSpent !== undefined && (
        <div className="text-sm">
          <span className="text-text-secondary">Total spent: </span>
          <span className="font-semibold text-text-primary">
            {formatCurrency(customer.totalSpent)}
          </span>
        </div>
      )}
    </div>
  );
});

CustomerInfoDisplay.displayName = 'CustomerInfoDisplay';
