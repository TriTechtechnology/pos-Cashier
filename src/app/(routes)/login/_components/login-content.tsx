/**
 * LoginContent Component - Landscape POS Login
 *
 * DESIGN: Matches TillModal aesthetic
 * - Split screen: Branding left, form right
 * - Landscape orientation (tablet optimized)
 * - No scrolling - everything fits
 * - Consistent with app design language
 *
 * FEATURES:
 * - Employee ID input field (e.g., "EMP-A7K3M2")
 * - Role selection dropdown
 * - 6-digit PIN with visual feedback
 * - Auto-login on PIN completion
 * - Touch-optimized
 * - Terminal ID comes from backend based on Employee ID and PIN
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, ChevronDown, Badge } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { useAuthStore } from '@/lib/store/auth';
import { useNavigationStore } from '@/lib/store/navigation';
import { Keypad } from '@/components/ui/Keypad';

type Role = 'cashier' | 'manager' | 'waiter';

export const LoginContent = () => {
  const router = useRouter();
  const loginWithPin = useAuthStore(state => state.loginWithPin);
  const isLoading = useAuthStore(state => state.isLoading);
  const clearError = useAuthStore(state => state.clearError);
  const navigateToHome = useNavigationStore(state => state.navigateToHome);

  const [employeeId, setEmployeeId] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('cashier');
  const [pin, setPin] = useState('');
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [pinError, setPinError] = useState(false);

  const roles: { value: Role; label: string }[] = [
    { value: 'cashier', label: 'Cashier' },
    { value: 'manager', label: 'Manager' },
    { value: 'waiter', label: 'Waiter' },
  ];

  const selectedRoleData = roles.find(role => role.value === selectedRole);

  const handlePinInput = (digit: string) => {
    // Ignore decimal point for PIN input
    if (digit === '.') return;

    if (pin.length < 6) {
      const newPin = pin + digit;
      setPin(newPin);

      // Auto-submit when PIN is complete
      if (newPin.length === 6) {
        setTimeout(() => handleLogin(newPin), 100);
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
  };

  const handleLogin = async (pinToUse?: string) => {
    const currentPin = pinToUse || pin;
    if (currentPin.length !== 6 || !employeeId.trim()) return;

    console.log('🔐 [LOGIN] Attempting login...', { employeeId });
    clearError();
    setPinError(false);

    await loginWithPin(employeeId.trim().toUpperCase(), currentPin, selectedRole);

    const currentError = useAuthStore.getState().error;
    if (!currentError) {
      console.log('✅ [LOGIN] Login successful, redirecting to home...');
      // Reset navigation to home page (SPA state)
      navigateToHome();
      router.push('/');
    } else {
      console.error('❌ [LOGIN] Login failed:', currentError);
      // Show red dots and reset after animation
      setPinError(true);
      setTimeout(() => {
        setPin('');
        setPinError(false);
      }, 600);
    }
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden">
      {/* LEFT SIDE - Branding */}
      <div className="w-1/2 bg-background flex items-center justify-center p-12 relative overflow-hidden">
        {/* Logo - Full screen size, 50% visible on left */}
        <div className="absolute left-0 -translate-x-1/2">
          <OptimizedImage
            src="/Logo/d1ab35.svg"
            alt="Logo"
            className="h-screen w-auto opacity-50"
            width={1080}
            height={1080}
          />
        </div>

        {/* Client Name - Right side with Allerta Stencil font */}
        <div className="relative z-10 ml-auto mr-12">
          <h1 className="text-5xl text-text-primary" style={{ fontFamily: "'Allerta Stencil', sans-serif" }}>
            TTT POS
          </h1>
        </div>
      </div>

      {/* RIGHT SIDE - Login Form */}
      <div className="w-1/2 bg-background flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-card rounded-2xl shadow-xl border border-border p-6">
          {/* Header */}
          <div className="mb-6 text-center">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
              Welcome Back
            </h2>
            <h1 className="text-2xl font-bold text-text-primary">
              Sign in to continue
            </h1>
          </div>

          {/* Employee ID Input */}
          <div className="mb-5">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
              Employee ID
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary">
                <Badge className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                placeholder="EMP-A7K3M2"
                className="w-full pl-10 pr-3 py-2.5 bg-background border border-border rounded-lg focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all text-sm font-medium text-text-primary placeholder:text-muted-foreground/50 uppercase"
                maxLength={20}
              />
            </div>
          </div>

          {/* Role Selection */}
          <div className="mb-5">
            <div className="relative">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                Role
              </label>
              <button
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-background border border-border rounded-lg hover:border-primary hover:bg-muted transition-all text-sm"
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  <span className="font-medium text-text-primary">{selectedRoleData?.label}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showRoleDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showRoleDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowRoleDropdown(false)} />
                  <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-xl z-20 overflow-hidden">
                    {roles.map((role) => (
                      <button
                        key={role.value}
                        onClick={() => {
                          setSelectedRole(role.value);
                          setShowRoleDropdown(false);
                          setPin('');
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-muted transition-colors text-sm ${
                          selectedRole === role.value ? 'bg-primary/10' : ''
                        }`}
                      >
                        <User className={`w-4 h-4 ${selectedRole === role.value ? 'text-primary' : 'text-text-secondary'}`} />
                        <span className={`font-medium ${selectedRole === role.value ? 'text-primary' : 'text-text-primary'}`}>
                          {role.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* PIN Section */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide text-center">
              Enter PIN
            </label>

            {/* PIN Dots */}
            <div className={`flex justify-center gap-3 mb-4 transition-all duration-200 ${pinError ? 'animate-shake' : ''}`}>
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <div
                  key={index}
                  className={`w-4 h-4 rounded-full transition-all duration-200 ${
                    pinError
                      ? 'bg-red-500 scale-110 shadow-lg shadow-red-500/50'
                      : index < pin.length
                      ? 'bg-primary scale-110 shadow-lg shadow-primary/50'
                      : 'bg-accent/40'
                  }`}
                />
              ))}
            </div>

            {/* PIN Pad - Using shared Keypad component */}
            <div className="max-w-[280px] mx-auto">
              <Keypad
                onInput={handlePinInput}
                onClear={handleClear}
                onBackspace={handleBackspace}
                showDecimal={false}
              />
            </div>
          </div>

          {/* Loading State - Fixed height to prevent layout shift */}
          <div className="flex items-center justify-center gap-2 py-2 h-8">
            {isLoading && (
              <>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
