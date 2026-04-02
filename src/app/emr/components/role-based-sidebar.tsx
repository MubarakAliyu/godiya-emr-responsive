import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronRight, Activity } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';
import { Badge } from '@/app/components/ui/badge';
import { Sidebar, SidebarRail, useSidebar } from '@/app/components/ui/sidebar';
import { getCurrentUser } from '@/app/emr/utils/auth';
import { getSidebarConfig, SidebarItem as SidebarItemType, SidebarConfig } from '@/app/emr/config/sidebar-config';
import { useEMRStore } from '@/app/emr/store/emr-store';

interface SidebarItemProps {
  item: SidebarItemType;
}

function SidebarItem({ item }: SidebarItemProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isMobile, setOpenMobile } = useSidebar();
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = item.icon;
  const isActive = item.path ? location.pathname === item.path : false;
  const hasActiveChild = item.children?.some(child => location.pathname === child.path);

  const handleNavigate = (targetPath: string) => {
    if (location.pathname !== targetPath) {
      navigate(targetPath);
    }

    if (isMobile) {
      setOpenMobile(false);
    }
  };

  // Auto-expand if a child is active
  useEffect(() => {
    if (hasActiveChild) {
      setIsExpanded(true);
    }
  }, [hasActiveChild]);

  if (item.children) {
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
            <span className="font-medium">{item.label}</span>
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
              {item.children.map((child) => {
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
      onClick={() => item.path && handleNavigate(item.path)}
      className={cn(
        "flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-all group",
        isActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-sidebar-foreground hover:bg-sidebar-accent"
      )}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span>{item.label}</span>
      {item.badge && parseInt(item.badge) > 0 && (
        <Badge variant="secondary" className="ml-auto text-[10px] h-5 min-w-5 flex items-center justify-center p-0 bg-primary text-white border-none shadow-none">
          {item.badge}
        </Badge>
      )}
    </button>
  );
}

export function RoleBasedSidebar() {
  const authData = getCurrentUser();
  const { notifications } = useEMRStore();
  const [counts, setCounts] = useState<{ admissions: number; referrals: number; surgeries: number }>({ admissions: 0, referrals: 0, surgeries: 0 });

  // Pharmacy counts
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [expiredCount, setExpiredCount] = useState<number>(0);

  useEffect(() => {
    if (authData?.role === 'Nurse') {
      const fetchCounts = async () => {
        try {
          const res = await fetch('/api/nurse_requests.php?type=counts');
          if (res.ok) {
            const data = await res.json();
            setCounts(data);
          }
        } catch (error) {
          console.error('Error fetching sidebar counts:', error);
        }
      };

      fetchCounts();
      const interval = setInterval(fetchCounts, 30000);
      return () => clearInterval(interval);
    }

    if (authData?.role === 'Pharmacy') {
      const fetchPharmacyCounts = () => {
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
            setLowStockCount(low);
            setExpiredCount(expired);
          })
          .catch(() => { });
      };
      fetchPharmacyCounts();
      const interval = setInterval(fetchPharmacyCounts, 60000);
      return () => clearInterval(interval);
    }
  }, [authData?.role]);

  // Compute config dynamically
  const sidebarConfig = useMemo(() => {
    if (!authData) return null;
    const baseConfig = getSidebarConfig(authData.role);
    const unreadNotifications = notifications.filter(n => n.unread).length;

    return {
      ...baseConfig,
      sections: baseConfig.sections.map(section => ({
        ...section,
        items: section.items.map(item => {
          // Dynamic Notifications
          if (item.path?.endsWith('/notifications')) {
            return { ...item, badge: unreadNotifications > 0 ? unreadNotifications.toString() : undefined };
          }

          // Nurse specific
          if (authData.role === 'Nurse') {
            if (item.label === 'Admission Requests') return { ...item, badge: counts.admissions > 0 ? counts.admissions.toString() : undefined };
            if (item.label === 'Refer Requests') return { ...item, badge: counts.referrals > 0 ? counts.referrals.toString() : undefined };
            if (item.label === 'Surgery Requests') return { ...item, badge: counts.surgeries > 0 ? counts.surgeries.toString() : undefined };
          }

          // Pharmacy specific
          if (authData.role === 'Pharmacy') {
            if (item.path === '/emr/pharmacy-staff/low-stocks') return { ...item, badge: lowStockCount > 0 ? lowStockCount.toString() : undefined };
            if (item.path === '/emr/pharmacy-staff/expired-drugs') return { ...item, badge: expiredCount > 0 ? expiredCount.toString() : undefined };
          }

          return item;
        })
      }))
    };
  }, [authData, counts, notifications, lowStockCount, expiredCount]);

  if (!sidebarConfig) return null;

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-sidebar-border">
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
            {authData?.role || 'Super Administrator'}
          </Badge>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {sidebarConfig.sections.map((section, index) => (
            <div key={index} className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                {section.title}
              </p>
              {section.items.map((item, itemIndex) => (
                <SidebarItem key={itemIndex} item={item} />
              ))}
            </div>
          ))}
        </div>
      </div>
      <SidebarRail />
    </Sidebar>
  );
}
