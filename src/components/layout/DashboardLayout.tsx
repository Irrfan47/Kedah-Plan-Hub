import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Button } from "@/components/ui/button";
import { Bell, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "react-router-dom";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, isLoading } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getRoleLabel = (role: string) => {
    const roleLabels = {
      admin: t('role.admin'),
      exco_user: t('role.exco_user'),
      finance_mmk: t('role.finance_mmk'),
    finance_officer: t('role.finance_officer'),
    super_admin: t('role.super_admin'),
    };
    return roleLabels[role as keyof typeof roleLabels] || role;
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return t('nav.dashboard');
    if (path === '/exco-users') return t('nav.exco_users');
    if (path === '/users') return t('nav.users');
    if (path === '/programs') return t('nav.programs');
    if (path === '/status') return t('nav.status');
    if (path === '/queries') return t('nav.queries');
    if (path === '/report') return t('nav.report');
    if (path === '/profile') return t('nav.profile');
    return t('nav.dashboard'); // Default fallback
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 bg-card border-b border-border px-6 flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-4">
              <SidebarTrigger className="p-2 hover:bg-muted rounded-lg transition-fast" />
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  SISTEM PENGURUSAN PERUNTUKAN EXCO
                </h1>
                <p className="text-sm text-muted-foreground">
                  Welcome back, {user?.fullName}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              <NotificationDropdown />
              
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>{t('profile.role')}:</span>
                <span className="px-2 py-1 bg-primary-light text-primary rounded-md font-medium capitalize">
                  {getRoleLabel(user?.role || '')}
                </span>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 bg-muted/20">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}