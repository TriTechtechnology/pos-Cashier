
// Coffee Shop Mock Data Structure with Complete Modifier System
export const MOCK_DATA = {
  // Order time status configuration for OrderOverlay
  orderTimeConfig: {
    colorThresholds: {
      fresh: { minutes: 15, colorClass: 'text-success' },
      warning: { minutes: 40, colorClass: 'text-warning' },
      overdue: { minutes: Infinity, colorClass: 'text-destructive' }
    },
    defaultDisplay: 'Just now'
  },

  // Order status color configuration (KDS-ready)
  // KDS Workflow: pending -> in-progress -> ready -> completed
  // Alternative flows: pending -> cancelled, in-progress -> cancelled
  orderStatusConfig: {
    pending: { colorClass: 'text-orange-500', displayName: 'Pending' },        // Order placed, waiting for kitchen
    'in-progress': { colorClass: 'text-blue-500', displayName: 'Processing' }, // Kitchen is preparing
    ready: { colorClass: 'text-green-500', displayName: 'Ready' },             // Ready for pickup/delivery
    completed: { colorClass: 'text-gray-500', displayName: 'Completed' },      // Order fulfilled
    cancelled: { colorClass: 'text-red-500', displayName: 'Cancelled' },       // Order cancelled
    unpaid: { colorClass: 'text-orange-600', displayName: 'Unpaid' }           // Payment pending (legacy)
  },
  // Categories with their menu items
  categories: [
    {
      id: 'cat-001',
      name: 'Hot Beverages',
      description: 'Warm and comforting drinks',
      items: [
        {
          id: 'item-001',
      name: 'Espresso',
          description: 'Single shot of pure coffee',
          price: 120,
          category: 'Hot Beverages',
      available: true,
      image: undefined,
          modifiers: {
            variations: [
              { id: 'var-001', name: 'Single Shot', price: 0, required: true },
              { id: 'var-002', name: 'Double Shot', price: 40, required: false },
              { id: 'var-003', name: 'Triple Shot', price: 80, required: false }
            ],
            addOns: [
              { id: 'addon-001', name: 'Extra Hot', price: 0, required: false },
              { id: 'addon-002', name: 'Mild', price: 0, required: false }
            ],
            specialInstructions: true,
            frequentlyBoughtTogether: ['item-009', 'item-011'] // Croissant, Muffin
          }
        },
        {
          id: 'item-002',
      name: 'Cappuccino',
      description: 'Espresso with steamed milk and foam',
          price: 180,
          category: 'Hot Beverages',
      available: true,
      image: undefined,
          modifiers: {
            variations: [
              { id: 'var-004', name: 'Regular', price: 0, required: true },
              { id: 'var-005', name: 'Large', price: 30, required: false }
            ],
            addOns: [
              { id: 'addon-003', name: 'Extra Foam', price: 20, required: false },
              { id: 'addon-004', name: 'Less Foam', price: 0, required: false },
              { id: 'addon-005', name: 'Extra Hot', price: 0, required: false }
            ],
            specialInstructions: true,
            frequentlyBoughtTogether: ['item-009', 'item-012'] // Croissant, Cheesecake
          }
        },
        {
          id: 'item-003',
      name: 'Latte',
      description: 'Espresso with steamed milk',
          price: 200,
          category: 'Hot Beverages',
      available: true,
      image: undefined,
          modifiers: {
            variations: [
              { id: 'var-006', name: 'Regular', price: 0, required: true },
              { id: 'var-007', name: 'Large', price: 40, required: false }
            ],
            addOns: [
              { id: 'addon-006', name: 'Extra Milk', price: 20, required: false },
              { id: 'addon-007', name: 'Less Milk', price: 0, required: false },
              { id: 'addon-008', name: 'Extra Hot', price: 0, required: false }
            ],
            specialInstructions: true,
            frequentlyBoughtTogether: ['item-010', 'item-013'] // Sandwich, Brownie
          }
        },
        {
          id: 'item-004',
      name: 'Americano',
      description: 'Espresso with hot water',
          price: 150,
          category: 'Hot Beverages',
      available: true,
      image: undefined,
          modifiers: {
            variations: [
              { id: 'var-008', name: 'Regular', price: 0, required: true },
              { id: 'var-009', name: 'Large', price: 30, required: false }
            ],
            addOns: [
              { id: 'addon-009', name: 'Extra Water', price: 0, required: false },
              { id: 'addon-010', name: 'Less Water', price: 0, required: false }
            ],
            specialInstructions: true,
            frequentlyBoughtTogether: ['item-009', 'item-011'] // Croissant, Muffin
          }
        },
        {
          id: 'item-005',
      name: 'Mocha',
      description: 'Espresso with chocolate and steamed milk',
      price: 220,
          category: 'Hot Beverages',
      available: true,
      image: undefined,
          modifiers: {
            variations: [
              { id: 'var-010', name: 'Regular', price: 0, required: true },
              { id: 'var-011', name: 'Large', price: 40, required: false }
            ],
            addOns: [
              { id: 'addon-011', name: 'Extra Chocolate', price: 30, required: false },
              { id: 'addon-012', name: 'Less Chocolate', price: 0, required: false },
              { id: 'addon-013', name: 'Whipped Cream', price: 25, required: false }
            ],
            specialInstructions: true,
            frequentlyBoughtTogether: ['item-012', 'item-013'] // Cheesecake, Brownie
          }
        },
        {
          id: 'item-014',
          name: 'Macchiato',
          description: 'Espresso with a dollop of foam',
          price: 190,
          category: 'Hot Beverages',
          available: true,
          image: undefined,
          modifiers: {
            variations: [
              { id: 'var-032', name: 'Regular', price: 0, required: true },
              { id: 'var-033', name: 'Large', price: 35, required: false }
            ],
            addOns: [
              { id: 'addon-035', name: 'Extra Foam', price: 15, required: false },
              { id: 'addon-036', name: 'Less Foam', price: 0, required: false },
              { id: 'addon-037', name: 'Caramel Drizzle', price: 25, required: false }
            ],
            specialInstructions: true,
            frequentlyBoughtTogether: ['item-009', 'item-011'] // Croissant, Muffin
          }
        },
        {
          id: 'item-015',
          name: 'Hot Chocolate',
          description: 'Rich and creamy chocolate drink',
          price: 180,
          category: 'Hot Beverages',
          available: true,
          image: undefined,
          modifiers: {
            variations: [
              { id: 'var-034', name: 'Regular', price: 0, required: true },
              { id: 'var-035', name: 'Large', price: 30, required: false }
            ],
            addOns: [
              { id: 'addon-038', name: 'Extra Chocolate', price: 25, required: false },
              { id: 'addon-039', name: 'Whipped Cream', price: 20, required: false },
              { id: 'addon-040', name: 'Marshmallows', price: 15, required: false }
            ],
            specialInstructions: true,
            frequentlyBoughtTogether: ['item-012', 'item-013'] // Cheesecake, Brownie
          }
        },
        {
          id: 'item-016',
          name: 'Chai Latte',
          description: 'Spiced tea with steamed milk',
          price: 170,
          category: 'Hot Beverages',
          available: true,
          image: undefined,
          modifiers: {
            variations: [
              { id: 'var-036', name: 'Regular', price: 0, required: true },
              { id: 'var-037', name: 'Large', price: 30, required: false }
            ],
            addOns: [
              { id: 'addon-041', name: 'Extra Spice', price: 10, required: false },
              { id: 'addon-042', name: 'Less Spice', price: 0, required: false },
              { id: 'addon-043', name: 'Honey', price: 15, required: false }
            ],
            specialInstructions: true,
            frequentlyBoughtTogether: ['item-009', 'item-010'] // Croissant, Sandwich
          }
        },
        {
          id: 'item-017',
          name: 'Flat White',
          description: 'Espresso with microfoam milk',
          price: 200,
          category: 'Hot Beverages',
          available: true,
          image: undefined,
          modifiers: {
            variations: [
              { id: 'var-038', name: 'Regular', price: 0, required: true },
              { id: 'var-039', name: 'Large', price: 40, required: false }
            ],
            addOns: [
              { id: 'addon-044', name: 'Extra Microfoam', price: 20, required: false },
              { id: 'addon-045', name: 'Less Microfoam', price: 0, required: false },
              { id: 'addon-046', name: 'Extra Hot', price: 0, required: false }
            ],
            specialInstructions: true,
            frequentlyBoughtTogether: ['item-009', 'item-011'] // Croissant, Muffin
          }
        },
        {
          id: 'item-018',
          name: 'Cortado',
          description: 'Equal parts espresso and warm milk',
          price: 160,
          category: 'Hot Beverages',
          available: true,
          image: undefined,
          modifiers: {
            variations: [
              { id: 'var-040', name: 'Regular', price: 0, required: true },
              { id: 'var-041', name: 'Large', price: 35, required: false }
            ],
            addOns: [
              { id: 'addon-047', name: 'Extra Milk', price: 15, required: false },
              { id: 'addon-048', name: 'Less Milk', price: 0, required: false },
              { id: 'addon-049', name: 'Extra Hot', price: 0, required: false }
            ],
            specialInstructions: true,
            frequentlyBoughtTogether: ['item-009', 'item-010'] // Croissant, Sandwich
          }
        }
      ]
    },
    {
      id: 'cat-002',
      name: 'Cold Beverages',
      description: 'Refreshing cold drinks',
      items: [
        {
          id: 'item-006',
          name: 'Iced Coffee',
          description: 'Chilled coffee with ice',
          price: 180,
          category: 'Cold Beverages',
          available: true,
          image: undefined,
          modifiers: {
            variations: [
              { id: 'var-012', name: 'Regular', price: 0, required: true },
              { id: 'var-013', name: 'Large', price: 30, required: false }
            ],
            addOns: [
              { id: 'addon-014', name: 'Extra Ice', price: 0, required: false },
              { id: 'addon-015', name: 'Less Ice', price: 0, required: false },
              { id: 'addon-016', name: 'Sweetened', price: 0, required: false }
            ],
            specialInstructions: true,
            frequentlyBoughtTogether: ['item-009', 'item-010'] // Croissant, Sandwich
          }
        },
        {
          id: 'item-007',
          name: 'Iced Latte',
          description: 'Chilled latte with ice',
          price: 220,
          category: 'Cold Beverages',
          available: true,
          image: undefined,
          modifiers: {
            variations: [
              { id: 'var-014', name: 'Regular', price: 0, required: true },
              { id: 'var-015', name: 'Large', price: 40, required: false }
            ],
            addOns: [
              { id: 'addon-017', name: 'Extra Ice', price: 0, required: false },
              { id: 'addon-018', name: 'Less Ice', price: 0, required: false },
              { id: 'addon-019', name: 'Sweetened', price: 0, required: false }
            ],
            specialInstructions: true,
            frequentlyBoughtTogether: ['item-010', 'item-011'] // Sandwich, Muffin
          }
        },
        {
          id: 'item-008',
          name: 'Frappuccino',
          description: 'Blended coffee drink',
          price: 250,
          category: 'Cold Beverages',
          available: true,
          image: undefined,
          modifiers: {
            variations: [
              { id: 'var-016', name: 'Regular', price: 0, required: true },
              { id: 'var-017', name: 'Large', price: 50, required: false }
            ],
            addOns: [
              { id: 'addon-020', name: 'Extra Blended', price: 0, required: false },
              { id: 'addon-021', name: 'Whipped Cream', price: 25, required: false },
              { id: 'addon-022', name: 'Caramel Drizzle', price: 30, required: false }
            ],
            specialInstructions: true,
            frequentlyBoughtTogether: ['item-012', 'item-013'] // Cheesecake, Brownie
          }
        }
      ]
    },
    {
      id: 'cat-003',
      name: 'Food & Snacks',
      description: 'Delicious food items',
          items: [
            {
          id: 'item-009',
          name: 'Croissant',
          description: 'Buttery French pastry',
          price: 150,
          category: 'Food & Snacks',
          available: true,
          image: undefined,
          modifiers: {
            variations: [
              { id: 'var-018', name: 'Plain', price: 0, required: true },
              { id: 'var-019', name: 'Chocolate', price: 30, required: false },
              { id: 'var-020', name: 'Almond', price: 40, required: false }
            ],
            addOns: [
              { id: 'addon-023', name: 'Warmed', price: 0, required: false },
              { id: 'addon-024', name: 'Butter', price: 15, required: false }
            ],
            specialInstructions: true,
            frequentlyBoughtTogether: ['item-001', 'item-002'] // Espresso, Cappuccino
          }
        },
        {
          id: 'item-010',
          name: 'Sandwich',
          description: 'Fresh deli sandwich',
          price: 300,
          category: 'Food & Snacks',
          available: true,
          image: undefined,
              modifiers: {
                variations: [
              { id: 'var-021', name: 'Chicken', price: 0, required: true },
              { id: 'var-022', name: 'Turkey', price: 0, required: false },
              { id: 'var-023', name: 'Vegetarian', price: 0, required: false }
                ],
                addOns: [
              { id: 'addon-025', name: 'Extra Cheese', price: 25, required: false },
              { id: 'addon-026', name: 'Extra Meat', price: 50, required: false },
              { id: 'addon-027', name: 'No Mayo', price: 0, required: false }
            ],
            specialInstructions: true,
            frequentlyBoughtTogether: ['item-003', 'item-006'] // Latte, Iced Coffee
          }
        },
        {
          id: 'item-011',
          name: 'Muffin',
          description: 'Fresh baked muffin',
          price: 120,
          category: 'Food & Snacks',
          available: true,
          image: undefined,
              modifiers: {
            variations: [
              { id: 'var-024', name: 'Blueberry', price: 0, required: true },
              { id: 'var-025', name: 'Chocolate Chip', price: 0, required: false },
              { id: 'var-026', name: 'Banana Nut', price: 0, required: false }
            ],
            addOns: [
              { id: 'addon-028', name: 'Warmed', price: 0, required: false },
              { id: 'addon-029', name: 'Butter', price: 15, required: false }
            ],
            specialInstructions: true,
            frequentlyBoughtTogether: ['item-001', 'item-004'] // Espresso, Americano
              }
            }
          ]
        },
        {
      id: 'cat-004',
      name: 'Desserts',
      description: 'Sweet treats and desserts',
          items: [
            {
          id: 'item-012',
          name: 'Cheesecake',
          description: 'Creamy New York style cheesecake',
          price: 350,
          category: 'Desserts',
          available: true,
          image: undefined,
              modifiers: {
                variations: [
              { id: 'var-027', name: 'Plain', price: 0, required: true },
              { id: 'var-028', name: 'Strawberry', price: 50, required: false },
              { id: 'var-029', name: 'Blueberry', price: 50, required: false }
                ],
                addOns: [
              { id: 'addon-030', name: 'Extra Sauce', price: 30, required: false },
              { id: 'addon-031', name: 'Whipped Cream', price: 25, required: false }
            ],
            specialInstructions: true,
            frequentlyBoughtTogether: ['item-002', 'item-005'] // Cappuccino, Mocha
          }
        },
        {
          id: 'item-013',
          name: 'Brownie',
          description: 'Rich chocolate brownie',
          price: 180,
          category: 'Desserts',
          available: true,
          image: undefined,
              modifiers: {
            variations: [
              { id: 'var-030', name: 'Regular', price: 0, required: true },
              { id: 'var-031', name: 'Double', price: 80, required: false }
            ],
            addOns: [
              { id: 'addon-032', name: 'Warmed', price: 0, required: false },
              { id: 'addon-033', name: 'Ice Cream', price: 100, required: false },
              { id: 'addon-034', name: 'Caramel Sauce', price: 30, required: false }
            ],
            specialInstructions: true,
            frequentlyBoughtTogether: ['item-003', 'item-008'] // Latte, Frappuccino
          }
        }
      ]
    }
  ],

  // Available slots for different order types
  slots: [
    {
      id: 'slot-001',
      number: 'A1',
      orderType: 'dine-in',
      status: 'available',
      startTime: null,
      customerCount: null,
      orderDetails: null
    },
    {
      id: 'slot-002',
      number: 'A2',
      orderType: 'dine-in',
      status: 'available',
      startTime: null,
      customerCount: null,
      orderDetails: null
    },
    {
      id: 'slot-003',
      number: 'B1',
      orderType: 'take-away',
      status: 'available',
      startTime: null,
      customerCount: null,
      orderDetails: null
    },
    {
      id: 'slot-004',
      number: 'B2',
      orderType: 'take-away',
      status: 'available',
      startTime: null,
      customerCount: null,
      orderDetails: null
    },
    {
      id: 'slot-005',
      number: 'C1',
      orderType: 'delivery',
      status: 'available',
      startTime: null,
      customerCount: null,
      orderDetails: null
    }
  ],

  // Available discounts
  availableDiscounts: [
    {
      id: 'discount-001',
      code: 'WELCOME10',
      description: 'Welcome discount',
      percentage: 10,
      validUntil: '2025-12-31',
      minimumOrder: 500
    },
    {
      id: 'discount-002',
      code: 'STUDENT15',
      description: 'Student discount',
      percentage: 15,
      validUntil: '2025-12-31',
      minimumOrder: 300
    }
  ],
  
  // Additional mock data for loyalty and other features
  loyaltyCards: {
    'LC001': {
      id: 'LC001',
      qrCode: 'loyalty:LC001:+923001234567',
      customerId: 'CUST001',
      customerName: 'Faraz',
      customerPhone: '+923167110329',
      customerEmail: 'faraz@email.com',
      currentStamps: 8,
      totalStamps: 25,
      memberSince: '2024-01-15',
      isActive: true,
      lastUsed: '2024-12-01',
      specialInstructions: 'Extra hot, less sugar',
      recentOrders: [
        {
          id: 'ORD001',
          date: '2024-12-01',
          total: 450,
          items: [
            {
              id: 'item-001',
              menuItemId: 'item-001',
              name: 'Espresso',
              price: 120,
              quantity: 1,
              modifierIds: {
                variations: ['var-002'],
                addOns: ['addon-001'],
                specialInstructions: 'Extra hot'
              }
            },
            {
              id: 'item-009',
              menuItemId: 'item-009',
              name: 'Croissant',
              price: 150,
              quantity: 1,
              modifierIds: {
                variations: [],
                addOns: [],
                specialInstructions: ''
              }
            },
            {
              id: 'item-011',
              menuItemId: 'item-011',
              name: 'Muffin',
              price: 180,
              quantity: 1,
              modifierIds: {
                variations: [],
                addOns: [],
                specialInstructions: ''
              }
            }
          ],
          status: 'completed',
          stampsEarned: 2,
          stampsRedeemed: 0
        }
      ]
    },
    'LC002': {
      id: 'LC002',
      qrCode: 'loyalty:LC002:+923001234568',
      customerId: 'CUST002',
      customerName: 'Fahad',
      customerPhone: '+923330445187',
      customerEmail: 'fahad@email.com',
      currentStamps: 15,
      totalStamps: 30,
      memberSince: '2024-02-20',
      isActive: true,
      lastUsed: '2024-11-28',
      specialInstructions: 'Sugar free options only',
      recentOrders: [
        {
          id: 'ORD002',
          date: '2024-11-28',
          total: 380,
          items: [
            {
              id: 'item-003',
              menuItemId: 'item-003',
              name: 'Latte',
              price: 200,
              quantity: 1,
              modifierIds: {
                variations: ['var-007'],
                addOns: ['addon-006'],
                specialInstructions: 'Almond milk instead of regular'
              }
            },
            {
              id: 'item-013',
              menuItemId: 'item-013',
              name: 'Brownie',
              price: 180,
              quantity: 1,
              modifierIds: {
                variations: [],
                addOns: [],
                specialInstructions: ''
              }
            }
          ],
          status: 'completed',
          stampsEarned: 2,
          stampsRedeemed: 0
        }
      ]
    }
  },
  stampTransactions: {},
  menuItems: {},
  menuItemOptions: {}
};

// Helper functions for accessing mock data
export const getMockData = () => MOCK_DATA;

export const validateMockData = (): boolean => {
  try {
    // Basic validation
    if (!MOCK_DATA.categories || !Array.isArray(MOCK_DATA.categories)) {
      return false;
    }
    
    if (!MOCK_DATA.slots || !Array.isArray(MOCK_DATA.slots)) {
      return false;
    }
    
    // Validate categories and items
    for (const category of MOCK_DATA.categories) {
      if (!category.id || !category.name || !Array.isArray(category.items)) {
        return false;
      }
      
      for (const item of category.items) {
        if (!item.id || !item.name || typeof item.price !== 'number') {
          return false;
        }
        
        // Validate modifiers if they exist
        if (item.modifiers) {
          if (item.modifiers.variations && !Array.isArray(item.modifiers.variations)) {
            return false;
          }
          if (item.modifiers.addOns && !Array.isArray(item.modifiers.addOns)) {
            return false;
          }
          if (item.modifiers.frequentlyBoughtTogether && !Array.isArray(item.modifiers.frequentlyBoughtTogether)) {
            return false;
          }
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Mock data validation failed:', error);
    return false;
  }
};

export const getCategoryByName = (name: string) => {
  return MOCK_DATA.categories.find(cat => cat.name === name);
};

export const getItemById = (itemId: string) => {
  for (const category of MOCK_DATA.categories) {
    const item = category.items.find(item => item.id === itemId);
    if (item) return item;
  }
  return null;
};

export const getAvailableSlotsByType = (orderType: string) => {
  return MOCK_DATA.slots.filter(slot => 
    slot.orderType === orderType && slot.status === 'available'
  );
};

export const getAllMenuItems = () => {
  const allItems: Array<typeof MOCK_DATA.categories[0]['items'][0] & { category: string }> = [];
  MOCK_DATA.categories.forEach(category => {
    category.items.forEach(item => {
      allItems.push({
        ...item,
        category: category.name
          });
        });
      });
  return allItems;
};

export const getItemsByCategory = (categoryName: string) => {
  const category = getCategoryByName(categoryName);
  return category ? category.items : [];
};

export const searchMenuItems = (query: string) => {
  const allItems = getAllMenuItems();
  const searchTerm = query.toLowerCase();
  
  return allItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm) ||
    item.description?.toLowerCase().includes(searchTerm) ||
    item.category.toLowerCase().includes(searchTerm)
  );
};

// Get frequently bought together items for a specific item
export const getFrequentlyBoughtTogether = (itemId: string) => {
  const item = getItemById(itemId);
  if (!item || !item.modifiers?.frequentlyBoughtTogether) {
    return [];
  }
  
  return item.modifiers.frequentlyBoughtTogether
    .map(relatedItemId => getItemById(relatedItemId))
    .filter(Boolean)
    .filter(relatedItem => {
      // Exclude items that have required modifiers
      if (!relatedItem?.modifiers) return true;
      
      const hasRequiredVariations = relatedItem.modifiers.variations?.some(v => v.required) || false;
      const hasRequiredAddOns = relatedItem.modifiers.addOns?.some(a => a.required) || false;
      
      return !hasRequiredVariations && !hasRequiredAddOns;
    });
};

// Get all variations for an item
export const getItemVariations = (itemId: string) => {
  const item = getItemById(itemId);
  return item?.modifiers?.variations || [];
};

// Get all add-ons for an item
export const getItemAddOns = (itemId: string) => {
  const item = getItemById(itemId);
  return item?.modifiers?.addOns || [];
};

// Check if an item has required modifiers
export const hasRequiredModifiers = (itemId: string) => {
  const item = getItemById(itemId);
  if (!item?.modifiers) return false;
  
  const hasRequiredVariations = item.modifiers.variations?.some(v => v.required) || false;
  const hasRequiredAddOns = item.modifiers.addOns?.some(a => a.required) || false;
  
  return hasRequiredVariations || hasRequiredAddOns;
};

// Get featured category (first category for display)
export const getFeaturedCategory = () => {
  return MOCK_DATA.categories[0] || null;
};


