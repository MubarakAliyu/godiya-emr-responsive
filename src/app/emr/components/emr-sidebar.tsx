import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronDown,
  ChevronRight,
  Activity,
} from 'lucide-react';
import { cn } from '@/app/components/ui/utils';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { Badge } from '@/app/components/ui/badge';
import { Sidebar, SidebarRail, useSidebar } from '@/app/components/ui/sidebar';
import { getSidebarConfig, SidebarItem as SidebarItemType } from '@/app/emr/config/sidebar-config';
import { UserRole, getAuthState } from '@/app/emr/utils/auth';
import { useEMRStore } from '@/app/emr/store/emr-store';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  path?: string;
  badge?: string;
  children?: { label: string; path: string; icon?: React.ElementType }[];
}

function SidebarItem({ icon: Icon, label, path, badge, children }: SidebarItemProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isMobile, setOpenMobile } = useSidebar();
  const [isExpanded, setIsExpanded] = useState(false);
  const isActive = path ? location.pathname === path : false;
  const hasActiveChild = children?.some(child => location.pathname === child.path);

  const handleNavigate = (targetPath: string) => {
    if (location.pathname !== targetPath) {
      navigate(targetPath);
    }

    if (isMobile) {
      setOpenMobile(false);
    }
  };

  useEffect(() => {
    if (hasActiveChild) {
      setIsExpanded(true);
    }
  }, [hasActiveChild]);

  if (children) {
    return (
      <div className="space-y-1">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group",
            hasActiveChild
              ? "bg-primary/10 text-primary"
              : "text-sidebar-foreground hover:bg-sidebar-accent"
          )}
        >
          <div className="flex items-center gap-3">
            <Icon className="w-5 h-5 shrink-0" />
            <span className="font-medium">{label}</span>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 transition-transform" />
          ) : (
            <ChevronRight className="w-4 h-4 transition-transform" />
          )}
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden pl-4 space-y-1"
            >
              {children.map((child) => {
                const ChildIcon = child.icon;
                const isChildActive = location.pathname === child.path;
                return (
                  <button
                    key={child.path}
                    type="button"
                    onClick={() => handleNavigate(child.path)}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-all",
                      isChildActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    )}
                  >
                    {ChildIcon && <ChildIcon className="w-4 h-4 shrink-0" />}
                    <span>{child.label}</span>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => path && handleNavigate(path)}
      className={cn(
        "flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-all group",
        isActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-sidebar-foreground hover:bg-sidebar-accent"
      )}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span>{label}</span>
      {badge && (
        <Badge variant="secondary" className="ml-auto text-xs">
          {badge}
        </Badge>
      )}
    </button>
  );
}

export function EMRSidebar() {
  const authState = getAuthState();
  const user = authState?.user;
  const userRole = (user?.role || 'Super Admin') as UserRole;
  const sidebarConfig = getSidebarConfig(userRole);
  const { notifications } = useEMRStore();

  // Live badge counts for pharmacy nav items
  const [lowStockCount, setLowStockCount] = useState<string | undefined>(undefined);
  const [expiredCount, setExpiredCount] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (userRole !== 'Pharmacy') return;
    fetch('/api/drugs.php')
      .then(r => r.json())
      .then((data: any[]) => {
        const now = new Date();
        const LOW_STOCK_THRESHOLD = 10;
        const low = data.filter(d => {
          const qty = parseInt(d.drug_qty);
          return qty > 0 && qty < LOW_STOCK_THRESHOLD;
        }).length;
        const expired = data.filter(d => new Date(d.expiry_date) < now).length;
        setLowStockCount(low > 0 ? String(low) : undefined);
        setExpiredCount(expired > 0 ? String(expired) : undefined);
      })
      .catch(() => {/* silently ignore — sidebar badge is non-critical */ });
  }, [userRole]);

  // Override badges with live counts
  const getItemBadge = (item: SidebarItemType): string | undefined => {
    // Notifications count
    if (item.path?.endsWith('/notifications')) {
      const unreadCount = notifications.filter(n => n.unread).length;
      return unreadCount > 0 ? String(unreadCount) : undefined;
    }

    if (item.path === '/emr/pharmacy-staff/low-stocks') return lowStockCount;
    if (item.path === '/emr/pharmacy-staff/expired-drugs') return expiredCount;
    return item.badge;
  };

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-sidebar-border print:hidden">
      <div className="flex h-full flex-col bg-sidebar">
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Activity className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Godiya EMR</h1>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Hospital Management System</p>
          <Badge className="mt-2 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
            {userRole}
          </Badge>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {sidebarConfig.sections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                {section.title}
              </p>
              {section.items.map((item, itemIdx) => (
                <SidebarItem key={itemIdx} {...item} badge={getItemBadge(item)} />
              ))}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-sidebar-accent/50">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-white">
                {user?.name?.charAt(0) || 'A'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email || ''}
              </p>
            </div>
            <div className="w-2 h-2 bg-green-500 rounded-full" title="Active" />
          </div>
        </div>
      </div>
      <SidebarRail />
    </Sidebar>
  );
}
