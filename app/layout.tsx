import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';

export const metadata: Metadata = {
  title: 'SEO OS - Impact Marketing',
  description: 'Internal Local SEO Content Operating System',
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-app antialiased">
        <Sidebar />
        <main className="pt-14 lg:pt-0 lg:ml-64 min-h-screen">{children}</main>
      </body>
    </html>
  );
}
