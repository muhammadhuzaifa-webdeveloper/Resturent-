import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Filter,
  Download,
  Printer,
  Eye,
  CheckCircle2,
  Clock,
  ChefHat,
  PackageCheck,
  Bike,
  CheckCheck,
  XCircle,
  Ban,
  AlertTriangle,
  History,
  MapPin,
  Phone,
  FileText,
  DollarSign,
  UtensilsCrossed,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PageHeader } from '@/components/page-header/PageHeader';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/status-badge/StatusBadge';
import { ConfirmDialog } from '@/components/confirm-dialog/ConfirmDialog';
import { ordersApi, restaurantsApi } from '@/api/endpoints';
import { formatPKR } from '@/lib/formatPKR';
import { formatDateTime } from '@/lib/date';
import {
  type OrderStatus,
  type PaymentStatus,
  ALLOWED_ORDER_TRANSITIONS,
  ORDER_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
} from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/empty-state/EmptyState';
import { toast } from 'sonner';
import type { Order } from '@/api/types';

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();

  // Filters & State
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('all');
  const [selectedPaymentFilter, setSelectedPaymentFilter] = useState<string>('all');
  const [selectedRestaurantFilter, setSelectedRestaurantFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Modals & Selection
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [transitionTarget, setTransitionTarget] = useState<OrderStatus | null>(null);
  const [transitionDialogOpen, setTransitionDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<PaymentStatus | null>(null);
  const [printType, setPrintType] = useState<'kitchen' | 'invoice' | null>(null);

  // Queries
  const { data: ordersData, isLoading, refetch } = useQuery({
    queryKey: ['admin-orders', selectedStatusTab, selectedPaymentFilter, selectedRestaurantFilter, search, page],
    queryFn: () =>
      ordersApi.list({
        orderStatus: selectedStatusTab !== 'all' ? (selectedStatusTab as OrderStatus) : undefined,
        paymentStatus: selectedPaymentFilter !== 'all' ? (selectedPaymentFilter as PaymentStatus) : undefined,
        restaurantId: selectedRestaurantFilter !== 'all' ? selectedRestaurantFilter : undefined,
        search: search || undefined,
        page,
        limit: pageSize,
      }),
  });

  const { data: restaurantsData } = useQuery({
    queryKey: ['restaurants'],
    queryFn: () => restaurantsApi.list(),
  });

  const orders = ordersData?.data?.items || [];
  const total = ordersData?.data?.total || 0;
  const totalPages = Math.ceil(total / pageSize) || 1;
  const restaurants = restaurantsData?.data || [];

  // Status Transition Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status, reason }: { orderId: string; status: OrderStatus; reason?: string }) =>
      ordersApi.updateStatus(orderId, status, reason),
    onSuccess: (res) => {
      toast.success(`Order updated to ${res.data.orderStatus}`);
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      setSelectedOrder(res.data);
      setTransitionDialogOpen(false);
      setTransitionTarget(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update order status');
    },
  });

  // Payment Status Mutation
  const updatePaymentMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: PaymentStatus }) =>
      ordersApi.updatePaymentStatus(orderId, status),
    onSuccess: (res) => {
      toast.success('Payment status updated');
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      setSelectedOrder(res.data);
      setPaymentDialogOpen(false);
      setPaymentTarget(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update payment status');
    },
  });

  // Export CSV
  const handleExportCSV = () => {
    if (orders.length === 0) {
      toast.error('No orders to export');
      return;
    }
    const headers = ['Order Number', 'Date', 'Customer', 'Restaurant', 'Status', 'Payment', 'Total (PKR)'];
    const rows = orders.map((o) => [
      o.orderNumber,
      o.createdAt,
      o.customerName || 'Customer',
      o.restaurantName || 'Restaurant',
      o.orderStatus,
      o.paymentStatus,
      formatPKR(o.totalPaisa),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `dineflow_orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV export generated successfully');
  };

  const handlePrint = (type: 'kitchen' | 'invoice') => {
    setPrintType(type);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Check if transition is allowed
  const canTransition = (current: OrderStatus, target: OrderStatus): boolean => {
    const allowed = ALLOWED_ORDER_TRANSITIONS[current] || [];
    return allowed.includes(target);
  };

  const handleInitiateTransition = (target: OrderStatus) => {
    setTransitionTarget(target);
    setTransitionDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders Management"
        description="Monitor live kitchen tickets, manage status workflows, dispatch deliveries, and print invoices"
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Orders' }]}
      >
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </PageHeader>

      {/* Filter and Search Toolbar */}
      <div className="p-4 rounded-2xl border bg-card shadow-sm space-y-4">
        {/* Status Tabs */}
        <div className="overflow-x-auto pb-1 flex items-center gap-1.5 no-scrollbar">
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'pending', label: 'Pending' },
            { id: 'confirmed', label: 'Confirmed' },
            { id: 'preparing', label: 'Preparing' },
            { id: 'ready', label: 'Ready' },
            { id: 'out_for_delivery', label: 'Out for Delivery' },
            { id: 'delivered', label: 'Delivered' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setSelectedStatusTab(tab.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedStatusTab === tab.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order #, customer, phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>

          <Select
            value={selectedRestaurantFilter}
            onValueChange={(val) => {
              setSelectedRestaurantFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <UtensilsCrossed className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="All Restaurants" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Restaurants</SelectItem>
              {restaurants.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedPaymentFilter}
            onValueChange={(val) => {
              setSelectedPaymentFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="All Payment Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payment Statuses</SelectItem>
              <SelectItem value="pending">Unpaid (COD Pending)</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="failed">Payment Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Orders Data Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full caption-bottom text-sm text-left">
            <thead className="bg-muted/60 border-b">
              <tr>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Order #
                </th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Customer
                </th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Restaurant
                </th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Items
                </th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Total (PKR)
                </th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Payment
                </th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Created
                </th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3.5"><Skeleton className="h-5 w-20" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-5 w-28" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-5 w-32" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-5 w-12" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-5 w-20" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-5 w-20" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-4 py-3.5 text-right"><Skeleton className="h-8 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="h-48 text-center p-4">
                    <EmptyState
                      title="No orders found"
                      description="No orders currently match the selected filters or search parameters."
                    />
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const isLongPending =
                    order.orderStatus === 'pending' &&
                    Date.now() - new Date(order.createdAt).getTime() > 10 * 60 * 1000;

                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-muted/30 transition-colors ${
                        isLongPending ? 'bg-amber-500/10' : ''
                      }`}
                    >
                      <td className="px-4 py-3.5 font-mono font-bold text-foreground">
                        <div className="flex items-center gap-1.5">
                          <span>{order.orderNumber}</span>
                          {isLongPending && (
                            <span
                              className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"
                              title="Pending > 10 minutes! Needs immediate action"
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-foreground">
                        <p className="font-semibold">{order.customerName || 'Customer'}</p>
                        <p className="text-muted-foreground">{order.phone}</p>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground max-w-[150px] truncate">
                        {order.restaurantName || 'Restaurant'}
                      </td>
                      <td className="px-4 py-3.5 text-xs font-semibold">
                        {order.items.reduce((s, i) => s + i.quantity, 0)} pcs
                      </td>
                      <td className="px-4 py-3.5 text-xs font-black text-primary">
                        {formatPKR(order.totalPaisa)}
                      </td>
                      <td className="px-4 py-3.5">
                        <PaymentStatusBadge status={order.paymentStatus} />
                      </td>
                      <td className="px-4 py-3.5">
                        <OrderStatusBadge status={order.orderStatus} />
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDateTime(order.createdAt)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsDetailOpen(true);
                          }}
                          className="h-8 text-xs font-semibold gap-1.5"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-2">
        <span>
          Showing page {page} of {totalPages} ({total} total orders)
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>

      {/* ORDER DETAIL DRAWER / MODAL */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          {selectedOrder && (
            <div className="space-y-6 p-6">
              <DialogHeader className="border-b pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <DialogTitle className="text-xl font-bold font-mono">
                        {selectedOrder.orderNumber}
                      </DialogTitle>
                      <OrderStatusBadge status={selectedOrder.orderStatus} />
                      <PaymentStatusBadge status={selectedOrder.paymentStatus} />
                    </div>
                    <DialogDescription className="text-xs pt-1">
                      Placed: {formatDateTime(selectedOrder.createdAt)} • {selectedOrder.restaurantName}
                    </DialogDescription>
                  </div>

                  {/* Print buttons */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrint('kitchen')}
                      className="text-xs"
                    >
                      <Printer className="mr-1.5 h-3.5 w-3.5" />
                      Kitchen Ticket
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrint('invoice')}
                      className="text-xs"
                    >
                      <Printer className="mr-1.5 h-3.5 w-3.5" />
                      Invoice
                    </Button>
                  </div>
                </div>
              </DialogHeader>

              {/* Status Transition Control Buttons with strict workflow validation and Tooltips */}
              <div className="p-4 rounded-xl border bg-muted/40 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Order Workflow Actions
                </h4>
                <TooltipProvider>
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Confirmed */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button
                            size="sm"
                            disabled={!canTransition(selectedOrder.orderStatus, 'confirmed')}
                            onClick={() => handleInitiateTransition('confirmed')}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                          >
                            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                            Confirm Order
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {!canTransition(selectedOrder.orderStatus, 'confirmed') && (
                        <TooltipContent>
                          Only pending orders can be confirmed
                        </TooltipContent>
                      )}
                    </Tooltip>

                    {/* Preparing */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button
                            size="sm"
                            disabled={!canTransition(selectedOrder.orderStatus, 'preparing')}
                            onClick={() => handleInitiateTransition('preparing')}
                            className="bg-orange-600 hover:bg-orange-700 text-white text-xs"
                          >
                            <ChefHat className="mr-1.5 h-3.5 w-3.5" />
                            Start Kitchen Prep
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {!canTransition(selectedOrder.orderStatus, 'preparing') && (
                        <TooltipContent>
                          Order must be confirmed before starting kitchen prep
                        </TooltipContent>
                      )}
                    </Tooltip>

                    {/* Ready */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button
                            size="sm"
                            disabled={!canTransition(selectedOrder.orderStatus, 'ready')}
                            onClick={() => handleInitiateTransition('ready')}
                            className="bg-teal-600 hover:bg-teal-700 text-white text-xs"
                          >
                            <PackageCheck className="mr-1.5 h-3.5 w-3.5" />
                            Mark Ready
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {!canTransition(selectedOrder.orderStatus, 'ready') && (
                        <TooltipContent>
                          Order must be in preparation before marking ready
                        </TooltipContent>
                      )}
                    </Tooltip>

                    {/* Out for Delivery */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button
                            size="sm"
                            disabled={!canTransition(selectedOrder.orderStatus, 'out_for_delivery')}
                            onClick={() => handleInitiateTransition('out_for_delivery')}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                          >
                            <Bike className="mr-1.5 h-3.5 w-3.5" />
                            Hand to Rider
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {!canTransition(selectedOrder.orderStatus, 'out_for_delivery') && (
                        <TooltipContent>
                          Order must be marked ready before dispatching to rider
                        </TooltipContent>
                      )}
                    </Tooltip>

                    {/* Delivered */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button
                            size="sm"
                            disabled={!canTransition(selectedOrder.orderStatus, 'delivered')}
                            onClick={() => handleInitiateTransition('delivered')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                          >
                            <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
                            Mark Delivered
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {!canTransition(selectedOrder.orderStatus, 'delivered') && (
                        <TooltipContent>
                          Order must be out for delivery before marking delivered
                        </TooltipContent>
                      )}
                    </Tooltip>

                    {/* Cancel */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={!canTransition(selectedOrder.orderStatus, 'cancelled')}
                            onClick={() => handleInitiateTransition('cancelled')}
                            className="text-xs"
                          >
                            <XCircle className="mr-1.5 h-3.5 w-3.5" />
                            Cancel Order
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {!canTransition(selectedOrder.orderStatus, 'cancelled') && (
                        <TooltipContent>
                          Only confirmed orders can be cancelled with a reason
                        </TooltipContent>
                      )}
                    </Tooltip>

                    {/* Reject */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={!canTransition(selectedOrder.orderStatus, 'rejected')}
                            onClick={() => handleInitiateTransition('rejected')}
                            className="text-xs"
                          >
                            <Ban className="mr-1.5 h-3.5 w-3.5" />
                            Reject Order
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {!canTransition(selectedOrder.orderStatus, 'rejected') && (
                        <TooltipContent>
                          Only pending orders can be rejected with a reason
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </div>
                </TooltipProvider>

                {/* Payment Status Dropdown Control */}
                <div className="pt-3 border-t flex items-center justify-between gap-4">
                  <span className="text-xs text-muted-foreground font-semibold">
                    Payment Status Control:
                  </span>
                  <div className="flex items-center gap-2">
                    <Select
                      value={selectedOrder.paymentStatus}
                      onValueChange={(val: any) => {
                        setPaymentTarget(val);
                        setPaymentDialogOpen(true);
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Unpaid (COD Pending)</SelectItem>
                        <SelectItem value="paid">Paid (Cash Collected)</SelectItem>
                        <SelectItem value="failed">Payment Failed</SelectItem>
                        <SelectItem value="refunded">Refunded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Items & Financials */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold">Ordered Food Items</h4>
                <div className="rounded-xl border divide-y overflow-hidden text-xs">
                  {selectedOrder.items.map((it, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between">
                      <div>
                        <span className="font-bold">
                          {it.quantity}x {it.name}
                        </span>
                        <p className="text-muted-foreground">{formatPKR(it.unitPricePaisa)} each</p>
                      </div>
                      <span className="font-bold text-foreground">
                        {formatPKR(it.lineSubtotalPaisa)}
                      </span>
                    </div>
                  ))}
                  <div className="p-3 bg-muted/40 space-y-1 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal:</span>
                      <span>{formatPKR(selectedOrder.subtotalPaisa)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Delivery Fee:</span>
                      <span>{formatPKR(selectedOrder.deliveryFeePaisa)}</span>
                    </div>
                    <div className="flex justify-between font-extrabold text-sm text-foreground pt-1 border-t">
                      <span>Grand Total:</span>
                      <span className="text-primary">{formatPKR(selectedOrder.totalPaisa)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Address & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl border space-y-1.5">
                  <h5 className="font-bold flex items-center gap-1.5 text-foreground">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    Delivery Destination
                  </h5>
                  <p className="text-muted-foreground">
                    {selectedOrder.deliveryAddress.line1}
                    {selectedOrder.deliveryAddress.line2 ? `, ${selectedOrder.deliveryAddress.line2}` : ''}
                  </p>
                  <p className="text-muted-foreground">
                    {selectedOrder.deliveryAddress.city}, {selectedOrder.deliveryAddress.country}
                  </p>
                  <p className="pt-1 font-semibold text-foreground">
                    Phone: {selectedOrder.phone}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border space-y-1.5">
                  <h5 className="font-bold flex items-center gap-1.5 text-foreground">
                    <FileText className="h-3.5 w-3.5 text-primary" />
                    Customer & Notes
                  </h5>
                  <p className="font-semibold text-foreground">
                    {selectedOrder.customerName || 'Customer'}
                  </p>
                  {selectedOrder.notes ? (
                    <p className="italic text-muted-foreground">"{selectedOrder.notes}"</p>
                  ) : (
                    <p className="text-muted-foreground">No specific notes provided.</p>
                  )}
                </div>
              </div>

              {/* Status History Timeline */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" />
                  Status Audit Log
                </h4>
                <div className="p-3 rounded-xl border bg-muted/20 space-y-2 text-xs">
                  {selectedOrder.statusHistory.map((hist, i) => (
                    <div key={i} className="flex items-start justify-between pb-2 border-b last:border-0 last:pb-0">
                      <div>
                        <span className="font-bold uppercase tracking-wider text-foreground">
                          {hist.to.replace('_', ' ')}
                        </span>
                        {hist.reason && (
                          <p className="text-muted-foreground italic mt-0.5">"{hist.reason}"</p>
                        )}
                        <p className="text-[10px] text-muted-foreground">By {hist.actorName || 'Staff'}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {formatDateTime(hist.at)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Transition Confirmation Dialog (Requires Reason for Cancel / Reject) */}
      <ConfirmDialog
        open={transitionDialogOpen}
        onOpenChange={setTransitionDialogOpen}
        title={`Confirm Order Status: ${transitionTarget?.replace('_', ' ').toUpperCase()}`}
        description={`Are you sure you want to transition this order to "${transitionTarget}"?`}
        confirmText="Confirm Status Update"
        cancelText="Cancel"
        variant={transitionTarget === 'cancelled' || transitionTarget === 'rejected' ? 'destructive' : 'default'}
        requireReason={transitionTarget === 'cancelled' || transitionTarget === 'rejected'}
        reasonLabel="Reason for rejection/cancellation (Required)"
        reasonPlaceholder="e.g. Out of stock, customer requested cancellation"
        isLoading={updateStatusMutation.isPending}
        onConfirm={(reason) =>
          selectedOrder &&
          transitionTarget &&
          updateStatusMutation.mutate({
            orderId: selectedOrder.id,
            status: transitionTarget,
            reason,
          })
        }
      />

      {/* Payment Confirmation Dialog */}
      <ConfirmDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        title="Update Payment Status?"
        description={`Confirm updating payment status to "${paymentTarget?.toUpperCase()}".`}
        confirmText="Update Payment"
        cancelText="Cancel"
        isLoading={updatePaymentMutation.isPending}
        onConfirm={() =>
          selectedOrder &&
          paymentTarget &&
          updatePaymentMutation.mutate({
            orderId: selectedOrder.id,
            status: paymentTarget,
          })
        }
      />

      {/* PRINT-FRIENDLY HIDDEN SECTION (Shown only during window.print) */}
      {selectedOrder && (
        <div className="hidden print:block printable-area text-black p-4 space-y-4">
          <div className="text-center border-b pb-2">
            <h1 className="text-2xl font-black">
              {printType === 'kitchen' ? 'KITCHEN ORDER TICKET' : 'TAX INVOICE / RECEIPT'}
            </h1>
            <p className="text-sm font-bold">{selectedOrder.restaurantName}</p>
            <p className="text-xs">Order: {selectedOrder.orderNumber} • {formatDateTime(selectedOrder.createdAt)}</p>
          </div>

          <div className="text-xs space-y-1">
            <p><strong>Customer:</strong> {selectedOrder.customerName || 'Customer'} ({selectedOrder.phone})</p>
            <p><strong>Address:</strong> {selectedOrder.deliveryAddress.line1}, {selectedOrder.deliveryAddress.city}</p>
            {selectedOrder.notes && <p><strong>Notes:</strong> {selectedOrder.notes}</p>}
          </div>

          <table className="w-full text-xs border-t border-b py-2 text-left">
            <thead>
              <tr className="border-b">
                <th className="py-1">Item</th>
                <th className="py-1 text-center">Qty</th>
                {printType === 'invoice' && <th className="py-1 text-right">Price</th>}
              </tr>
            </thead>
            <tbody>
              {selectedOrder.items.map((it, idx) => (
                <tr key={idx} className="border-b border-zinc-200">
                  <td className="py-1 font-bold">{it.name}</td>
                  <td className="py-1 text-center font-bold">{it.quantity}</td>
                  {printType === 'invoice' && (
                    <td className="py-1 text-right">{formatPKR(it.lineSubtotalPaisa)}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {printType === 'invoice' && (
            <div className="text-xs space-y-1 pt-2 border-t text-right">
              <p>Subtotal: {formatPKR(selectedOrder.subtotalPaisa)}</p>
              <p>Delivery Fee: {formatPKR(selectedOrder.deliveryFeePaisa)}</p>
              <p className="text-sm font-black">Total to Collect (COD): {formatPKR(selectedOrder.totalPaisa)}</p>
            </div>
          )}

          <div className="text-center text-[10px] text-zinc-600 pt-4 border-t">
            <p>Thank you for choosing DineFlow. Helpline: +92 300 0000000</p>
          </div>
        </div>
      )}
    </div>
  );
}
