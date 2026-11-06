import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Search,
  Filter,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  Eye,
  ShieldAlert,
  ShoppingBag,
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
import { PageHeader } from '@/components/page-header/PageHeader';
import { ConfirmDialog } from '@/components/confirm-dialog/ConfirmDialog';
import { adminApi } from '@/api/endpoints';
import { formatPKR } from '@/lib/formatPKR';
import { formatDate } from '@/lib/date';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/empty-state/EmptyState';
import { toast } from 'sonner';
import type { CustomerStats } from '@/api/types';

export default function AdminCustomersPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [selectedCustomer, setSelectedCustomer] = useState<CustomerStats | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockActionTarget, setBlockActionTarget] = useState<'active' | 'blocked'>('blocked');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-customers', search, statusFilter, page],
    queryFn: () =>
      adminApi.listCustomers({
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page,
        limit: pageSize,
      }),
  });

  const customers = data?.data?.items || [];
  const total = data?.data?.total || 0;
  const totalPages = Math.ceil(total / pageSize) || 1;

  // Block / Unblock Mutation
  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: 'active' | 'blocked';
      reason?: string;
    }) => adminApi.updateCustomerStatus(id, status, reason),
    onSuccess: (res) => {
      toast.success(
        `Customer ${res.data.status === 'blocked' ? 'blocked' : 'unblocked'} successfully`
      );
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
      setBlockDialogOpen(false);
      if (selectedCustomer?.id === res.data.id) {
        setSelectedCustomer(res.data);
      }
    },
    onError: () => toast.error('Failed to change customer account status'),
  });

  const handleOpenBlockDialog = (customer: CustomerStats, nextStatus: 'active' | 'blocked') => {
    setSelectedCustomer(customer);
    setBlockActionTarget(nextStatus);
    setBlockDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Directory"
        description="Inspect customer profiles, lifetime spending values, order histories, and manage fraud blocks"
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Customers' }]}
      />

      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-2xl border bg-card shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9 h-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={(val: any) => {
              setStatusFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[150px] h-9 text-xs">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="blocked">Blocked Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full caption-bottom text-sm text-left">
            <thead className="bg-muted/60 border-b">
              <tr>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Customer
                </th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Contact
                </th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Orders
                </th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Lifetime Value (LTV)
                </th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Joined Date
                </th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3.5"><Skeleton className="h-5 w-32" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-5 w-40" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-5 w-12" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-5 w-20" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-5 w-16" /></td>
                    <td className="px-4 py-3.5 text-right"><Skeleton className="h-8 w-20 ml-auto" /></td>
                  </tr>
                ))
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="h-36 text-center p-4">
                    <EmptyState
                      icon={Users}
                      title="No customers found"
                      description="No customer accounts match your current query."
                    />
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3.5 font-semibold text-foreground text-sm">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {c.name.charAt(0)}
                        </div>
                        <span>{c.name}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-xs text-muted-foreground">
                      <p className="flex items-center gap-1.5">
                        <Mail className="h-3 w-3" />
                        {c.email}
                      </p>
                      {c.phone && (
                        <p className="flex items-center gap-1.5 mt-0.5">
                          <Phone className="h-3 w-3" />
                          {c.phone}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-3.5 font-bold text-xs">
                      {c.ordersCount} orders
                    </td>

                    <td className="px-4 py-3.5 font-black text-xs text-primary">
                      {formatPKR(c.totalSpentPaisa)}
                    </td>

                    <td className="px-4 py-3.5 text-xs text-muted-foreground">
                      {formatDate(c.joinedDate)}
                    </td>

                    <td className="px-4 py-3.5">
                      <Badge
                        variant={c.status === 'active' ? 'default' : 'destructive'}
                        className="text-[10px]"
                      >
                        {c.status === 'active' ? 'Active' : 'Blocked'}
                      </Badge>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedCustomer(c);
                            setDetailModalOpen(true);
                          }}
                          className="h-8 text-xs font-semibold"
                        >
                          <Eye className="mr-1 h-3.5 w-3.5" />
                          Details
                        </Button>

                        {c.status === 'active' ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleOpenBlockDialog(c, 'blocked')}
                            className="h-8 text-xs font-semibold"
                          >
                            Block
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenBlockDialog(c, 'active')}
                            className="h-8 text-xs font-semibold text-emerald-600 border-emerald-600/40 hover:bg-emerald-50"
                          >
                            Unblock
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CUSTOMER DETAIL MODAL */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-md">
          {selectedCustomer && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                    {selectedCustomer.name.charAt(0)}
                  </div>
                  <span>{selectedCustomer.name}</span>
                </DialogTitle>
                <DialogDescription>
                  Customer ID: {selectedCustomer.id}
                </DialogDescription>
              </DialogHeader>

              <div className="p-4 rounded-xl border bg-muted/30 space-y-3 text-xs">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground">Account Status:</span>
                  <Badge
                    variant={selectedCustomer.status === 'active' ? 'default' : 'destructive'}
                  >
                    {selectedCustomer.status === 'active' ? 'Active Account' : 'Blocked from Ordering'}
                  </Badge>
                </div>

                {selectedCustomer.blockReason && (
                  <div className="p-2 rounded bg-destructive/10 text-destructive text-[11px]">
                    <strong>Block Reason:</strong> {selectedCustomer.blockReason}
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-semibold text-foreground">{selectedCustomer.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-semibold text-foreground">{selectedCustomer.phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Member Since:</span>
                  <span className="text-foreground">{formatDate(selectedCustomer.joinedDate)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-muted-foreground">Total Orders Placed:</span>
                  <span className="font-bold text-foreground">{selectedCustomer.ordersCount}</span>
                </div>
                <div className="flex justify-between font-extrabold text-sm pt-1 border-t">
                  <span>Lifetime Spend (LTV):</span>
                  <span className="text-primary">{formatPKR(selectedCustomer.totalSpentPaisa)}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDetailModalOpen(false)}>
                  Close
                </Button>
                {selectedCustomer.status === 'active' ? (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setDetailModalOpen(false);
                      handleOpenBlockDialog(selectedCustomer, 'blocked');
                    }}
                  >
                    Block Customer
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      setDetailModalOpen(false);
                      handleOpenBlockDialog(selectedCustomer, 'active');
                    }}
                  >
                    Unblock Customer
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Block / Unblock Confirmation Dialog */}
      <ConfirmDialog
        open={blockDialogOpen}
        onOpenChange={setBlockDialogOpen}
        title={blockActionTarget === 'blocked' ? 'Block Customer?' : 'Unblock Customer?'}
        description={
          blockActionTarget === 'blocked'
            ? `Are you sure you want to block "${selectedCustomer?.name}"? They will not be able to place any future orders.`
            : `Confirm unblocking "${selectedCustomer?.name}". Their account ordering privileges will be restored.`
        }
        confirmText={blockActionTarget === 'blocked' ? 'Confirm Block' : 'Confirm Unblock'}
        cancelText="Cancel"
        variant={blockActionTarget === 'blocked' ? 'destructive' : 'default'}
        requireReason={blockActionTarget === 'blocked'}
        reasonLabel="Reason for blocking customer (Required)"
        reasonPlaceholder="e.g. Repeated cancellation at doorstep, fraudulent phone number"
        isLoading={statusMutation.isPending}
        onConfirm={(reason) =>
          selectedCustomer &&
          statusMutation.mutate({
            id: selectedCustomer.id,
            status: blockActionTarget,
            reason,
          })
        }
      />
    </div>
  );
}
