/**
 * Splash Page
 * 
 * PURPOSE: Main entry point for the splash page that handles routing and loading states.
 * Follows the professional refactoring pattern by separating page wrapper from content logic.
 * 
 * LINKS WITH:
 * - SplashContent: Main content component with all splash logic
 * - useRouter: Next.js navigation
 * 
 * WHY: Follows the same pattern as other pages. Separates routing concerns from business
 * logic, making the code more maintainable and following Next.js best practices.
 */

'use client';

import { SplashContent } from './_components';

export default function SplashPage() {
  return <SplashContent />;
}