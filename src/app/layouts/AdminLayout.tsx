import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  Store,
  Users,
  ShieldCheck,
  BarChart3,
  Settings,
  Bell,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/features/auth/authStore';
import { useTheme } from '@/features/theme/themeProvider';
import { soundManager } from '@/lib/sound';
import { ordersApi, adminApi } from '@/api/endpoints';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const { theme, setTheme } = useTheme();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [soundMuted, setSoundMuted] = useState(soundManager.getMuted());
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [pendingAdminsCount, setPendingAdminsCount] = useState(0);

  const prevOrdersCountRef = useRef<number | null>(null);

  // Toggle sound mute
  const toggleSound = () => {
    const next = !soundMuted;
    soundManager.setMuted(next);
    setSoundMuted(next);
    toast.info(next ? 'Sound notifications muted' : 'Sound notifications active');
  };

  // Poll for new orders and pending approvals every 15 seconds
  useEffect(() => {
    let isMounted = true;

    const checkUpdates = async () => {
      try {
        const [ordersRes, adminsRes] = await Promise.all([
          ordersApi.list({ orderStatus: 'pending', limit: 100 }),
          adminApi.listAdmins({ approvalStatus: 'pending' }),
        ]);

        if (!isMounted) return;

        const currentPendingOrders = ordersRes.data.total;
        setPendingOrdersCount(currentPendingOrders);
        setPendingAdminsCount(adminsRes.data.total);

        // If new pending order arrived compared to last poll
        if (
          prevOrdersCountRef.current !== null &&
          currentPendingOrders > prevOrdersCountRef.current
        ) {
          const newOrdersDiff = currentPendingOrders - prevOrdersCountRef.current;
          soundManager.playNewOrderChime();
          toast.info(
            `🔔 ${newOrdersDiff} new order(s) received!`,
            {
              description: 'Check the orders board to confirm or prepare.',
              action: {
                label: 'View Orders',
                onClick: () => navigate('/admin/orders'),
              },
            }
          );
        }

        prevOrdersCountRef.current = currentPendingOrders;
      } catch {
        // polling silence
      }
    };

    checkUpdates();
    const interval = setInterval(checkUpdates, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [navigate]);

  const handleLogout = () => {
    clearAuth();
    toast.success('Signed out of admin dashboard');
    navigate('/auth/login');
  };

  const navGroups = [
    {
      title: 'Overview',
      items: [
        {
          label: 'Dashboard',
          href: '/admin',
          icon: LayoutDashboard,
          badge: null,
        },
      ],
    },
    {
      title: 'Operations',
      items: [
        {
          label: 'Orders',
          href: '/admin/orders',
          icon: ShoppingBag,
          badge: pendingOrdersCount > 0 ? pendingOrdersCount : null,
          badgeVariant: 'warning' as const,
        },
        {
          label: 'Menu & Items',
          href: '/admin/menu',
          icon: UtensilsCrossed,
          badge: null,
        },
        {
          label: 'Restaurants',
          href: '/admin/restaurants',
          icon: Store,
          badge: null,
        },
      ],
    },
    {
      title: 'Management',
      items: [
        {
          label: 'Customers',
          href: '/admin/customers',
          icon: Users,
          badge: null,
        },
        {
          label: 'Admin Approvals',
          href: '/admin/admins',
          icon: ShieldCheck,
          badge: pendingAdminsCount > 0 ? pendingAdminsCount : null,
          badgeVariant: 'destructive' as const,
        },
        {
          label: 'Reports & Analytics',
          href: '/admin/reports',
          icon: BarChart3,
          badge: null,
        },
      ],
    },
    {
      title: 'System',
      items: [
        {
          label: 'Settings & Profile',
          href: '/admin/settings',
          icon: Settings,
          badge: null,
        },
      ],
    },
  ];

  const renderNavLinks = () => (
    <div className="space-y-6 px-3 py-4">
      {navGroups.map((group, gIdx) => (
        <div key={gIdx} className="space-y-1">
          {!collapsed && (
            <h4 className="px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
              {group.title}
            </h4>
          )}
          <nav className="space-y-1">
            {group.items.map((item) => {
              const isActive =
                item.href === '/admin'
                  ? location.pathname === '/admin'
                  : location.pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileDrawerOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors select-none',
                    isActive
                      ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    collapsed && 'justify-center px-2'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                  {!collapsed && item.badge !== null && (
                    <Badge
                      variant={isActive ? 'outline' : item.badgeVariant || 'default'}
                      className={cn(
                        'ml-auto text-[10px] h-5 min-w-[20px] px-1.5 justify-center',
                        isActive && 'bg-primary-foreground text-primary border-none'
                      )}
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Desktop Collapsible Sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col border-r bg-card transition-all duration-300 relative z-30',
          collapsed ? 'w-18' : 'w-64'
        )}
      >
        {/* Brand header */}
        <div className="h-16 border-b flex items-center justify-between px-4">
          <Link to="/admin" className="flex items-center gap-2.5 overflow-hidden">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shrink-0 shadow-sm">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-extrabold text-base tracking-tight leading-none">
                  DineFlow
                </span>
                <span className="text-[10px] text-primary font-bold uppercase tracking-wider mt-0.5">
                  Admin Portal
                </span>
              </div>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto">{renderNavLinks()}</div>

        {/* View Client App link */}
        <div className="p-3 border-t">
          <Button
            asChild
            variant="outline"
            size="sm"
            className={cn('w-full justify-start text-xs', collapsed && 'justify-center px-0')}
          >
            <Link to="/" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5 mr-2 shrink-0" />
              {!collapsed && <span>Open Client App</span>}
            </Link>
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-20 h-16 border-b bg-background/95 backdrop-blur px-4 sm:px-6 flex items-center justify-between gap-4">
          {/* Mobile menu trigger */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Sound notification mute toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              onClick={toggleSound}
              title={soundMuted ? 'Unmute order chimes' : 'Mute order chimes'}
              aria-label={soundMuted ? 'Sound muted' : 'Sound active'}
            >
              {soundMuted ? (
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Volume2 className="h-4 w-4 text-primary" />
              )}
            </Button>

            {/* Notification Bell */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 relative text-muted-foreground hover:text-foreground"
              onClick={() => navigate('/admin/orders')}
              title={`${pendingOrdersCount} pending orders`}
              aria-label={`Notifications: ${pendingOrdersCount} pending orders`}
            >
              <Bell className="h-4 w-4" />
              {pendingOrdersCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary animate-pulse" />
              )}
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {/* Admin User Menu with Role Badge */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2.5 h-10 px-2 rounded-lg hover:bg-muted"
                >
                  <Avatar className="h-8 w-8 border border-primary/30">
                    <AvatarFallback className="text-xs font-bold text-primary">
                      {user?.name?.charAt(0) || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-bold truncate max-w-[120px]">
                      {user?.name || 'Administrator'}
                    </span>
                    <span className="text-[10px] font-semibold text-primary uppercase">
                      Admin Staff
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{user?.name}</p>
                      <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary border-primary/40">
                        Admin
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/admin/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Admin Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/" className="cursor-pointer">
                    <UtensilsCrossed className="mr-2 h-4 w-4" />
                    Client Storefront
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content Router Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in-0"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative flex flex-col w-72 bg-card border-r shadow-xl z-10 animate-in slide-in-from-left">
            <div className="h-16 border-b flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                  <UtensilsCrossed className="h-4 w-4" />
                </div>
                <span className="font-bold text-base">DineFlow Admin</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setMobileDrawerOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto">{renderNavLinks()}</div>
          </div>
        </div>
      )}
    </div>
  );
}
