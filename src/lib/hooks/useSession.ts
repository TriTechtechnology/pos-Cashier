import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface SessionData {
  isLoggedIn: boolean;
  clockInTime?: string;
  openingBalance?: number;
  note?: string | null;
}

export const useSession = () => {
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Only run on client side after mounting
    if (isMounted && typeof window !== 'undefined') {
      const sessionData = localStorage.getItem('pos-session');
      
      if (sessionData) {
        try {
          const parsed = JSON.parse(sessionData);
          setSession(parsed);
        } catch (error) {
          console.error('Invalid session data:', error);
          setSession(null);
        }
      } else {
        setSession(null);
      }
      
      setIsLoading(false);
    }
  }, [isMounted]);

  const login = (sessionData: Omit<SessionData, 'isLoggedIn'>) => {
    const newSession = { ...sessionData, isLoggedIn: true };
    localStorage.setItem('pos-session', JSON.stringify(newSession));
    setSession(newSession);
  };

  const logout = () => {
    localStorage.removeItem('pos-session');
    localStorage.removeItem('pos-cart-storage');
    localStorage.removeItem('pos-drafts-storage');
    setSession(null);
    router.push('/login');
  };

  const requireAuth = () => {
    if (isMounted && !isLoading && (!session || !session.isLoggedIn)) {
      router.push('/login');
      return false;
    }
    return true;
  };

  return {
    session,
    isLoading: isLoading || !isMounted,
    login,
    logout,
    requireAuth
  };
};
