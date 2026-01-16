import { useState, useEffect } from 'react';

interface UseSlideOverlayProps {
  isOpen: boolean;
  animationDuration?: number;
  onClose?: () => void;
  isCartOpen?: boolean;
}

interface UseSlideOverlayReturn {
  isMounted: boolean;
  isVisible: boolean;
  isClosing: boolean;
  handleClose: () => void;
  overlayProps: {
    className: string;
    onClick: (e: React.MouseEvent) => void;
  };
  contentProps: {
    className: string;
    style?: React.CSSProperties;
    onClick: (e: React.MouseEvent) => void;
  };
}

export const useSlideOverlay = ({
  isOpen,
  animationDuration = 300, // Faster fade animation
  onClose,
  isCartOpen = false
}: UseSlideOverlayProps): UseSlideOverlayReturn => {
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Handle overlay mounting and animation - optimized for smooth performance
  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      setIsClosing(false);
      // Single RAF for smooth animation start
      const rafId = requestAnimationFrame(() => {
        setIsVisible(true);
      });
      return () => cancelAnimationFrame(rafId);
    } else {
      setIsVisible(false);
      setIsClosing(false);
      // Consistent timing for exit animation
      const timer = setTimeout(() => {
        setIsMounted(false);
      }, animationDuration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, animationDuration]);

  const handleClose = () => {
    if (isClosing) return; // Prevent multiple close attempts
    setIsClosing(true);
    setIsVisible(false);
    // Consistent timing with no buffer for smoother transition
    setTimeout(() => {
      onClose?.();
    }, animationDuration);
  };

  const overlayProps = {
    className: `fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300 ease-out ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`,
    onClick: () => handleClose()
  };

  const contentProps = {
    className: `bg-secondary rounded-[42px] w-full max-w-md flex flex-col overflow-hidden touch-pan-y transition-all duration-300 ease-out`,
    style: {
      position: 'fixed' as const,
      top: '80px',
      bottom: '30px',
      left: isCartOpen ? '34%' : '50%',
      transform: (isVisible && !isClosing)
        ? 'translate(-50%, 0)' // Fully visible - centered
        : 'translate(-50%, 20px)', // Hidden - slightly below (subtle slide up)
      opacity: (isVisible && !isClosing) ? 1 : 0, // Fade in/out
      willChange: 'opacity, transform', // Optimize for fade + slide animations
      backfaceVisibility: 'hidden' as const, // Prevent flickering
      pointerEvents: (isVisible && !isClosing) ? 'auto' as const : 'none' as const // Disable interaction when faded out
    } as React.CSSProperties,
    onClick: (e: React.MouseEvent) => e.stopPropagation()
  };

  return {
    isMounted,
    isVisible,
    isClosing,
    handleClose,
    overlayProps,
    contentProps
  };
};
