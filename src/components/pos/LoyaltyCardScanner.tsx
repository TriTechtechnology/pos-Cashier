'use client';

import { useState, useRef, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Camera, Gift } from 'lucide-react';
import { LoyaltyAPI, LoyaltyCard } from '@/lib/api/loyalty';

interface LoyaltyCardScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onCardFound: (loyaltyCard: LoyaltyCard) => void;
}

const LoyaltyCardScanner: React.FC<LoyaltyCardScannerProps> = ({ 
  isOpen, 
  onClose, 
  onCardFound 
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !scannerRef.current) {
      initializeScanner();
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    };
  }, [isOpen]);

  const initializeScanner = () => {
    if (!containerRef.current) return;

    try {
      scannerRef.current = new Html5QrcodeScanner(
        "loyalty-qr-reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        false
      );

      scannerRef.current.render(
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        (errorMessage) => {
          // Ignore scanning errors, they're normal during scanning
          console.log('Scanning error:', errorMessage);
        }
      );

      setError(null);
    } catch (err) {
      setError('Failed to initialize camera');
      console.error('Scanner initialization error:', err);
    }
  };

  const handleScanSuccess = async (decodedText: string) => {
    try {
      setIsProcessing(true);
      setError(null);

      // Stop scanning
      if (scannerRef.current) {
        scannerRef.current.clear();
        scannerRef.current = null;
      }

      // Parse QR code and get loyalty card
      const response = await LoyaltyAPI.getLoyaltyCard(decodedText);
      
      if (response.success && response.data) {
        // Pass the loyalty card data to parent component
        onCardFound(response.data);
        onClose();
      } else {
        setError('Invalid loyalty card or card not found');
        // Restart scanner for another attempt
        setTimeout(() => {
          initializeScanner();
        }, 2000);
      }
    } catch (err) {
      setError('Failed to process loyalty card');
      console.error('Loyalty card processing error:', err);
      // Restart scanner for another attempt
      setTimeout(() => {
        initializeScanner();
      }, 2000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setError(null);
    setIsProcessing(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Scan Loyalty Card
          </CardTitle>
          <Button
            variant="icon-line"
            size="sm"
            onClick={handleClose}
            disabled={isProcessing}
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {isProcessing && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-blue-600 text-sm">Processing loyalty card...</p>
            </div>
          )}

          {!isProcessing && (
            <div className="space-y-4">
              <div className="text-center">
                <Camera className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-4">
                  Position the loyalty card QR code within the scanner
                </p>
              </div>

              <div 
                ref={containerRef}
                id="loyalty-qr-reader"
                className="w-full"
              />

              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  The scanner will automatically detect and process your loyalty card
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoyaltyCardScanner;
