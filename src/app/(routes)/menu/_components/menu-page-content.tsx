/**
 * MenuPageContent Component
 * 
 * PURPOSE: Main content component for the menu page that handles all menu interactions,
 * cart management, and overlay states. Separated from the page wrapper for better
 * organization and following the professional refactoring pattern.
 * 
 * LINKS WITH:
 * - useMenuManagement: Custom hook that provides all state and handlers
 * - CategoryButton: Category navigation component
 * - DraggableMenuItem: Individual menu item display
 * - ItemModifier: Item customization overlay
 * - CartOverlay: Shopping cart management
 * - PaymentOverlay: Payment processing
 * - SlotSelector: Slot selection modal
 * 
 * WHY: Follows the same pattern as HomePageContent. Separates business logic
 * from page routing, making the code more maintainable and testable.
 */

import React, { useState, useEffect } from 'react';
import { useMenuManagement } from '@/lib/hooks/useMenuManagement';
import { useOrderOverlayStore } from '@/lib/store/order-overlay';
import { MenuHeader } from './menu-header';
import { DraggableMenuItem } from './menu-item';
import { MenuGrid } from './menu-item/MenuGrid';
import { ItemModifier } from './item-modifier';
import { CartOverlay } from './cart-overlay';
import { PaymentOverlay } from './payment-overlay';
import { SlotSelector } from './slot-selector';

// Menu item card settings - should match MenuItemCard CARD_SETTINGS
const CARD_WIDTH = 280;

export const MenuPageContent = () => {
  console.log('🔥 [MENU PAGE] MenuPageContent component rendering...');

  // State for menu items fade transition
  const [itemsVisible, setItemsVisible] = useState(true);
  const [previousCartState, setPreviousCartState] = useState(false);
  const [isCashierMode, setIsCashierMode] = useState(true);
  // Tax rate from payment overlay (Cash: 16%, Card: 5%, Split: 16%)
  const [paymentTaxRate, setPaymentTaxRate] = useState(16);

  // Use the custom hook for all menu management
  const {
    // State
    searchQuery,
    slotId,
    currentSlotInfo,
    selectedIndex,
    selectedItem,
    isModifierOpen,
    isEditing,
    editingItemId,
    savedSelections,
    isCartOpen,
    isSlotSelectorOpen,
    overlayMode,
    categories,
    selectedCategory,
    cartItems,
    displayItems,
    itemPreferences,
    orderType,
    isPaidOrderEditMode,

    // Actions
    handleCategoryChange,
    handleSearchChange,
    handleAddToCart,
    handleSlotSelected,
    handleModifierAddToCart,
    handleCartClick,
    handleOverlayModeChange,
    handleCancelOrder,
    handleDraftOrder,
    handleSelect,
    handleSwap,
    handleEditItem,
    handleOrderComplete,
    handleDeleteCustomItem,

    // Menu store actions
    toggleItemAvailability,
    toggleItemImage,
    saveItemPreferences,

    // Utility
    updateState
  } = useMenuManagement();

  // 🧹 CLEANUP: Remove legacy 8-digit order IDs on app start
  useEffect(() => {
    const cleanupLegacyData = async () => {
      try {
        console.log('🧹 [APP STARTUP] Starting legacy order cleanup...');
        await useOrderOverlayStore.getState().clearLegacyOrders();
        console.log('✅ [APP STARTUP] Legacy cleanup completed');
      } catch (error) {
        console.error('❌ [APP STARTUP] Legacy cleanup failed:', error);
      }
    };

    cleanupLegacyData();
  }, []); // Run once on mount

  // Handle fade transition when cart opens/closes
  useEffect(() => {
    let fadeInTimer: NodeJS.Timeout | undefined;

    // Cart state is about to change - hide immediately
    if (isCartOpen !== previousCartState) {
      // Hide items IMMEDIATELY when cart state changes
      setItemsVisible(false);

      // Show items after transition completes
      fadeInTimer = setTimeout(() => {
        setItemsVisible(true);
      }, 550); // Wait for width transition (500ms) + buffer
    }

    // Update previous state
    setPreviousCartState(isCartOpen);

    return () => {
      if (fadeInTimer) {
        clearTimeout(fadeInTimer);
      }
    };
  }, [isCartOpen, previousCartState]);

  // Fail-safe: Always ensure items are visible after a reasonable time
  useEffect(() => {
    if (!itemsVisible) {
      const failSafeTimer = setTimeout(() => {
        setItemsVisible(true);
      }, 500);

      return () => clearTimeout(failSafeTimer);
    }
    return undefined;
  }, [itemsVisible]);

  return (
    <div
      className="h-full bg-background flex flex-col overflow-hidden scrollbar-hide"
      style={{
        width: isCartOpen ? '66.666667%' : '100%',
        transition: 'width 600ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        willChange: 'width'
      }}
    >

      {/* Menu Header */}
      <MenuHeader
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        slotId={slotId}
        currentSlotInfo={currentSlotInfo}
        isCartOpen={isCartOpen}
        onSlotSelectorOpen={() => updateState({ isSlotSelectorOpen: true })}
        isPaidOrderEditMode={isPaidOrderEditMode}
        cartItems={cartItems}
        onCartClick={handleCartClick}
        isCashierMode={isCashierMode}
        onToggleMode={() => setIsCashierMode(!isCashierMode)}
      />

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
        {/* Scrollable Menu Items Grid */}
        <div className="px-5 py-3" onClick={() => handleSelect(-1)}>
          <div className="w-full flex justify-center">
            {isCashierMode ? (
              <div className="w-full">
                <MenuGrid
                  items={displayItems}
                  onItemClick={(item) => {
                    // Always handle via addToCart which opens the modifier modal
                    // This fixes the issue where items with modifiers were only being 'selected' but not opened
                    handleAddToCart(item);
                  }}
                  onToggleAvailability={toggleItemAvailability}
                  onToggleImage={toggleItemImage}
                  onDeleteCustomItem={handleDeleteCustomItem}
                  isCashierMode={true}
                  showImages={false}
                  onSwap={handleSwap}
                  isCartOpen={isCartOpen}
                  searchQuery={searchQuery}
                />
              </div>
            ) : (
              <div
                className="grid gap-4"
                style={{
                  display: itemsVisible ? 'grid' : 'none',
                  gridTemplateColumns: `repeat(auto-fill, ${CARD_WIDTH}px)`,
                  justifyContent: 'center',
                  width: 'fit-content',
                  maxWidth: '100%',
                  margin: '0 auto'
                }}
              >
                {displayItems.map((item, index) => (
                  <DraggableMenuItem
                    key={item.id}
                    item={item}
                    index={index}
                    isSelected={selectedIndex === index}
                    selectedIndex={selectedIndex}
                    onSelect={handleSelect}
                    onSwap={handleSwap}
                    onToggleAvailability={(itemId) => {
                      toggleItemAvailability(itemId);
                      const prefs = itemPreferences[itemId] || { showImage: false, available: true };
                      saveItemPreferences(itemId, { available: !prefs.available });
                    }}
                    onToggleImage={(itemId) => {
                      toggleItemImage(itemId);
                      const prefs = itemPreferences[itemId] || { showImage: false, available: true };
                      saveItemPreferences(itemId, { showImage: !prefs.showImage });
                    }}
                    onDeleteCustomItem={handleDeleteCustomItem}
                    onClick={handleAddToCart}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Item Modifier Overlay */}
        {selectedItem && (
          <ItemModifier
            item={selectedItem}
            isOpen={isModifierOpen}
            onClose={() => {
              updateState({
                isModifierOpen: false,
                selectedItem: null,
                isEditing: false,
                editingItemId: '',
                savedSelections: null
              });
            }}
            onAddToCart={handleModifierAddToCart}
            isCartOpen={isCartOpen}
            isEditing={isEditing}
            editingItemId={editingItemId}
            savedSelections={savedSelections || undefined}
          />
        )}

        {/* Slot Selector */}
        <SlotSelector
          isOpen={isSlotSelectorOpen}
          onClose={() => updateState({ isSlotSelectorOpen: false })}
          onSlotSelected={handleSlotSelected}
        />

        {/* Cart Overlay - Always visible when cart is open, position changes based on mode */}
        <CartOverlay
          isOpen={isCartOpen}
          onClose={() => {
            console.log('🛒 CartOverlay onClose called');
            updateState({ isCartOpen: false, overlayMode: 'cart' });
          }}
          slotId={slotId}
          orderType={orderType as 'dine-in' | 'take-away' | 'delivery' | null}
          mode={overlayMode}
          onModeChange={handleOverlayModeChange}
          onEditItem={handleEditItem}
          onCancelOrder={handleCancelOrder}
          onDraftOrder={handleDraftOrder}
          taxRate={paymentTaxRate} // Dynamic tax rate from payment method selection
        // onUndoLastAction removed - replaced by Clear Cart button in bulletproof implementation
        />

        {/* Payment Overlay - Always rendered, slides in from right */}
        <PaymentOverlay
          isOpen={overlayMode === 'confirmation'}
          onClose={() => {
            updateState({ overlayMode: 'cart' });
          }}
          slotId={slotId}
          orderType={orderType as 'dine-in' | 'take-away' | 'delivery' | null}
          onOrderComplete={() => {
            console.log('🏁 [MENU] Order complete callback - slotId:', slotId);
            handleOrderComplete();
          }}
          onTaxRateChange={setPaymentTaxRate} // Update tax rate when payment method changes
        />
      </div>
    </div>
  );
};
