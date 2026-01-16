import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type Currency = 'PKR' | 'USD' | 'EUR' | 'GBP';
export type TileSize = 'small' | 'medium' | 'large';
export type DragMode = 'enabled' | 'disabled';
export type AnimationLevel = 'high' | 'medium' | 'low' | 'off';
export type KitchenSystemMode = 'receipt' | 'kds';

export interface CurrencyConfig {
  symbol: string;
  position: 'before' | 'after';
  decimalPlaces: number;
}

export const CURRENCY_CONFIGS: Record<Currency, CurrencyConfig> = {
  PKR: { symbol: 'Rs.', position: 'before', decimalPlaces: 0 },
  USD: { symbol: '$', position: 'before', decimalPlaces: 2 },
  EUR: { symbol: '€', position: 'before', decimalPlaces: 2 },
  GBP: { symbol: '£', position: 'before', decimalPlaces: 2 },
};

export interface SettingsStore {
  // Currency settings
  currency: Currency;

  // Tile settings
  tiles: {
    size: TileSize;
    dragMode: DragMode;
    showImages: boolean;
    holdDuration: number;
  };

  // Animation settings
  animations: {
    level: AnimationLevel;
    enableTouchFeedback: boolean;
    enableHoverEffects: boolean;
    enableTransitions: boolean;
    enableAnimations: boolean;
    reduceMotion: boolean;
  };

  // Kitchen system settings
  kitchen: {
    mode: KitchenSystemMode;
    autoSendToKitchen: boolean;
    printAdditionalItems: boolean;
  };

  // Order timing settings (in minutes)
  orderTiming: {
    warningThreshold: number; // Yellow
    criticalThreshold: number; // Red
  };

  // Actions
  setCurrency: (currency: Currency) => void;
  formatCurrency: (amount: number) => string;

  // Tile actions
  updateTileSize: (size: TileSize) => void;
  updateDragMode: (mode: DragMode) => void;
  updateShowImages: (show: boolean) => void;
  updateHoldDuration: (duration: number) => void;

  // Animation actions
  updateAnimationLevel: (level: AnimationLevel) => void;
  updateTouchFeedback: (enable: boolean) => void;
  updateHoverEffects: (enable: boolean) => void;
  updateTransitions: (enable: boolean) => void;
  updateAnimations: (enable: boolean) => void;
  updateReduceMotion: (reduce: boolean) => void;

  // Kitchen system actions
  updateKitchenMode: (mode: KitchenSystemMode) => void;
  updateAutoSendToKitchen: (enable: boolean) => void;
  updatePrintAdditionalItems: (enable: boolean) => void;

  // Order timing actions
  updateOrderTiming: (thresholds: { warningThreshold: number; criticalThreshold: number }) => void;

  // Reset to defaults
  resetToDefaults: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currency: 'PKR',

      tiles: {
        size: 'medium',
        dragMode: 'enabled',
        showImages: false,
        holdDuration: 500,
      },

      animations: {
        level: 'medium',
        enableTouchFeedback: true,
        enableHoverEffects: true,
        enableTransitions: true,
        enableAnimations: true,
        reduceMotion: false,
      },

      kitchen: {
        mode: 'receipt',
        autoSendToKitchen: true,
        printAdditionalItems: true,
      },

      orderTiming: {
        warningThreshold: 15,
        criticalThreshold: 40,
      },

      // Actions
      setCurrency: (currency) => {
        set({ currency });
      },

      formatCurrency: (amount) => {
        const { currency } = get();
        const config = CURRENCY_CONFIGS[currency];

        // Ensure amount is a number and handle edge cases
        const numericAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount);

        // For PKR, round to whole number
        const roundedAmount = currency === 'PKR' ? Math.round(numericAmount) : numericAmount;
        const formattedAmount = roundedAmount.toFixed(config.decimalPlaces);

        return config.position === 'before'
          ? `${config.symbol} ${formattedAmount}`
          : `${formattedAmount} ${config.symbol}`;
      },

      // Tile actions
      updateTileSize: (size) => {
        set((state) => ({
          tiles: { ...state.tiles, size }
        }));
      },

      updateDragMode: (mode) => {
        set((state) => ({
          tiles: { ...state.tiles, dragMode: mode }
        }));
      },

      updateShowImages: (show) => {
        set((state) => ({
          tiles: { ...state.tiles, showImages: show }
        }));
      },

      updateHoldDuration: (duration) => {
        set((state) => ({
          tiles: { ...state.tiles, holdDuration: duration }
        }));
      },

      // Animation actions
      updateAnimationLevel: (level) => {
        set((state) => ({
          animations: { ...state.animations, level }
        }));
      },

      updateTouchFeedback: (enable) => {
        set((state) => ({
          animations: { ...state.animations, enableTouchFeedback: enable }
        }));
      },

      updateHoverEffects: (enable) => {
        set((state) => ({
          animations: { ...state.animations, enableHoverEffects: enable }
        }));
      },

      updateTransitions: (enable) => {
        set((state) => ({
          animations: { ...state.animations, enableTransitions: enable }
        }));
      },

      updateAnimations: (enable) => {
        set((state) => ({
          animations: { ...state.animations, enableAnimations: enable }
        }));
      },

      updateReduceMotion: (reduce) => {
        set((state) => ({
          animations: { ...state.animations, reduceMotion: reduce }
        }));
      },

      // Kitchen system actions
      updateKitchenMode: (mode) => {
        set((state) => ({
          kitchen: { ...state.kitchen, mode }
        }));
      },

      updateAutoSendToKitchen: (enable) => {
        set((state) => ({
          kitchen: { ...state.kitchen, autoSendToKitchen: enable }
        }));
      },

      updatePrintAdditionalItems: (enable) => {
        set((state) => ({
          kitchen: { ...state.kitchen, printAdditionalItems: enable }
        }));
      },

      updateOrderTiming: (thresholds) => {
        set((state) => ({
          orderTiming: { ...state.orderTiming, ...thresholds }
        }));
      },

      // Reset to defaults
      resetToDefaults: () => {
        set({
          currency: 'PKR',
          tiles: {
            size: 'medium',
            dragMode: 'enabled',
            showImages: false,
            holdDuration: 500,
          },
          animations: {
            level: 'medium',
            enableTouchFeedback: true,
            enableHoverEffects: true,
            enableTransitions: true,
            enableAnimations: true,
            reduceMotion: false,
          },
          kitchen: {
            mode: 'receipt',
            autoSendToKitchen: true,
            printAdditionalItems: true,
          },
          orderTiming: {
            warningThreshold: 15,
            criticalThreshold: 40,
          },
        });
      },
    }),
    {
      name: 'pos-settings-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
