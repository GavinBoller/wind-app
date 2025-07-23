import "./globals.css"; // Same directory
import { Inter } from 'next/font/google';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Wind sniff',
  description: 'Track wind direction and speed at your favorite stations.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Wind sniff',
  },
  icons: {
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#1a2a44',
};

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

import { SpeedInsights } from "@vercel/speed-insights/next";
import Providers from "./providers";
import { SettingsProvider } from "@/context/SettingsContext";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen">
        <SettingsProvider>
          <Providers>{children}</Providers>
        </SettingsProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}