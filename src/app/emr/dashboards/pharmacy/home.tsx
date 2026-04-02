import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Pill,
  AlertTriangle,
  DollarSign,
  Package,
  TrendingUp,
  TrendingDown,
  Minus,
  ShoppingCart,
  FileText,
  Calendar,
  ClipboardList,
  PackageSearch,
  PackagePlus,
  Eye,
  ArrowRight,
  CheckCircle,
  XCircle,
  Clock,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { useEMRStore } from '@/app/emr/store/emr-store';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/components/ui/tooltip';

interface KPICardProps {
  title: string;
  value: number;
  icon: any;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: string;
  tooltip?: string;
  prefix?: string;
  onClick?: () => void;
  clickable?: boolean;
}

interface Drug {
  id: string;
  name: string;
  category: string;
  quantity: number;
  reorderLevel: number;
  price: number;
  expiryDate: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Expired';
}

interface Prescription {
  id: string;
  prescriptionId: string;
  patientName: string;
  fileNumber: string;
  date: string;
  status: 'Pending' | 'Paid' | 'Dispensed';
  amount: number;
  drugs: string[];
}

interface RecentActivity {
  id: string;
  type: 'sale' | 'restock' | 'prescription' | 'alert';
  description: string;
  timestamp: string;
  amount?: number;
  status?: string;
}

// Mock data
const mockDrugs: Drug[] = []; // Replaced by API calls

const mockPrescriptions: Prescription[] = [
  { id: '1', prescriptionId: 'GH-RX-001', patientName: 'Aisha Mohammed', fileNumber: 'GH-2025-001', date: '2025-02-13', status: 'Pending', amount: 3500, drugs: ['Paracetamol 500mg', 'Amoxicillin 250mg'] },
  { id: '2', prescriptionId: 'GH-RX-002', patientName: 'Ibrahim Usman', fileNumber: 'GH-2025-002', date: '2025-02-13', status: 'Paid', amount: 5200, drugs: ['Metformin 500mg', 'Lisinopril 10mg'] },
  { id: '3', prescriptionId: 'GH-RX-003', patientName: 'Fatima Sani', fileNumber: 'GH-2025-003', date: '2025-02-13', status: 'Dispensed', amount: 2100, drugs: ['Ibuprofen 400mg'] },
  { id: '4', prescriptionId: 'GH-RX-004', patientName: 'Musa Bello', fileNumber: 'GH-2025-004', date: '2025-02-12', status: 'Pending', amount: 4800, drugs: ['Ciprofloxacin 500mg', 'Omeprazole 20mg'] },
  { id: '5', prescriptionId: 'GH-RX-005', patientName: 'Zainab Ahmad', fileNumber: 'GH-2025-005', date: '2025-02-12', status: 'Paid', amount: 3300, drugs: ['Cetirizine 10mg', 'Paracetamol 500mg'] },
];

const mockRecentActivity: RecentActivity[] = [
  { id: '1', type: 'sale', description: 'Dispensed prescription GH-RX-002 to Ibrahim Usman', timestamp: '2025-02-13T10:30:00', amount: 5200, status: 'Completed' },
  { id: '2', type: 'restock', description: 'Restocked Paracetamol 500mg - Added 200 units', timestamp: '2025-02-13T09:15:00' },
  { id: '3', type: 'prescription', description: 'New prescription GH-RX-001 received for Aisha Mohammed', timestamp: '2025-02-13T08:45:00', status: 'Pending' },
  { id: '4', type: 'alert', description: 'Low stock alert: Amoxicillin 250mg (28 units remaining)', timestamp: '2025-02-13T08:00:00', status: 'Warning' },
  { id: '5', type: 'sale', description: 'Walk-in sale completed - ₦1,200', timestamp: '2025-02-12T16:20:00', amount: 1200, status: 'Completed' },
];

function KPICard({ title, value, icon: Icon, trend, trendValue, color = 'primary', tooltip, prefix = '', onClick, clickable = false }: KPICardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startValue = 0;
    const duration = 1000;
    const increment = value / (duration / 16);

    const timer = setInterval(() => {
      startValue += increment;
      if (startValue >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(startValue));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-3 h-3" />;
    if (trend === 'down') return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-muted-foreground';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="h-full"
          >
            <Card
              className={`hover:shadow-lg transition-all hover:-translate-y-1 h-full ${clickable ? 'cursor-pointer' : ''}`}
              onClick={clickable ? onClick : undefined}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground font-medium">{title}</p>
                    <h3 className="text-3xl font-bold text-foreground">
                      {prefix}{displayValue.toLocaleString()}
                    </h3>
                  </div>
                  <div
                    className={`p-3 rounded-xl`}
                    style={{
                      backgroundColor: color === 'primary' ? '#1e40af15' : color === 'secondary' ? '#05966915' : color === 'destructive' ? '#dc262615' : '#f5900b15'
                    }}
                  >
                    <Icon
                      className="w-6 h-6"
                      style={{
                        color: color === 'primary' ? '#1e40af' : color === 'secondary' ? '#059669' : color === 'destructive' ? '#dc2626' : '#f59e0b'
                      }}
                    />
                  </div>
                </div>
                {trend && (
                  <div className={`flex items-center gap-1 text-xs font-medium ${getTrendColor()}`}>
                    {getTrendIcon()}
                    <span>{trendValue}</span>
                  </div>
                )}
                {clickable && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-primary font-medium">
                    <span>View details</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TooltipTrigger>
        {tooltip && (
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}

export function PharmacyDashboardHome() {
  const { addNotification } = useEMRStore();
  const navigate = useNavigate();

  // State
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data
  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Drugs for inventory overview
      const drugsRes = await fetch('/api/drugs.php');
      const drugsData = await drugsRes.json();

      const now = new Date();
      const mappedDrugs: Drug[] = drugsData.map((d: any) => {
        const quantity = parseInt(d.drug_qty);
        const expiry = new Date(d.expiry_date);
        let status: Drug['status'] = 'In Stock';
        if (expiry < now) status = 'Expired';
        else if (quantity === 0) status = 'Out of Stock';
        else if (quantity < 10) status = 'Low Stock';

        return {
          id: d.drug_id,
          name: d.drug_name,
          category: d.drug_category || 'General',
          quantity: quantity,
          reorderLevel: 10,
          price: parseFloat(d.drug_price),
          expiryDate: d.expiry_date,
          status: status
        };
      });
      setDrugs(mappedDrugs);

      // 2. Fetch Stats (Income, Activity, Pending)
      const statsRes = await fetch('/api/dashboard_stats.php');
      const statsData = await statsRes.json();
      setStats(statsData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Data Error', {
        description: 'Failed to sync dashboard with live database.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Calculate Inventory KPIs
  const totalDrugs = drugs.length;
  const lowStockCount = drugs.filter(d => d.status === 'Low Stock' || d.status === 'Out of Stock').length;
  const expiredCount = drugs.filter(d => d.status === 'Expired').length;
  const totalInventoryValue = drugs.reduce((sum, d) => sum + (d.price * d.quantity), 0);

  // Activity & Prescriptions from backend
  const recentActivity = stats?.activities || [];
  const pendingPrescriptions = stats?.pendingList || [];

  // Low stock items preview
  const lowStockItems = drugs.filter(d => d.status === 'Low Stock' || d.status === 'Out of Stock').slice(0, 5);

  // Get activity icon
  const getActivityIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('sale') || t.includes('invoice')) return <ShoppingCart className="w-4 h-4 text-green-600" />;
    if (t.includes('restock') || t.includes('drug')) return <PackagePlus className="w-4 h-4 text-blue-600" />;
    if (t.includes('login')) return <CheckCircle className="w-4 h-4 text-primary" />;
    if (t.includes('password') || t.includes('profile')) return <Activity className="w-4 h-4 text-purple-600" />;
    return <Activity className="w-4 h-4 text-gray-600" />;
  };

  // Handle quick actions
  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'New Sale':
        navigate('/emr/pharmacy-staff/add-sales');
        break;
      case 'Inventory':
        navigate('/emr/pharmacy-staff/drugs');
        break;
      case 'Dispatch Queue':
        navigate('/emr/pharmacy-staff/paid-prescriptions');
        break;
      case 'Settings':
        navigate('/emr/pharmacy-staff/settings');
        break;
      default:
        toast.info('Feature Coming Soon');
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Pharmacy Dashboard</h1>
          <p className="text-muted-foreground">Manage inventory, prescriptions, and daily sales metrics</p>
        </div>
        <Button onClick={fetchDashboardData} variant="outline" size="sm" className="h-9">
          <Activity className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Stats
        </Button>
      </div>

      {/* KPI Section 1 - Inventory & Sales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Income"
          value={stats?.income || 0}
          icon={DollarSign}
          trend="up"
          trendValue="All-time paid"
          color="secondary"
          prefix="₦"
          tooltip="Total revenue from paid prescriptions and direct sales"
        />
        <KPICard
          title="Pending Dispensing"
          value={stats?.pendingCount || 0}
          icon={Clock}
          trend="neutral"
          trendValue="Awaiting action"
          color="warning"
          tooltip="Invoices currently in the dispatch queue"
          clickable
          onClick={() => navigate('/emr/pharmacy-staff/paid-prescriptions')}
        />
        <KPICard
          title="Low Stock"
          value={lowStockCount}
          icon={AlertTriangle}
          trend="down"
          color="destructive"
          tooltip="Drugs below reorder level"
          clickable
          onClick={() => navigate('/emr/pharmacy-staff/low-stocks')}
        />
        <KPICard
          title="Avg. Sale Value"
          value={stats?.avgValue || 0}
          icon={TrendingUp}
          color="primary"
          prefix="₦"
          tooltip="Average revenue per paid transaction"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Total Drugs" value={totalDrugs} icon={Pill} color="primary" />
        <KPICard title="Expired Drugs" value={expiredCount} icon={PackageSearch} color="destructive" clickable onClick={() => navigate('/emr/pharmacy-staff/expired-drugs')} />
        <KPICard title="Total Dispensed" value={stats?.paidCount || 0} icon={CheckCircle} color="secondary" />
        <KPICard title="Inventory Value" value={totalInventoryValue} icon={Package} color="primary" prefix="₦" />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Alerts */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  Stock Alerts
                </CardTitle>
                <CardDescription>Items needing immediate attention</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/emr/pharmacy-staff/low-stocks')}>
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lowStockItems.map((drug) => (
                  <div key={drug.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-semibold">{drug.name}</p>
                      <p className="text-xs text-muted-foreground">{drug.category}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className={`text-lg font-bold ${drug.quantity === 0 ? 'text-destructive' : 'text-orange-600'}`}>{drug.quantity}</p>
                        <p className="text-[10px] uppercase text-muted-foreground font-bold">In Stock</p>
                      </div>
                      <Badge variant={drug.quantity === 0 ? 'destructive' : 'outline'} className={drug.quantity > 0 ? 'bg-orange-50 text-orange-700 border-orange-100' : ''}>
                        {drug.quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                      </Badge>
                    </div>
                  </div>
                ))}
                {lowStockItems.length === 0 && (
                  <div className="text-center py-10">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <p className="text-muted-foreground font-medium">All drugs are sufficiently stocked</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-xl">Quick Actions</CardTitle>
              <CardDescription>Shortcut to main operations</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3">
              <Button variant="outline" className="h-auto p-4 justify-start hover:border-primary/50 hover:bg-primary/5 group" onClick={() => handleQuickAction('New Sale')}>
                <div className="p-2 rounded-lg bg-green-100 mr-3 group-hover:scale-110 transition-transform"><ShoppingCart className="w-5 h-5 text-green-600" /></div>
                <div className="text-left font-medium">Add New Sale</div>
              </Button>
              <Button variant="outline" className="h-auto p-4 justify-start hover:border-primary/50 hover:bg-primary/5 group" onClick={() => handleQuickAction('Dispatch Queue')}>
                <div className="p-2 rounded-lg bg-blue-100 mr-3 group-hover:scale-110 transition-transform"><Clock className="w-5 h-5 text-blue-600" /></div>
                <div className="text-left font-medium">Paid Prescriptions</div>
              </Button>
              <Button variant="outline" className="h-auto p-4 justify-start hover:border-primary/50 hover:bg-primary/5 group" onClick={() => handleQuickAction('Inventory')}>
                <div className="p-2 rounded-lg bg-purple-100 mr-3 group-hover:scale-110 transition-transform"><Package className="w-5 h-5 text-purple-600" /></div>
                <div className="text-left font-medium">Drug Catalog</div>
              </Button>
              <Button variant="outline" className="h-auto p-4 justify-start hover:border-primary/50 hover:bg-primary/5 group" onClick={() => handleQuickAction('Settings')}>
                <div className="p-2 rounded-lg bg-gray-100 mr-3 group-hover:scale-110 transition-transform"><Activity className="w-5 h-5 text-gray-600" /></div>
                <div className="text-left font-medium">Account Settings</div>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2"><Activity className="w-5 h-5 text-primary" />Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity: any) => (
                <div key={activity.id} className="flex items-start gap-4">
                  <div className="p-2 rounded-full bg-muted mt-1">{getActivityIcon(activity.type)}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium leading-none">{activity.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{activity.user}</span>
                      <span className="text-[10px] text-muted-foreground/60">•</span>
                      <span className="text-xs text-muted-foreground">{new Date(activity.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && <p className="text-center text-muted-foreground py-10">No recent activity logged</p>}
            </div>
          </CardContent>
        </Card>

        {/* Pending Prescriptions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">Dispatch Queue (Unpaid)</CardTitle>
            <Badge variant="outline">{pendingPrescriptions.length} Pending</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingPrescriptions.map((px: any) => (
                <div key={px.inv_id} className="p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-sm">{px.prescriptionId}</p>
                      <p className="text-xs text-muted-foreground">{px.patientName}</p>
                    </div>
                    <p className="font-bold text-primary text-sm">₦{parseFloat(px.amount).toLocaleString()}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground line-clamp-1">{px.drugs.join(', ')}</p>
                </div>
              ))}
              {pendingPrescriptions.length === 0 && <p className="text-center text-muted-foreground py-10">Queue is empty</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}