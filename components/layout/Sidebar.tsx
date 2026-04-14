'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: DashboardIcon },
  { name: 'Clients', href: '/clients', icon: ClientsIcon },
  { name: 'Queue', href: '/queue', icon: QueueIcon },
  { name: 'Drafts', href: '/drafts', icon: DraftsIcon },
  { name: 'Settings', href: '/settings', icon: SettingsIcon },
];

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25a2.25 2.25 0 0 1-2.25 2.25h-2.25A2.25 2.25 0 0 1 13.5 8.25V6ZM13.5 13.5a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
    </svg>
  );
}

function ClientsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h12M6.75 15.75h12M6.75 18h12M9.75 9.75c1.652 0 3.112.76 4.022 1.936M9.75 9.75c0 .728.292 1.395.784 1.892M12.772 11.642c1.252-.94 2.864-1.392 4.556-1.392m-4.556 1.392c-.448.448-.784 1.115-.784 1.892m0 0c0-.728.292-1.395.784-1.892M16.5 15.75c1.652 0 3.112.76 4.022 1.936M16.5 15.75c0 .728-.292 1.395-.784 1.892M19.796 11.642c1.252-.94 2.864-1.392 4.556-1.392m-4.556 1.392c-.448.448-.784 1.115-.784 1.892" />
    </svg>
  );
}

function QueueIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  );
}

function DraftsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.08.124.15.252.214.362.06.11.09.227.09.337v1.053c0 .124-.03.236-.09.337l-1.253-1.318a1.125 1.125 0 0 1 .026-.402l1.245-1.348c.093-.106.145-.246.145-.402v-.943c0-.248-.104-.488-.29-.662a1.562 1.562 0 0 1-.804-.51l-1.384-2.443a1.562 1.562 0 0 1-.456-1.025v-.967c0-.248-.104-.488-.29-.662a1.562 1.562 0 0 1-.804-.51l-1.384-2.443a1.562 1.562 0 0 1-.456-1.025v-.967c0-.248-.104-.488-.29-.662a1.562 1.562 0 0 1-.804-.51l-1.384-2.443a1.562 1.562 0 0 1-.456-1.025v-.967c0-.248-.104-.488-.29-.662a1.562 1.562 0 0 1-.804-.51l-1.384-2.443a1.562 1.562 0 0 1-.456-1.025V5.559c0-.248.104-.488.29-.662a1.562 1.562 0 0 1 .804-.51l1.384-2.443c.093-.106.145-.246.145-.402v-.943c0-.248-.104-.488-.29-.662a1.562 1.562 0 0 1-.804-.51l-1.384-2.443a1.562 1.562 0 0 1-.456-1.025V5.559c0-.248.104-.488.29-.662a1.562 1.562 0 0 1 .804-.51l1.384-2.443a1.562 1.562 0 0 1 .456-1.025V5.559c0-.248.104-.488.29-.662a1.562 1.562 0 0 1 .804-.51l1.384-2.443c.093-.106.145-.246.145-.402v-.943c0-.248.104-.488.29-.662a1.562 1.562 0 0 1 .804-.51z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex w-64 flex-col border-r bg-card">
      <div className="border-b p-4">
        <h1 className="text-xl font-bold">Local SEO OS</h1>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4">
        <p className="text-xs text-muted-foreground">v1.0.0</p>
      </div>
    </div>
  );
}