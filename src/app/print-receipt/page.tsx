'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function PrintReceiptPage() {
  const searchParams = useSearchParams();
  const [receiptContent, setReceiptContent] = useState<string>('');

  useEffect(() => {
    // Get receipt key from URL parameters
    const receiptKey = searchParams.get('key');

    if (receiptKey) {
      // Retrieve receipt content from sessionStorage
      const content = sessionStorage.getItem(receiptKey);

      if (content) {
        setReceiptContent(content);

        // Clean up sessionStorage after retrieving (optional)
        // sessionStorage.removeItem(receiptKey);

        // Auto-trigger print dialog after content loads
        setTimeout(() => {
          window.print();
        }, 500);
      } else {
        console.error('Receipt content not found in sessionStorage for key:', receiptKey);
      }
    }
  }, [searchParams]);

  if (!receiptContent) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Loading receipt...</p>
      </div>
    );
  }

  return (
    <>
      {/* Print-specific styles */}
      <style jsx global>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none;
          }
          @page {
            size: 80mm auto;
            margin: 0;
          }
        }

        body {
          font-family: 'Courier New', 'Courier', monospace;
          font-size: 12px;
          line-height: 1.3;
          margin: 0;
          padding: 20px;
          background-color: white;
          color: black;
        }

        .receipt-container {
          max-width: 320px;
          margin: 0 auto;
          white-space: pre;
          overflow-x: auto;
          font-family: 'Courier New', 'Courier', monospace;
          letter-spacing: 0;
        }

        .print-controls {
          position: fixed;
          top: 20px;
          right: 20px;
          display: flex;
          gap: 10px;
          z-index: 1000;
        }

        .btn {
          padding: 10px 20px;
          border: 1px solid #ccc;
          border-radius: 5px;
          background-color: white;
          cursor: pointer;
          font-size: 14px;
        }

        .btn:hover {
          background-color: #f0f0f0;
        }

        .btn-primary {
          background-color: #007bff;
          color: white;
          border-color: #007bff;
        }

        .btn-primary:hover {
          background-color: #0056b3;
        }
      `}</style>

      {/* Print controls (hidden when printing) */}
      <div className="print-controls no-print">
        <button
          className="btn btn-primary"
          onClick={() => window.print()}
        >
          🖨️ Print Again
        </button>
        <button
          className="btn"
          onClick={() => window.close()}
        >
          ✕ Close
        </button>
      </div>

      {/* Receipt content */}
      <div className="receipt-container">
        {receiptContent}
      </div>
    </>
  );
}
