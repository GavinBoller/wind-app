import "./globals.css"; // Same directory
import { Inter } from 'next/font/google';

export const metadata = {
  title: 'Wind App',
  description: 'Track wind direction and speed at your favorite stations.',
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