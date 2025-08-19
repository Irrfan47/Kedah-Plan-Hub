import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  UserCircle, 
  FileText,
  MessageSquare,
  TrendingUp,
  LogOut,
  ChevronDown,
  Building2,
  UserCheck,
  BarChart3
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useLanguage } from "@/contexts/LanguageContext";

interface MenuItem {
  title: string;
  url: string;
  icon: any;
  roles: UserRole[];
}

const menuItems: MenuItem[] = [
  {
    title: "nav.exco_users",
    url: "/exco-users",
    icon: UserCheck,
    roles: ["admin", "finance_mmk", "finance_officer", "super_admin"],
  },
  {
    title: "nav.dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "exco_user", "finance_mmk", "finance_officer", "super_admin"],
  },
  {
    title: "nav.users",
    url: "/users",
    icon: Users,
    roles: ["admin"],
  },
  {
    title: "nav.programs",
    url: "/programs",
    icon: ClipboardList,
    roles: ["admin", "exco_user", "finance_mmk", "finance_officer", "super_admin"],
  },
  {
    title: "nav.status",
    url: "/status",
    icon: TrendingUp,
    roles: ["admin", "finance_mmk", "finance_officer", "super_admin"],
  },
  {
    title: "nav.queries",
    url: "/query",
    icon: MessageSquare,
    roles: ["exco_user"],
  },
  {
    title: "nav.report",
    url: "/report",
    icon: BarChart3,
    roles: ["admin", "exco_user", "finance_mmk", "finance_officer", "super_admin"],
  },
  {
    title: "nav.profile",
    url: "/profile",
    icon: UserCircle,
    roles: ["admin", "exco_user", "finance_mmk", "finance_officer", "super_admin"],
  },
];

export function AppSidebar() {
  const sidebar = useSidebar();
  const collapsed = sidebar.state === "collapsed";
  const { user, logout, isLoading } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    `flex items-center space-x-3 px-3 py-2 rounded-lg transition-smooth ${
      isActive 
        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
        : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
    }`;

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

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(item => 
    user ? item.roles.includes(user.role) : []
  );

  const getUserInitials = (name?: string) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  return (
    <Sidebar className={`${collapsed ? "w-14" : "w-64"} border-r border-sidebar-border`}>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-12 h-12 flex items-center justify-center">
            <img 
              src={`${import.meta.env.BASE_URL}img/logo.png`} 
              alt="Logo" 
              className="w-full h-full object-contain"
              onError={(e) => {
                // Fallback to icon if logo fails to load
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="w-12 h-12 bg-sidebar-primary rounded-lg flex items-center justify-center hidden">
              <Building2 className="w-6 h-6 text-sidebar-primary-foreground" />
            </div>
          </div>
          {!collapsed && (
            <div className="text-center">
              <h2 className="text-sm font-semibold text-sidebar-foreground leading-tight">
                SISTEM PENGURUSAN PERUNTUKAN EXCO
              </h2>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/80 mb-2">
            {!collapsed && t('nav.navigation')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {filteredMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={getNavCls}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span>{t(item.title)}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        {isLoading ? (
          <div className="flex items-center space-x-3 animate-pulse">
            <div className="w-8 h-8 bg-muted rounded-full" />
            <div className="flex-1 min-w-0">
              <div className="h-4 bg-muted rounded w-24 mb-1" />
              <div className="h-3 bg-muted rounded w-16" />
            </div>
          </div>
        ) : user && (
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user.profilePhoto} />
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-sm">
                  {getUserInitials(user?.fullName || user?.full_name)}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                    {user.fullName}
                  </p>
                  <p className="text-xs text-sidebar-foreground/60 capitalize">
                    {getRoleLabel(user.role)}
                  </p>
                </div>
              )}
            </div>
            {!collapsed && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => logout()}
                className="w-full justify-start space-x-2 border-sidebar-border text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('common.logout')}</span>
              </Button>
            )}
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}