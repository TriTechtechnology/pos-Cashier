/**
 * Overlay Mode Store
 * 
 * PURPOSE: Global state management for overlay modes across the application.
 * Tracks when confirmation/payment overlays are active to control header behavior.
 * 
 * LINKS WITH:
 * - Header: Uses this to determine if it should be blurred/disabled
 * - MenuPageContent: Updates this when overlay mode changes
 * - CartOverlay: Updates this when switching between cart and confirmation modes
 * 
 * WHY: Centralized state ensures consistent header behavior across all pages
 * when overlays are active.
 */

import { create } from 'zustand';

interface OverlayModeState {
  isConfirmationMode: boolean;
  setConfirmationMode: (isActive: boolean) => void;
}

export const useOverlayModeStore = create<OverlayModeState>((set) => ({
  isConfirmationMode: false,
  setConfirmationMode: (isActive: boolean) => set({ isConfirmationMode: isActive }),
}));
