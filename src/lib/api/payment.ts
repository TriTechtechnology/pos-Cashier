import { APIResponse } from './index';

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'cash' | 'card' | 'online';
  isActive: boolean;
}

export interface PaymentTransaction {
  id: string;
  orderId: string;
  amount: number;
  method: PaymentMethod;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  reference?: string;
  timestamp: Date;
  metadata?: Record<string, string | number | boolean>;
}

export interface SplitPayment {
  method: PaymentMethod;
  amount: number;
  reference?: string;
}

export interface PaymentRequest {
  orderId: string;
  amount: number;
  method: PaymentMethod;
  splitPayments?: SplitPayment[];
  customerInfo?: {
    name?: string;
    phone?: string;
    email?: string;
  };
}

export interface PaymentResponse {
  transactionId: string;
  status: 'success' | 'failed';
  message: string;
  reference?: string;
}

export interface OnlineAccountInfo {
  accountNumber: string;
  bankName: string;
  accountTitle: string;
  branchCode: string;
  iban?: string;
  swiftCode?: string;
}

// Mock payment methods
const mockPaymentMethods: PaymentMethod[] = [
  {
    id: 'cash',
    name: 'Cash',
    type: 'cash',
    isActive: true
  },
  {
    id: 'card',
    name: 'Credit/Debit Card',
    type: 'card',
    isActive: true
  },
  {
    id: 'online',
    name: 'Online Transfer',
    type: 'online',
    isActive: true
  }
];

// Mock online account information
const mockOnlineAccount: OnlineAccountInfo = {
  accountNumber: 'PK1234567890123456',
  bankName: 'HBL Bank',
  accountTitle: 'TTT Restaurant',
  branchCode: '1234',
  iban: 'PK36HABB0000001234567890',
  swiftCode: 'HABBPKKA'
};

export const paymentAPI = {
  // Get available payment methods
  getPaymentMethods: async (): Promise<APIResponse<PaymentMethod[]>> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return {
      success: true,
      data: mockPaymentMethods.filter(method => method.isActive),
      message: 'Payment methods retrieved successfully'
    };
  },

  // Get online account information
  getOnlineAccountInfo: async (): Promise<APIResponse<OnlineAccountInfo>> => {
    await new Promise(resolve => setTimeout(resolve, 150));
    return {
      success: true,
      data: mockOnlineAccount,
      message: 'Online account information retrieved successfully'
    };
  },

  // Process payment
  processPayment: async (_paymentRequest: PaymentRequest): Promise<APIResponse<PaymentResponse>> => {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing time
    
    // Simulate payment processing
    const isSuccess = Math.random() > 0.1; // 90% success rate
    
    if (isSuccess) {
      const transactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        success: true,
        data: {
          transactionId,
          status: 'success',
          message: 'Payment processed successfully',
          reference: transactionId
        },
        message: 'Payment completed successfully'
      };
    } else {
      return {
        success: false,
        data: null,
        message: 'Payment failed - please try again',
        error: 'Payment processing failed'
      };
    }
  },

  // Process split payment
  processSplitPayment: async (paymentRequest: PaymentRequest): Promise<APIResponse<PaymentResponse>> => {
    await new Promise(resolve => setTimeout(resolve, 2500)); // Simulate processing time
    
    // Validate split payments
    if (!paymentRequest.splitPayments || paymentRequest.splitPayments.length === 0) {
      return {
        success: false,
        data: null,
        message: 'No split payments provided',
        error: 'Invalid split payment request'
      };
    }
    
    const totalSplit = paymentRequest.splitPayments.reduce((sum, payment) => sum + payment.amount, 0);
    if (Math.abs(totalSplit - paymentRequest.amount) > 0.01) {
      return {
        success: false,
        data: null,
        message: 'Split payment amounts do not equal total amount',
        error: 'Invalid split payment amounts'
      };
    }
    
    // Simulate split payment processing
    const isSuccess = Math.random() > 0.05; // 95% success rate for split payments
    
    if (isSuccess) {
      const transactionId = `SPL${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        success: true,
        data: {
          transactionId,
          status: 'success',
          message: 'Split payment processed successfully',
          reference: transactionId
        },
        message: 'Split payment completed successfully'
      };
    } else {
      return {
        success: false,
        data: null,
        message: 'Split payment failed - please try again',
        error: 'Split payment processing failed'
      };
    }
  },

  // Get payment transaction history
  getTransactionHistory: async (orderId?: string): Promise<APIResponse<PaymentTransaction[]>> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Mock transaction history
    const mockTransactions: PaymentTransaction[] = [
      {
        id: 'TXN001',
        orderId: 'ORD001',
        amount: 1250,
        method: mockPaymentMethods[0], // Cash
        status: 'completed',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        reference: 'CASH001'
      },
      {
        id: 'TXN002',
        orderId: 'ORD002',
        amount: 850,
        method: mockPaymentMethods[1], // Card
        status: 'completed',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        reference: 'CARD002'
      }
    ];
    
    const filteredTransactions = orderId 
      ? mockTransactions.filter(t => t.orderId === orderId)
      : mockTransactions;
    
    return {
      success: true,
      data: filteredTransactions,
      message: 'Transaction history retrieved successfully'
    };
  },

  // Refund payment
  refundPayment: async (transactionId: string, _amount: number): Promise<APIResponse<PaymentResponse>> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate refund processing
    const isSuccess = Math.random() > 0.2; // 80% success rate
    
    if (isSuccess) {
      return {
        success: true,
        data: {
          transactionId: `REF${transactionId}`,
          status: 'success',
          message: 'Refund processed successfully',
          reference: `REF${transactionId}`
        },
        message: 'Refund completed successfully'
      };
    } else {
      return {
        success: false,
        data: null,
        message: 'Refund failed - please try again',
        error: 'Refund processing failed'
      };
    }
  }
};
