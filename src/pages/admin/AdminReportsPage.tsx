import React, { useState } from 'react';
import {
  Download,
  Calendar,
  Filter,
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Flame,
  Clock,
  Layers,
  Percent,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PageHeader } from '@/components/page-header/PageHeader';
import { formatPKR } from '@/lib/formatPKR';
import { toast } from 'sonner';

export default function AdminReportsPage() {
  const [reportType, setReportType] = useState<'sales' | 'categories' | 'cancellations'>('sales');
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  // Sales Report Mock Data
  const salesData = [
    { period: 'Week 1', revenuePaisa: 12500000, orders: 142, avgOrderValuePaisa: 88000 },
    { period: 'Week 2', revenuePaisa: 16800000, orders: 184, avgOrderValuePaisa: 91300 },
    { period: 'Week 3', revenuePaisa: 14900000, orders: 160, avgOrderValuePaisa: 93100 },
    { period: 'Week 4', revenuePaisa: 19500000, orders: 210, avgOrderValuePaisa: 92800 },
  ];

  // Category Performance Data
  const categoryData = [
    { name: 'Biryani & Rice', revenuePaisa: 28400000, share: 44, color: '#f97316' },
    { name: 'Karahi & Shinwari', revenuePaisa: 18200000, share: 28, color: '#3b82f6' },
    { name: 'Gourmet Burgers', revenuePaisa: 11500000, share: 18, color: '#10b981' },
    { name: 'BBQ & Platters', revenuePaisa: 6400000, share: 10, color: '#8b5cf6' },
  ];

  // Cancellation Reasons Data
  const cancellationData = [
    { reason: 'Customer changed mind before kitchen prep', count: 14 },
    { reason: 'Delivery address unreachable / wrong phone', count: 8 },
    { reason: 'Restaurant ran out of specific meat cuts', count: 5 },
    { reason: 'Severe weather / rider shortage', count: 3 },
  ];

  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (reportType === 'sales') {
      headers = ['Period', 'Revenue (PKR)', 'Orders', 'Average Order Value (PKR)'];
      rows = salesData.map((d) => [d.period, formatPKR(d.revenuePaisa), d.orders, formatPKR(d.avgOrderValuePaisa)]);
    } else if (reportType === 'categories') {
      headers = ['Category', 'Revenue (PKR)', 'Market Share (%)'];
      rows = categoryData.map((d) => [d.name, formatPKR(d.revenuePaisa), `${d.share}%`]);
    } else {
      headers = ['Cancellation Reason', 'Total Count'];
      rows = cancellationData.map((d) => [d.reason, d.count]);
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `dineflow_report_${reportType}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report exported to CSV successfully');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics"
        description="Extract sales performance audits, category market shares, and order cancellation root causes"
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Reports' }]}
      >
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="mr-2 h-4 w-4" />
          Export Report CSV
        </Button>
      </PageHeader>

      {/* Tabs */}
      <Tabs value={reportType} onValueChange={(val: any) => setReportType(val)} className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
          <TabsList className="grid grid-cols-3 max-w-md">
            <TabsTrigger value="sales" className="gap-2 text-xs">
              <TrendingUp className="h-3.5 w-3.5" />
              Sales & Revenue
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2 text-xs">
              <Layers className="h-3.5 w-3.5" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="cancellations" className="gap-2 text-xs">
              <Percent className="h-3.5 w-3.5" />
              Cancellations
            </TabsTrigger>
          </TabsList>

          {reportType === 'sales' && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select value={timeframe} onValueChange={(val: any) => setTimeframe(val)}>
                <SelectTrigger className="w-[120px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Tab 1: Sales Report */}
        <TabsContent value="sales" className="space-y-6">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h3 className="text-sm font-bold mb-4">Gross Revenue by {timeframe} Period</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData}>
                  <XAxis dataKey="period" stroke="#888888" fontSize={11} />
                  <YAxis
                    stroke="#888888"
                    fontSize={11}
                    tickFormatter={(val) => `Rs ${(val / 100000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(val: number) => [formatPKR(val), 'Revenue']}
                  />
                  <Bar dataKey="revenuePaisa" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/60 border-b">
                <tr>
                  <th className="px-4 py-3 font-semibold uppercase">Period</th>
                  <th className="px-4 py-3 font-semibold uppercase">Revenue (PKR)</th>
                  <th className="px-4 py-3 font-semibold uppercase">Total Orders</th>
                  <th className="px-4 py-3 font-semibold uppercase text-right">Avg Order Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {salesData.map((d, i) => (
                  <tr key={i} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-bold">{d.period}</td>
                    <td className="px-4 py-3 font-extrabold text-primary">{formatPKR(d.revenuePaisa)}</td>
                    <td className="px-4 py-3">{d.orders} orders</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatPKR(d.avgOrderValuePaisa)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Tab 2: Category Breakdown */}
        <TabsContent value="categories" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl border bg-card p-6 shadow-sm flex flex-col items-center justify-center">
              <h3 className="text-sm font-bold mb-4 w-full text-left">Category Market Share</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="share"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, share }) => `${name} (${share}%)`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold">Revenue by Category</h3>
              <div className="space-y-3">
                {categoryData.map((c, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>{c.name}</span>
                      <span className="text-primary">{formatPKR(c.revenuePaisa)}</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${c.share}%`, backgroundColor: c.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab 3: Cancellations */}
        <TabsContent value="cancellations" className="space-y-4">
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/60 border-b">
                <tr>
                  <th className="px-4 py-3 font-semibold uppercase">Cancellation Reason</th>
                  <th className="px-4 py-3 font-semibold uppercase text-right">Occurrence Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {cancellationData.map((item, i) => (
                  <tr key={i} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">{item.reason}</td>
                    <td className="px-4 py-3 text-right font-bold text-destructive">{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
