import { Discount, DiscountValidationResult } from './DiscountTypes';

export const calculateDiscountAmount = (
  subtotal: number,
  discount: Discount
): number => {
  if (discount.type === 'percentage') {
    return Math.round((subtotal * discount.value) / 100);
  }
  return Math.min(discount.value, subtotal);
};

export const validateDiscountCode = (
  code: string,
  subtotal: number,
  availableDiscounts: Discount[]
): DiscountValidationResult => {
  const discount = availableDiscounts.find(
    d => d.code.toUpperCase() === code.toUpperCase() && d.isActive !== false
  );

  if (!discount) {
    return {
      isValid: false,
      error: 'Invalid discount code'
    };
  }

  if (discount.minimumOrder && subtotal < discount.minimumOrder) {
    return {
      isValid: false,
      error: `Minimum order amount required: ${discount.minimumOrder}`
    };
  }

  if (discount.validFrom && new Date() < discount.validFrom) {
    return {
      isValid: false,
      error: 'Discount code not yet active'
    };
  }

  if (discount.validUntil && new Date() > discount.validUntil) {
    return {
      isValid: false,
      error: 'Discount code has expired'
    };
  }

  return {
    isValid: true,
    discount
  };
};

export const formatDiscountDisplay = (discount: Discount): string => {
  if (discount.type === 'percentage') {
    return `${discount.value}% off`;
  }
  return `Rs. ${discount.value} off`;
};
