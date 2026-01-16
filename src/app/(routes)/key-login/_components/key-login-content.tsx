/**
 * KeyLoginContent Component
 * 
 * PURPOSE: Main content component for the key-login page that handles key input,
 * validation, and navigation to login page. Separated from page wrapper for better
 * organization following the professional refactoring pattern.
 * 
 * LINKS WITH:
 * - useRouter: Next.js navigation
 * - OptimizedImage: Image component for logo display
 * 
 * WHY: Follows the same pattern as other pages. Separates business logic
 * from page routing, making the code more maintainable and testable.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

export const KeyLoginContent = () => {
  const router = useRouter();
  const [key, setKey] = useState('');

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow alphanumeric characters and limit to 16 characters
    const sanitizedValue = value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
    setKey(sanitizedValue);
  };

  const handleClearKey = () => {
    setKey('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.length >= 8) {
      // Test key validation - accept any key 8+ characters or specific test keys
      const validKeys = ['TEST123456', 'DEMO123456', 'POS2024', 'TTT2024'];
      if (validKeys.includes(key.toUpperCase()) || key.length >= 8) {
        console.log('Key submitted:', key);
        router.push('/login');
      } else {
        alert('Invalid key. Please try again or use: TEST123456, DEMO123456, POS2024, or TTT2024');
      }
    } else {
      alert('Key must be at least 8 characters long');
    }
  };

  return (
    <div className="h-screen w-screen bg-background flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Logo */}
        <div className="mb-16">
          <OptimizedImage 
            src="/Logo/d1ab35.svg" 
            alt="TTT Logo" 
            className="w-24 h-24"
            width={96}
            height={96}
          />
        </div>

        {/* Title */}
        <h1 className="text-4xl font-normal text-text-primary mb-4">
          INPUT KEY
        </h1>

        {/* Subtitle */}
        <p className="text-base text-text-secondary text-center mb-8">
          please visit pos.com to get your key
        </p>

        {/* Key Input Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-md">
          <div className="relative">
            <input
              type="text"
              value={key}
              onChange={handleKeyChange}
              placeholder="xxxx"
              className="w-full px-4 py-3 bg-card text-text-primary rounded-full border border-border focus:outline-none focus:ring-2 focus:ring-primary text-center text-lg font-mono tracking-widest"
              maxLength={16}
            />
            {key && (
              <button
                type="button"
                onClick={handleClearKey}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
