'use client';

import { useState, useRef, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Camera, QrCode } from 'lucide-react';
import { QRCodeData } from '@/types/pos';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (data: QRCodeData) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ isOpen, onClose, onScan }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
        "qr-reader",
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

      setIsScanning(true);
      setError(null);
    } catch (err) {
      setError('Failed to initialize camera');
      console.error('Scanner initialization error:', err);
    }
  };

  const handleScanSuccess = (decodedText: string) => {
    try {
      // Parse the QR code data
      const qrData: QRCodeData = JSON.parse(decodedText);
      
      // Validate the data structure
      if (!qrData.type || !qrData.data) {
        throw new Error('Invalid QR code format');
      }

      // Stop scanning
      if (scannerRef.current) {
        scannerRef.current.clear();
        scannerRef.current = null;
      }
      setIsScanning(false);

      // Pass the data to parent component
      onScan(qrData);
      onClose();
    } catch (err) {
      setError('Invalid QR code format');
      console.error('QR code parsing error:', err);
    }
  };

  const handleClose = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setIsScanning(false);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Scan QR Code
          </CardTitle>
          <Button
            variant="icon-line"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div
                ref={containerRef}
                id="qr-reader"
                className="w-full max-w-sm"
              />
              
              {!isScanning && (
                <div className="absolute inset-0 flex items-center justify-center bg-card/80 rounded-lg">
                  <div className="text-center">
                    <Camera className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Camera access required
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Position the QR code within the frame to scan
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports loyalty cards and order history
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="line"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (scannerRef.current) {
                  scannerRef.current.clear();
                  scannerRef.current = null;
                }
                initializeScanner();
              }}
              className="flex-1"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QRScanner;
