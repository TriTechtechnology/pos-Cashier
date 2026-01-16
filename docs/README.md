# POS Cashier System - Offline-First Architecture

## 🚀 Overview
A professional Point of Sale (POS) system built with Next.js, designed to work offline-first with centralized mock data for seamless testing and easy deployment.

## ✨ Features
- **Offline-First**: Works completely offline with mock data
- **Centralized Data**: All mock data in one place for easy management
- **Loyalty Integration**: Digital stamp cards and customer management
- **Slot Management**: Table/delivery zone management
- **Clean Architecture**: Simplified, maintainable codebase

## 🏗️ Architecture

### Data Flow
```
Mock Data Manager → APIs → Stores → Components
```

### Key Files
- `src/lib/api/mockDataManager.ts` - Centralized mock data
- `src/lib/api/loyalty.ts` - Loyalty card management
- `src/lib/api/categories.ts` - Menu categories and items
- `src/lib/api/slots.ts` - Slot/table management
- `src/lib/store/` - State management (cart, customer, menu)

## 🧪 Testing

### Mock Mode (Default)
The system runs in mock mode by default, using centralized mock data:
- Menu items with proper IDs (MI001, MI002, etc.)
- Modifiers with IDs (MOD001, MOD002, etc.)
- Customer loyalty cards with order history
- Slots and order types

### Switching to Real APIs
To switch to real APIs, simply:
1. Update `src/lib/api/index.ts` - change `mode: 'real'`
2. Replace mock data with real API endpoints
3. Update environment variables

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run in development (mock mode)
npm run dev

# Build for production
npm run build
```

## 📱 Usage

### 1. Menu Management
- Browse categories and items
- Add items to cart with modifiers
- Manage item preferences

### 2. Cart Operations
- Add/remove items
- Apply discounts
- Manage customer information
- Process orders

### 3. Loyalty System
- Scan customer loyalty cards
- View order history
- Reorder from previous orders
- Manage stamps

### 4. Slot Management
- Select table/delivery zone
- Change order types
- Monitor slot status

## 🔧 Development

### Adding New Features
1. **Mock Data**: Add to `mockDataManager.ts`
2. **API**: Create simple API function
3. **Store**: Add to appropriate Zustand store
4. **Component**: Build UI component

### Data Consistency
- All IDs follow hierarchical pattern (CAT001, MI001, MOD001)
- Mock data references are validated automatically
- Changes sync across all components

## 🎯 Production Deployment

1. **Switch API Mode**: Change `mode: 'real'` in `src/lib/api/index.ts`
2. **Environment Variables**: Set `NEXT_PUBLIC_API_BASE_URL`
3. **Database**: Ensure backend APIs match expected structure
4. **Test**: Verify all functionality works with real data

## 🧹 Code Quality

- **No Circular Dependencies**: Clean import structure
- **Type Safety**: Full TypeScript support
- **Performance**: Optimized for tablets/iPads
- **Maintainability**: Simple, readable code

## 📝 Notes

- System designed for real-world POS scenarios
- Removed unnecessary complexity and unused features
- Focus on core functionality: menu, cart, loyalty, slots
- Easy to extend with additional features

---

Built with ❤️ for professional POS operations
