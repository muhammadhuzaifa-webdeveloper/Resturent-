import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserX,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PageHeader } from '@/components/page-header/PageHeader';
import { ConfirmDialog } from '@/components/confirm-dialog/ConfirmDialog';
import { ApprovalStatusBadge } from '@/components/status-badge/StatusBadge';
import { adminApi } from '@/api/endpoints';
import { useAuthStore } from '@/features/auth/authStore';
import { formatDate, formatDateTime } from '@/lib/date';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/empty-state/EmptyState';
import { AppApiError } from '@/api/client';
import { toast } from 'sonner';
import type { User, ApprovalStatus } from '@/api/types';

export default function AdminApprovalsPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();

  const [activeTab, setActiveTab] = useState<ApprovalStatus>('pending');
  const [selectedAdmin, setSelectedAdmin] = useState<User | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['admins', activeTab],
    queryFn: () => adminApi.listAdmins({ approvalStatus: activeTab, limit: 50 }),
  });

  const admins = data?.data?.items || [];

  // Approve Mutation
  const approveMutation = useMutation({
    mutationFn: (adminId: string) => adminApi.approveAdmin(adminId),
    onSuccess: (res) => {
      toast.success(`${res.data.name} has been approved as an active administrator.`);
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      setApproveDialogOpen(false);
      setSelectedAdmin(null);
    },
    onError: (err) => {
      if (err instanceof AppApiError) {
        if (err.code === 'CANNOT_REVIEW_SELF') {
          toast.error('You cannot approve your own admin account.');
        } else if (err.code === 'ALREADY_REVIEWED') {
          toast.error('This admin account has already been reviewed.');
          refetch();
        } else {
          toast.error(err.message);
        }
      } else {
        toast.error('Failed to approve administrator.');
      }
    },
  });

  // Reject Mutation
  const rejectMutation = useMutation({
    mutationFn: ({ adminId, reason }: { adminId: string; reason?: string }) =>
      adminApi.rejectAdmin(adminId, reason),
    onSuccess: (res) => {
      toast.success(`Admin registration for ${res.data.name} has been rejected.`);
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      setRejectDialogOpen(false);
      setSelectedAdmin(null);
    },
    onError: (err) => {
      if (err instanceof AppApiError) {
        if (err.code === 'CANNOT_REVIEW_SELF') {
          toast.error('You cannot reject your own admin account.');
        } else if (err.code === 'ALREADY_REVIEWED') {
          toast.error('This admin account is already in this status.');
          refetch();
        } else {
          toast.error(err.message);
        }
      } else {
        toast.error('Failed to reject administrator.');
      }
    },
  });

  const handleOpenApprove = (admin: User) => {
    setSelectedAdmin(admin);
    setApproveDialogOpen(true);
  };

  const handleOpenReject = (admin: User) => {
    setSelectedAdmin(admin);
    setRejectDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Staff Approvals"
        description="Review incoming staff registration requests, grant administrative permissions, or revoke access"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Staff Approvals' },
        ]}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          <RefreshCw className={`mr-2 h-3.5 w-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </PageHeader>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(val: any) => setActiveTab(val)}
        className="space-y-4"
      >
        <TabsList className="grid grid-cols-3 max-w-md">
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-3.5 w-3.5" />
            Pending Review
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <UserCheck className="h-3.5 w-3.5" />
            Approved
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            <UserX className="h-3.5 w-3.5" />
            Rejected
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full caption-bottom text-sm text-left">
                <thead className="bg-muted/60 border-b">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                      Staff Member
                    </th>
                    <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                      Contact Info
                    </th>
                    <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                      Registration Date
                    </th>
                    <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                      Status
                    </th>
                    {activeTab === 'rejected' && (
                      <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                        Rejection Reason
                      </th>
                    )}
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
                        <td className="px-4 py-3.5"><Skeleton className="h-5 w-24" /></td>
                        <td className="px-4 py-3.5"><Skeleton className="h-5 w-20" /></td>
                        <td className="px-4 py-3.5 text-right"><Skeleton className="h-8 w-24 ml-auto" /></td>
                      </tr>
                    ))
                  ) : admins.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="h-48 text-center p-4">
                        <EmptyState
                          icon={ShieldCheck}
                          title={`No ${activeTab} admins`}
                          description={`There are currently no administrator accounts with ${activeTab} status.`}
                        />
                      </td>
                    </tr>
                  ) : (
                    admins.map((admin) => {
                      const isSelf = admin.id === currentUser?.id;

                      return (
                        <tr key={admin.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3.5 font-medium text-foreground">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                {admin.name.charAt(0)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span>{admin.name}</span>
                                  {isSelf && (
                                    <span className="text-[10px] bg-primary/20 text-primary font-bold px-1.5 py-0.2 rounded">
                                      You
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  ID: {admin.id}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3.5 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Mail className="h-3 w-3" />
                              <span>{admin.email}</span>
                            </div>
                            {admin.phone && (
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <Phone className="h-3 w-3" />
                                <span>{admin.phone}</span>
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-3.5 text-xs text-muted-foreground">
                            {formatDateTime(admin.createdAt)}
                          </td>

                          <td className="px-4 py-3.5">
                            <ApprovalStatusBadge status={admin.approvalStatus} />
                          </td>

                          {activeTab === 'rejected' && (
                            <td className="px-4 py-3.5 text-xs text-rose-600 dark:text-rose-400 max-w-xs">
                              {admin.rejectionReason || 'No reason specified'}
                            </td>
                          )}

                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {admin.approvalStatus !== 'approved' && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleOpenApprove(admin)}
                                  disabled={isSelf}
                                  title={isSelf ? 'You cannot review your own account' : 'Approve Admin'}
                                  className="h-8 text-xs font-semibold"
                                >
                                  <UserCheck className="mr-1.5 h-3.5 w-3.5" />
                                  Approve
                                </Button>
                              )}

                              {admin.approvalStatus !== 'rejected' && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleOpenReject(admin)}
                                  disabled={isSelf}
                                  title={isSelf ? 'You cannot review your own account' : 'Reject Admin'}
                                  className="h-8 text-xs font-semibold"
                                >
                                  <UserX className="mr-1.5 h-3.5 w-3.5" />
                                  Reject
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Approve Confirmation Dialog */}
      <ConfirmDialog
        open={approveDialogOpen}
        onOpenChange={setApproveDialogOpen}
        title="Approve Administrator?"
        description={`Are you sure you want to approve "${selectedAdmin?.name}" (${selectedAdmin?.email})? They will immediately receive full administrative dashboard access.`}
        confirmText="Confirm Approval"
        cancelText="Cancel"
        variant="default"
        isLoading={approveMutation.isPending}
        onConfirm={() => selectedAdmin && approveMutation.mutate(selectedAdmin.id)}
      />

      {/* Reject Confirmation Dialog */}
      <ConfirmDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        title="Reject Administrator?"
        description={`Rejecting "${selectedAdmin?.name}" will decline their registration. If they are already signed in, their session tokens will immediately be terminated.`}
        confirmText="Confirm Rejection"
        cancelText="Cancel"
        variant="destructive"
        requireReason={true}
        reasonPlaceholder="e.g. Employee no longer with restaurant, duplicate submission"
        reasonLabel="Reason for rejection (Optional)"
        isLoading={rejectMutation.isPending}
        onConfirm={(reason) =>
          selectedAdmin &&
          rejectMutation.mutate({ adminId: selectedAdmin.id, reason })
        }
      />
    </div>
  );
}
