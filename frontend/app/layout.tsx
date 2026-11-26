import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SiteNav } from '@/components/SiteNav';
import './globals.css';

export const metadata: Metadata = {
  title: 'Webshop 2025',
  description: 'Nest.js + Next.js demo storefront',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <SiteNav />
          {children}
        </div>
      </body>
    </html>
  );
}
