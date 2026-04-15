'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, type ReactNode } from 'react';
import { useAppSettings } from '@/lib/settings-context';

const navItems = [
  { name: 'Dashboard', href: '/', icon: 'home' },
  { name: 'Clients', href: '/clients', icon: 'building' },
  { name: 'Queue', href: '/queue', icon: 'layers' },
  { name: 'Drafts', href: '/drafts', icon: 'file-edit' },
];

const systemItems = [
  { name: 'Settings', href: '/settings', icon: 'settings' },
];

function Icon({ name, className }: { name: string; className?: string }) {
  const icons: Record<string, ReactNode> = {
    home: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
    building: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />,
    layers: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />,
    'file-edit': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />,
    settings: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></>,
    plus: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />,
  };
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      {icons[name]}
    </svg>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { settings, loading } = useAppSettings();

  const logoUrl = settings?.branding?.logo_url;
  const appName = settings?.branding?.app_name || 'SEO OS';
  const agencyName = 'Impact Marketing';

  useEffect(() => setIsOpen(false), [pathname]);
  useEffect(() => { if (isOpen) document.body.style.overflow = 'hidden'; else document.body.style.overflow = 'unset'; }, [isOpen]);

  const LogoImage = () => {
    if (loading) {
      return <div className="w-8 h-8 rounded-lg bg-input animate-pulse" />;
    }
    if (logoUrl) {
      return <img src={logoUrl} alt="Logo" className="w-8 h-8 rounded-lg object-cover" />;
    }
    return (
      <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-sidebar border-b border-border px-4 py-3 flex items-center justify-between">
        <button onClick={() => setIsOpen(true)} className="p-2 -ml-2">
          <svg className="w-6 h-6 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <img src="/favicon.svg" alt="Logo" className="w-7 h-7 rounded-md" />
          <h1 className="font-bold text-lg text-text-primary tracking-tight">SEO OS</h1>
        </div>
        <div className="w-10" />
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-sidebar">
          <div className="p-4 flex justify-between items-center border-b border-border">
            <div className="flex items-center gap-2">
              <LogoImage />
              <div>
                <h1 className="font-bold text-lg text-text-primary tracking-tight">{appName}</h1>
                <p className="text-xs text-text-tertiary">{agencyName}</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2">
              <svg className="w-6 h-6 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-4">
            <p className="text-xs text-text-tertiary uppercase font-semibold mb-2 tracking-wider">Workspace</p>
            <nav className="space-y-1 mb-6">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <Link key={item.name} href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                      isActive 
                        ? 'bg-accent/10 text-text-primary font-medium' 
                        : 'text-text-tertiary hover:bg-elevated hover:text-text-secondary'
                    }`}>
                    <Icon name={item.icon} className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <p className="text-xs text-text-tertiary uppercase font-semibold mb-2 tracking-wider">System</p>
            <nav className="space-y-1">
              {systemItems.map((item) => (
                <Link key={item.name} href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                    pathname === item.href 
                      ? 'bg-accent/10 text-text-primary font-medium' 
                      : 'text-text-tertiary hover:bg-elevated hover:text-text-secondary'
                  }`}>
                  <Icon name={item.icon} className="w-5 h-5" />
                  {item.name}
                </Link>
              ))}
            </nav>
            <Link href="/clients/new" className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-accent hover:bg-accent-hover font-medium text-white transition-colors">
              <Icon name="plus" className="w-5 h-5" />
              New Client
            </Link>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className={`hidden lg:flex flex-col h-screen fixed left-0 top-0 bg-sidebar border-r border-border z-30 transition-all duration-250 ease-out ${collapsed ? 'w-16' : 'w-60'}`}>
        {/* Logo Area */}
        <div className="p-5 border-b border-border">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <LogoImage />
            {!collapsed && (
              <div>
                <h1 className="font-bold text-lg tracking-tight text-text-primary">{appName}</h1>
                <p className="text-xs text-text-tertiary">{agencyName}</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-3">
          <Link href="/clients/new" className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-md bg-accent hover:bg-accent-hover text-sm font-medium text-white transition-colors ${collapsed ? 'w-full' : ''}`}>
            <Icon name="plus" className="w-4 h-4" />
            {!collapsed && <span>New Client</span>}
          </Link>
        </div>

        {/* Workspace Section */}
        <div className="px-3 py-2">
          {!collapsed && <p className="text-xs text-text-disabled font-semibold px-3 mb-2 tracking-wider">Workspace</p>}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link key={item.name} href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all relative ${
                    isActive 
                      ? 'bg-accent/10 text-text-primary' 
                      : 'text-text-tertiary hover:bg-elevated hover:text-text-secondary'
                  }`}>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-accent rounded-r-full" />
                  )}
                  <Icon name={item.icon} className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* System Section */}
        <div className="mt-auto p-3 border-t border-border">
          {!collapsed && <p className="text-xs text-text-disabled font-semibold px-3 mb-2 tracking-wider">System</p>}
          <nav className="space-y-1">
            {systemItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.name} href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all relative ${
                    isActive 
                      ? 'bg-accent/10 text-text-primary' 
                      : 'text-text-tertiary hover:bg-elevated hover:text-text-secondary'
                  }`}>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-accent rounded-r-full" />
                  )}
                  <Icon name={item.icon} className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </nav>
          <div className={`flex items-center justify-between mt-4 ${collapsed ? 'flex-col gap-3' : ''}`}>
            {!collapsed && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-input flex items-center justify-center">
                  <span className="text-xs text-text-tertiary font-medium">IM</span>
                </div>
                <p className="text-xs text-text-disabled">v1.0.0</p>
              </div>
            )}
            <button 
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-md text-text-disabled hover:text-text-secondary hover:bg-elevated transition-colors"
            >
              <svg className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className={`hidden lg:block ${collapsed ? 'w-16' : 'w-60'} flex-shrink-0 transition-all duration-250`} />
    </>
  );
}