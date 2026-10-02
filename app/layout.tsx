import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Oga at the Top',
  description: 'A satirical Nigerian presidency simulator. Governing well and surviving long enough for it to work are two different problems.',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#16181a' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
