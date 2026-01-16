# Deployment Configuration Guide

This guide explains how to configure the POS system for deployment and switch from mock data to real API endpoints.

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

### API Endpoints
```bash
# Main API base URL (replace with your actual API URL)
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Loyalty service API URL
NEXT_PUBLIC_LOYALTY_API_URL=https://api.loyalty.com

# Payment service API URL  
NEXT_PUBLIC_PAYMENT_API_URL=https://api.payment.com
```

### API Keys
```bash
# Loyalty service API key
NEXT_PUBLIC_LOYALTY_API_KEY=your_loyalty_api_key_here

# Payment service API key
NEXT_PUBLIC_PAYMENT_API_KEY=your_payment_api_key_here
```

### Feature Flags
```bash
# Use mock data instead of real API calls
# Set to 'true' for development, 'false' for production
NEXT_PUBLIC_USE_MOCK_DATA=true

# Enable offline mode
# Set to 'true' to enable offline functionality
NEXT_PUBLIC_ENABLE_OFFLINE_MODE=true

# Enable debug logging
# Set to 'true' to enable detailed API logging
NEXT_PUBLIC_DEBUG_LOGGING=true
```

## Deployment Steps

### 1. Development Setup
For development, use these settings:
```bash
NEXT_PUBLIC_USE_MOCK_DATA=true
NEXT_PUBLIC_ENABLE_OFFLINE_MODE=true
NEXT_PUBLIC_DEBUG_LOGGING=true
```

### 2. Production Deployment
For production deployment, update these values:
```bash
NEXT_PUBLIC_USE_MOCK_DATA=false
NEXT_PUBLIC_ENABLE_OFFLINE_MODE=false
NEXT_PUBLIC_DEBUG_LOGGING=false
NEXT_PUBLIC_API_URL=https://your-production-api.com/api
NEXT_PUBLIC_LOYALTY_API_URL=https://your-loyalty-api.com
NEXT_PUBLIC_PAYMENT_API_URL=https://your-payment-api.com
```

## Mock Data Structure

The system uses centralized mock data located in:
- `src/lib/api/mockDataManager.ts` - Main mock data
- `src/lib/services/MockDataService.ts` - Mock API service

### Mock Data Includes:
- **Categories**: Hot Beverages, Cold Beverages, Food & Snacks, Desserts
- **Menu Items**: Complete with modifiers, variations, and add-ons
- **Slots**: Dine-in, take-away, and delivery slots
- **Loyalty Cards**: Customer data with order history
- **Discounts**: Available discount codes
- **Orders**: Sample order data

## API Service Architecture

The system uses a factory pattern to switch between mock and real APIs:

```typescript
// In src/lib/services/MockDataService.ts
export class ApiServiceFactory {
  static getService() {
    if (shouldUseMockData()) {
      return MockDataService;
    }
    // TODO: Return RealApiService when ready for production
    return MockDataService;
  }
}
```

## Switching to Real APIs

When ready to deploy with real APIs:

1. **Update Environment Variables**:
   - Set `NEXT_PUBLIC_USE_MOCK_DATA=false`
   - Configure real API URLs and keys

2. **Implement Real API Service**:
   - Create `src/lib/services/RealApiService.ts`
   - Implement the same interface as `MockDataService`
   - Update `ApiServiceFactory` to return `RealApiService`

3. **Test API Integration**:
   - Verify all endpoints work correctly
   - Test error handling
   - Ensure data formats match

## API Endpoints Structure

The system expects these API endpoints:

### Categories & Menu
- `GET /categories` - Get all categories
- `GET /categories/:id` - Get category by ID
- `GET /menu-items` - Get all menu items
- `GET /menu-items/:id` - Get menu item by ID

### Orders
- `POST /orders` - Create new order
- `GET /orders/history` - Get order history

### Slots
- `GET /slots` - Get all slots
- `GET /slots?type=:type` - Get slots by type

### Loyalty
- `GET /loyalty/cards` - Get all loyalty cards
- `GET /loyalty/cards/:id` - Get loyalty card by ID
- `GET /loyalty/search?phone=:phone` - Search by phone

### Payment
- `POST /payment` - Process payment

### Customer
- `GET /customers/search?q=:query` - Search customers

## Error Handling

The system includes comprehensive error handling:
- Network timeouts
- API errors
- Fallback to mock data (in development)
- User-friendly error messages

## Testing

Before deployment:
1. Test with mock data (`NEXT_PUBLIC_USE_MOCK_DATA=true`)
2. Test with real APIs (`NEXT_PUBLIC_USE_MOCK_DATA=false`)
3. Test offline mode
4. Test error scenarios

## Security Notes

- Never commit `.env.local` to version control
- Use environment-specific API keys
- Implement proper authentication
- Use HTTPS in production
- Validate all API responses
