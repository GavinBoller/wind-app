import "./globals.css"; // Same directory
export const metadata = {
  title: 'Wind App',
  description: 'Track wind direction and speed at your favorite stations.',
};

import Providers from "./providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}