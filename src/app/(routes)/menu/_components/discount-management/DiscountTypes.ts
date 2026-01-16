export interface Discount {
  type: 'percentage' | 'fixed';
  value: number;
  code: string;
  name: string;
  minimumOrder?: number;
  description?: string;
  isActive?: boolean;
  validFrom?: Date;
  validUntil?: Date;
}

export interface DiscountApplication {
  discount: Discount;
  appliedAt: Date;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
}

export interface DiscountValidationResult {
  isValid: boolean;
  error?: string;
  discount?: Discount;
}
