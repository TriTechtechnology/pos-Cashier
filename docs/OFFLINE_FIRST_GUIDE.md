# Offline-First POS System Guide

## 🚀 Overview
outdated
This POS system is built with an **offline-first architecture** that ensures your business can continue operating even when internet connectivity is lost. The system automatically syncs data when connection is restored.

for now we will continue tesitng the whole workflow offline but in real cases, after linking with the client database, it will fetch and save the categories with their unique menu items and modifiers (all having ids) so that if the device goes offline it can continue its operations until it is back online, and when it gets back online it automatically syncs and updates the clients database with new orders and information so setup this app in a way that all of it works offline and syncs with online database when connected online, ask me for more context before building anything

## 🔧 How It Works

### 1. **API Mode System**
- **Mock Mode**: Uses local mock data for testing
- **Real Mode**: Connects to your backend API
- **Automatic Fallback**: Falls back to cached data when offline

### 2. **Caching System**
- **24-hour cache**: API responses are cached for 24 hours
- **Automatic expiry**: Old cache is automatically cleared
- **Offline access**: Cached data available when offline

### 3. **Sync System**
- **Queue-based**: Changes are queued when offline
- **Automatic sync**: Syncs when connection is restored
- **Retry logic**: Failed syncs are retried up to 3 times

## 🧪 Testing

### Console Commands
Open browser console and use these commands:

```javascript
// Switch API modes
POS.setMockMode()    // Use mock data
POS.setRealMode()    // Use real API

// Clear data
POS.clearAll()       // Clear all data

// Debug info
POS.debug()          // Show debug information
POS.export()         // Export debug info to file

// Performance test
POS.test()           // Test API performance
```

### API Mode Selector
Look for the **API Mode Selector** in the bottom-right corner of the home page:
- Switch between Mock and Real modes
- View cache status
- View sync status
- Clear cache
- Refresh status

## 🔄 Data Flow

### Online Mode
```
User Action → API Call → Backend → Cache → UI Update
```

### Offline Mode
```
User Action → Local Storage → Queue → UI Update
```

### Sync Process
```
Connection Restored → Process Queue → Backend → Clear Queue
```

## 📁 File Structure

```
src/lib/
├── api/
│   ├── apiAdapter.ts      # Enhanced API adapter
│   ├── index.ts           # API exports
│   └── [api-files].ts     # Individual API modules
├── offline/
│   └── syncManager.ts     # Sync management
└── utils/
    └── testUtils.ts       # Testing utilities
```

## 🛠️ Configuration

### Environment Variables
```bash
# For development (uses mock data)
NODE_ENV=development

# For production (uses real API)
NEXT_PUBLIC_API_BASE_URL=https://your-api.com
```

### API Endpoints Expected
Your backend should provide these endpoints:

```typescript
GET  /api/categories          // Menu categories and items
GET  /api/loyalty/cards/*     // Loyalty card operations
GET  /api/orders             // Order management
GET  /api/slots              // Slot management
POST /api/orders             // Create orders
PUT  /api/orders/:id         // Update orders
PUT  /api/slots/:id          // Update slots
```

## 🔍 Debugging

### Check API Mode
```javascript
console.log('Current mode:', POS.debug().apiMode);
```

### Check Cache Status
```javascript
console.log('Cache status:', POS.debug().cacheStatus);
```

### Check Sync Status
```javascript
console.log('Sync status:', POS.debug().syncStatus);
```

### Export Debug Info
```javascript
POS.export(); // Downloads debug-info.json
```

## 🚨 Troubleshooting

### Common Issues

1. **Re-order not working**
   - Check if items exist in categories API
   - Verify item names match exactly

2. **Cache not updating**
   - Clear cache: `POS.clearAll()`
   - Refresh page

3. **Sync not working**
   - Check internet connection
   - Force sync: `POS.forceSync()`

4. **Performance issues**
   - Run performance test: `POS.test()`
   - Check cache status

### Reset Everything
```javascript
POS.clearAll(); // Clears all data and cache
location.reload(); // Reload page
```

## 📊 Monitoring

### Cache Status
- **Cached**: Data available offline
- **Not cached**: Data needs internet connection

### Sync Status
- **Online**: Connected to internet
- **Pending**: Items waiting to sync
- **Last Sync**: When data was last synced

## 🔒 Security

- All sensitive data is stored locally
- Sync queue is encrypted in localStorage
- API calls use HTTPS in production
- No sensitive data in cache

## 📈 Performance

- **Cache hit**: ~10ms response time
- **API call**: ~100-500ms response time
- **Offline mode**: Instant response
- **Sync process**: Background, non-blocking

## 🎯 Best Practices

1. **Always test in Mock mode first**
2. **Use console commands for debugging**
3. **Monitor sync status regularly**
4. **Clear cache when switching environments**
5. **Export debug info for support**

## 🆘 Support

If you encounter issues:

1. Run `POS.debug()` and check the output
2. Export debug info with `POS.export()`
3. Check the console for error messages
4. Verify your backend API endpoints
5. Test with mock data first

---

**Remember**: This system is designed to keep your business running even when the internet is down! 🌐➡️📱
