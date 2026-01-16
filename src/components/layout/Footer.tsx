'use client';

import React from 'react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

interface FooterProps {
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  return (
    <div className={`flex-shrink-0 w-full z-30 ${className}`}>
      <footer className="flex items-center justify-between px-4 py-2 bg-background border-t border-border">
        {/* Left Section - Logo and Branding */}
        <div className="flex items-center gap-1">
          <OptimizedImage 
            src="/Logo/d1ab35.svg" 
            alt="Logo" 
            className="w-3 h-3"
            width={12}
            height={12}
          />
          <span className="text-xs text-text-muted">
            Powered by Tri Tech Technology
          </span>
        </div>
        
        {/* Right Section - Status */}
        <div className="text-xs text-text-muted">
          <span>Online</span>
        </div>
      </footer>
    </div>
  );
};
