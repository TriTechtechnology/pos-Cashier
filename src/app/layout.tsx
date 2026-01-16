import type { Metadata, Viewport } from "next";
// Disabled Google Fonts for offline-first PWA - using system fonts instead
// import { Inter } from "next/font/google";
import "./globals.css";
import { ClientProvider } from "@/components/providers/ClientProvider";
import { ThemeProvider } from "@/components/providers/theme-provider";

// const inter = Inter({ subsets: ["latin"] });

// Force dynamic rendering to fix Next.js 15 + PWA build issue
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export const metadata: Metadata = {
  title: "TTT-POS Cashier",
  description: "Point of Sale system for restaurant cashiers",
  manifest: "/manifest.json",
  applicationName: "TTT-POS Cashier",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TTT-POS Cashier",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
      { url: "/icons/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "hsl(var(--primary))",
    "msapplication-tap-highlight": "no",
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "hsl(var(--background))",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Allerta+Stencil&display=swap" rel="stylesheet" />

      </head>
      <body suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ClientProvider>
            {children}
          </ClientProvider>
        </ThemeProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
