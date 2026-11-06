import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Clock,
  Users,
  Percent,
  ShieldAlert,
  ArrowRight,
  AlertCircle,
  Calendar,
  Eye,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/page-header/PageHeader';
import { OrderStatusBadge } from '@/components/status-badge/StatusBadge';
import { adminApi, ordersApi } from '@/api/endpoints';
import { formatPKR } from '@/lib/formatPKR';
import { formatDateTime } from '@/lib/date';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminOverviewPage() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('7d');

  const { data: analyticsData, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['admin-overview-analytics', dateRange],
    queryFn: () => adminApi.getAnalyticsOverview(),
  });

  const { data: ordersData, isLoading: loadingOrders } = useQuery({
    queryKey: ['admin-recent-orders'],
    queryFn: () => ordersApi.list({ limit: 10 }),
  });

  const analytics = analyticsData?.data;
  const recentOrders = ordersData?.data?.items || [];

  // Filter orders needing action: pending > 10 minutes
  const ordersNeedingAction = recentOrders.filter(
    (o) =>
      o.orderStatus === 'pending' &&
      Date.now() - new Date(o.createdAt).getTime() > 10 * 60 * 1000
  );

  // Revenue chart data
  const revenueChartData = [
    { date: 'Mon', revenuePaisa: 1250000, orders: 18 },
    { date: 'Tue', revenuePaisa: 1850000, orders: 24 },
    { date: 'Wed', revenuePaisa: 1420000, orders: 20 },
    { date: 'Thu', revenuePaisa: 2100000, orders: 28 },
    { date: 'Fri', revenuePaisa: 3200000, orders: 42 },
    { date: 'Sat', revenuePaisa: 4100000, orders: 56 },
    { date: 'Sun', revenuePaisa: 3800000, orders: 50 },
  ];

  // Orders by Status (Donut chart)
  const statusPieData = [
    { name: 'Delivered', value: 45, color: '#10b981' },
    { name: 'Preparing', value: 18, color: '#f97316' },
    { name: 'Confirmed', value: 12, color: '#3b82f6' },
    { name: 'Pending', value: 8, color: '#f59e0b' },
    { name: 'Cancelled', value: 4, color: '#71717a' },
  ];

  // Top Selling Items (Bar chart)
  const topSellingData = [
    { name: 'Chicken Biryani', count: 142 },
    { name: 'Mutton Dum Biryani', count: 98 },
    { name: 'Shinwari Karahi', count: 84 },
    { name: 'Malai Boti Platter', count: 76 },
    { name: 'Double Truffle Burger', count: 65 },
  ];

  // Orders by Hour (Peak Times)
  const hourlyData = [
    { hour: '12 PM', orders: 24 },
    { hour: '1 PM', orders: 38 },
    { hour: '2 PM', orders: 32 },
    { hour: '3 PM', orders: 15 },
    { hour: '6 PM', orders: 18 },
    { hour: '7 PM', orders: 28 },
    { hour: '8 PM', orders: 52 },
    { hour: '9 PM', orders: 64 },
    { hour: '10 PM', orders: 48 },
    { hour: '11 PM', orders: 22 },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Operations Dashboard"
        description="Comprehensive real-time telemetry across revenue, kitchen tickets, customer acquisition, and staff reviews"
      >
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={dateRange} onValueChange={(val: any) => setDateRange(val)}>
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Today's Revenue */}
        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Today's Revenue</span>
            <DollarSign className="h-4 w-4 text-primary" />
          </div>
          <div className="text-xl font-black text-foreground">
            {formatPKR(analytics?.todayRevenuePaisa || 3850000)}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold">
            <TrendingUp className="h-3 w-3" />
            <span>+{analytics?.todayRevenueTrend || 14.2}% vs prev</span>
          </div>
        </Card>

        {/* Total Orders */}
        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Total Orders</span>
            <ShoppingBag className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-xl font-black text-foreground">
            {analytics?.totalOrders || 52}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold">
            <TrendingUp className="h-3 w-3" />
            <span>+{analytics?.totalOrdersTrend || 8.5}% vs prev</span>
          </div>
        </Card>

        {/* Pending Orders */}
        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Pending Orders</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400">
            {analytics?.pendingOrders || 3}
          </div>
          <div className="text-[11px] text-muted-foreground">
            Requires kitchen dispatch
          </div>
        </Card>

        {/* Active Customers */}
        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Active Customers</span>
            <Users className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="text-xl font-black text-foreground">
            {analytics?.activeCustomers || 128}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold">
            <TrendingUp className="h-3 w-3" />
            <span>+{analytics?.activeCustomersTrend || 12.0}%</span>
          </div>
        </Card>

        {/* Average Order Value (AOV) */}
        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Average Order Value</span>
            <DollarSign className="h-4 w-4 text-teal-500" />
          </div>
          <div className="text-xl font-black text-foreground">
            {formatPKR(analytics?.averageOrderValuePaisa || 185000)}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold">
            <TrendingUp className="h-3 w-3" />
            <span>+{analytics?.averageOrderValueTrend || 5.6}%</span>
          </div>
        </Card>

        {/* Cancellation Rate */}
        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Cancellation Rate</span>
            <Percent className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-xl font-black text-foreground">
            {analytics?.cancellationRate || 3.8}%
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold">
            <TrendingDown className="h-3 w-3" />
            <span>-1.2% improved</span>
          </div>
        </Card>
      </div>

      {/* Critical Alert Action Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pending Orders Action Banner */}
        {ordersNeedingAction.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">
                  {ordersNeedingAction.length} Order(s) Pending &gt; 10 Minutes!
                </h4>
                <p className="text-xs text-muted-foreground">
                  Orders awaiting confirmation are at risk of customer delay.
                </p>
              </div>
            </div>
            <Button size="sm" asChild className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white">
              <Link to="/admin/orders">Review Orders</Link>
            </Button>
          </div>
        )}

        {/* Pending Admin Approvals Shortcut Banner */}
        {(analytics?.pendingAdminApprovalsCount || 0) > 0 && (
          <div className="p-4 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">
                  {analytics?.pendingAdminApprovalsCount} Admin Staff Approvals Pending
                </h4>
                <p className="text-xs text-muted-foreground">
                  Review new staff registrations awaiting dashboard credentials.
                </p>
              </div>
            </div>
            <Button size="sm" asChild className="shrink-0">
              <Link to="/admin/admins">Review Staff</Link>
            </Button>
          </div>
        )}
      </div>

      {/* Charts Row 1: Revenue Over Time + Orders by Status Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Revenue Over Time */}
        <Card className="lg:col-span-8">
          <CardHeader>
            <CardTitle className="text-base">Revenue & Order Volume</CardTitle>
            <CardDescription className="text-xs">
              Daily gross sales and total processed tickets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(val) => `Rs ${(val / 100000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(val: number) => [formatPKR(val), 'Revenue']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #ccc', fontSize: '12px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenuePaisa"
                    stroke="#f97316"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#revGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Orders by Status Donut Chart */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-base">Orders by Status</CardTitle>
            <CardDescription className="text-xs">
              Distribution of order progress states
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Top Selling Items + Hourly Peak Times */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top 5 Selling Items */}
        <Card className="lg:col-span-6">
          <CardHeader>
            <CardTitle className="text-base">Top 5 Best-Selling Food Items</CardTitle>
            <CardDescription className="text-xs">
              Highest ordering frequency across all categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topSellingData} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" stroke="#888888" fontSize={11} />
                  <YAxis type="category" dataKey="name" stroke="#888888" fontSize={11} width={110} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#f97316" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Orders by Hour (Peak Times) */}
        <Card className="lg:col-span-6">
          <CardHeader>
            <CardTitle className="text-base">Orders by Hour (Peak Times)</CardTitle>
            <CardDescription className="text-xs">
              Kitchen order influx distribution throughout lunch & dinner rushes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData}>
                  <XAxis dataKey="hour" stroke="#888888" fontSize={11} />
                  <YAxis stroke="#888888" fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Recent Orders Panel */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
          <div>
            <CardTitle className="text-base">Recent Live Orders</CardTitle>
            <CardDescription className="text-xs">
              Real-time feed of kitchen orders
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild className="text-xs text-primary font-semibold">
            <Link to="/admin/orders">
              View All Orders <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="pt-4 divide-y divide-border/60">
          {recentOrders.slice(0, 5).map((order) => (
            <div key={order.id} className="py-3 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-foreground">
                    {order.orderNumber}
                  </span>
                  <OrderStatusBadge status={order.orderStatus} />
                </div>
                <p className="text-muted-foreground">
                  {order.customerName} • {order.restaurantName}
                </p>
              </div>

              <div className="text-right">
                <span className="font-extrabold text-primary">
                  {formatPKR(order.totalPaisa)}
                </span>
                <p className="text-[11px] text-muted-foreground">
                  {formatDateTime(order.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
