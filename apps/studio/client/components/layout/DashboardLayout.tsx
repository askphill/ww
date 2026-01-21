import {Header} from './Header';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({children}: DashboardLayoutProps) {
  return (
    <div className="flex h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
