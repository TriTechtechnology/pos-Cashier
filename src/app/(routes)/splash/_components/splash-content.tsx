/**
 * SplashContent Component
 * 
 * PURPOSE: Main content component for the splash page that handles logo animation
 * and automatic navigation to key-login page. Separated from page wrapper for better
 * organization following the professional refactoring pattern.
 * 
 * LINKS WITH:
 * - useRouter: Next.js navigation
 * - OptimizedImage: UI component for logo display
 * 
 * WHY: Follows the same pattern as other pages. Separates business logic
 * from page routing, making the code more maintainable and testable.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

export const SplashContent = () => {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Start animation after component mounts
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    // Navigate to key login after 3 seconds
    const navigationTimer = setTimeout(() => {
      router.push('/key-login');
    }, 3000);

    return () => {
      clearTimeout(timer);
      clearTimeout(navigationTimer);
    };
  }, [router]);

  return (
    <div className="h-full w-full bg-background flex items-center justify-center">
      <div 
        className={`transition-all duration-1000 ease-out ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
        }`}
      >
        <OptimizedImage 
          src="/Logo/d1ab35.svg" 
          alt="TTT Logo" 
          className="w-96 h-96 animate-pulse"
          width={384}
          height={384}
        />
      </div>
    </div>
  );
};
