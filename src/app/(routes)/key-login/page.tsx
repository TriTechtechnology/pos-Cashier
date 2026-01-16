/**
 * Key-Login Page
 * 
 * PURPOSE: Main entry point for the key-login page that handles routing and loading states.
 * Follows the professional refactoring pattern by separating page wrapper from content logic.
 * 
 * LINKS WITH:
 * - KeyLoginContent: Main content component with all key-login logic
 * - useRouter: Next.js navigation
 * 
 * WHY: Follows the same pattern as other pages. Separates routing concerns from business
 * logic, making the code more maintainable and following Next.js best practices.
 */

'use client';

import { KeyLoginContent } from './_components';

export default function KeyLoginPage() {
  return <KeyLoginContent />;
}
