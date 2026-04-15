'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/' },
  { name: 'Clients', href: '/clients' },
  { name: 'Queue', href: '/queue' },
  { name: 'Drafts', href: '/drafts' },
  { name: 'Settings', href: '/settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Close menu on route change
  useEffect(() => setIsOpen(false), [pathname]);

  // Prevent body scroll when menu open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
  }, [isOpen]);

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b px-4 py-3 flex items-center justify-between">
        <button onClick={() => setIsOpen(true)} className="p-2 -ml-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="font-bold text-lg">Local SEO OS</h1>
        <div className="w-10" /> {/* Spacer for balance */}
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-white">
          <div className="p-4 flex justify-between items-center border-b">
            <h1 className="font-bold text-lg">Menu</h1>
            <button onClick={() => setIsOpen(false)} className="p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="p-4 space-y-2">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href}
                className={`block px-4 py-3 rounded-lg text-lg ${pathname === item.href ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700'}`}>
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* Desktop Sidebar - Fixed left */}
      <div className="hidden lg:flex w-64 flex-col h-screen fixed left-0 top-0 bg-card border-r z-30">
        <div className="border-b p-4">
          <h1 className="text-xl font-bold">Local SEO OS</h1>
        </div>
        <nav className="flex-1 space-y-1 p-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link key={item.name} href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}>
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-4">
          <p className="text-xs text-muted-foreground">v1.0.0</p>
        </div>
      </div>

      {/* Desktop content margin */}
      <div className="hidden lg:block w-64" />
    </>
  );
}