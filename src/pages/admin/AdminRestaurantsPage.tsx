import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Store,
  Plus,
  Edit,
  Clock,
  MapPin,
  Phone,
  Copy,
  Check,
  Bike,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  DialogFooter,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/page-header/PageHeader';
import { restaurantFormSchema, type RestaurantFormValues } from '@/api/schemas';
import { restaurantsApi } from '@/api/endpoints';
import { formatPKR, paisaToRupees, rupeesToPaisa } from '@/lib/formatPKR';
import { DAYS_OF_WEEK } from '@/lib/constants';
import { isRestaurantOpen } from '@/lib/date';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/empty-state/EmptyState';
import { toast } from 'sonner';
import type { Restaurant } from '@/api/types';

export default function AdminRestaurantsPage() {
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-restaurants'],
    queryFn: () => restaurantsApi.list(),
  });

  const restaurants = data?.data || [];

  const defaultHours = DAYS_OF_WEEK.map((d) => ({
    dayOfWeek: d.day,
    opensAt: '11:00',
    closesAt: '23:59',
    isClosed: false,
  }));

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RestaurantFormValues>({
    resolver: zodResolver(restaurantFormSchema),
    defaultValues: {
      name: '',
      description: '',
      phone: '',
      email: '',
      address: {
        line1: '',
        line2: '',
        city: 'Karachi',
        postalCode: '',
        country: 'Pakistan',
      },
      deliveryFeeRupees: 150,
      imageUrl: '',
      timeZone: 'Asia/Karachi',
      isActive: true,
      openingHours: defaultHours,
    },
  });

  const { fields } = useFieldArray({
    control,
    name: 'openingHours',
  });

  const watchHours = watch('openingHours');

  // Copy Monday (index 1) or first day hours to all days
  const handleCopyToAllDays = () => {
    const source = watchHours[0];
    if (!source) return;
    const copied = watchHours.map((h) => ({
      ...h,
      opensAt: source.opensAt,
      closesAt: source.closesAt,
      isClosed: source.isClosed,
    }));
    setValue('openingHours', copied);
    toast.info('Copied schedule across all 7 days');
  };

  const saveMutation = useMutation({
    mutationFn: (values: RestaurantFormValues) => {
      const payload: Partial<Restaurant> = {
        name: values.name,
        description: values.description || undefined,
        phone: values.phone || undefined,
        email: values.email || undefined,
        address: values.address,
        deliveryFeePaisa: rupeesToPaisa(values.deliveryFeeRupees),
        image: values.imageUrl ? { url: values.imageUrl } : undefined,
        timeZone: values.timeZone,
        isActive: values.isActive,
        openingHours: values.openingHours,
      };

      if (editingRestaurant) {
        return restaurantsApi.update(editingRestaurant.id, payload);
      } else {
        return restaurantsApi.create(payload);
      }
    },
    onSuccess: () => {
      toast.success(editingRestaurant ? 'Restaurant updated' : 'Restaurant created');
      queryClient.invalidateQueries({ queryKey: ['admin-restaurants'] });
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
      setModalOpen(false);
      reset();
      setEditingRestaurant(null);
    },
    onError: () => toast.error('Failed to save restaurant details'),
  });

  const handleOpenModal = (r?: Restaurant) => {
    if (r) {
      setEditingRestaurant(r);
      reset({
        name: r.name,
        description: r.description || '',
        phone: r.phone || '',
        email: r.email || '',
        address: {
          line1: r.address.line1,
          line2: r.address.line2 || '',
          city: r.address.city,
          postalCode: r.address.postalCode || '',
          country: r.address.country || 'Pakistan',
        },
        deliveryFeeRupees: paisaToRupees(r.deliveryFeePaisa),
        imageUrl: r.image?.url || '',
        timeZone: r.timeZone || 'Asia/Karachi',
        isActive: r.isActive,
        openingHours: r.openingHours?.length ? r.openingHours : defaultHours,
      });
    } else {
      setEditingRestaurant(null);
      reset({
        name: '',
        description: '',
        phone: '',
        email: '',
        address: {
          line1: '',
          line2: '',
          city: 'Karachi',
          postalCode: '',
          country: 'Pakistan',
        },
        deliveryFeeRupees: 150,
        imageUrl: '',
        timeZone: 'Asia/Karachi',
        isActive: true,
        openingHours: defaultHours,
      });
    }
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Restaurant Management"
        description="Register branches, configure delivery rates, manage operating hours, and set localized timezones"
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Restaurants' }]}
      >
        <Button onClick={() => handleOpenModal()} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add Restaurant
        </Button>
      </PageHeader>

      {/* Restaurants Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full caption-bottom text-sm text-left">
            <thead className="bg-muted/60 border-b">
              <tr>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Restaurant
                </th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  City & Location
                </th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Delivery Fee
                </th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Live Status
                </th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Active
                </th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3.5"><Skeleton className="h-5 w-36" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-5 w-28" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-5 w-20" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-5 w-16" /></td>
                    <td className="px-4 py-3.5 text-right"><Skeleton className="h-8 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : restaurants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="h-36 text-center p-4">
                    <EmptyState
                      icon={Store}
                      title="No restaurants found"
                      description="Click 'Add Restaurant' to onboard your first eatery."
                      actionText="Add Restaurant"
                      onAction={() => handleOpenModal()}
                    />
                  </td>
                </tr>
              ) : (
                restaurants.map((rest) => {
                  const { isOpen, nextTimeText } = isRestaurantOpen(
                    rest.openingHours,
                    rest.timeZone
                  );

                  return (
                    <tr key={rest.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          {rest.image?.url ? (
                            <img
                              src={rest.image.url}
                              alt={rest.name}
                              className="h-10 w-10 rounded-lg object-cover bg-muted shrink-0"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              <Store className="h-5 w-5" />
                            </div>
                          )}
                          <div>
                            <h4 className="font-semibold text-sm text-foreground">
                              {rest.name}
                            </h4>
                            <p className="text-[11px] text-muted-foreground line-clamp-1 max-w-xs">
                              {rest.description}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1 font-medium text-foreground">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                          <span>{rest.address.city}</span>
                        </div>
                        <p className="text-[11px] truncate max-w-xs">{rest.address.line1}</p>
                      </td>

                      <td className="px-4 py-3.5 font-bold text-xs text-foreground">
                        {formatPKR(rest.deliveryFeePaisa)}
                      </td>

                      <td className="px-4 py-3.5">
                        <Badge
                          variant={isOpen ? 'default' : 'secondary'}
                          className={`text-[10px] ${
                            isOpen ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {isOpen ? 'Open Now' : 'Closed'}
                        </Badge>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{nextTimeText}</p>
                      </td>

                      <td className="px-4 py-3.5">
                        <Badge variant={rest.isActive ? 'default' : 'secondary'} className="text-[10px]">
                          {rest.isActive ? 'Active' : 'Disabled'}
                        </Badge>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenModal(rest)}
                          className="h-8 text-xs font-semibold"
                        >
                          <Edit className="mr-1.5 h-3.5 w-3.5" />
                          Edit
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

      {/* CREATE / EDIT RESTAURANT DIALOG WITH OPENING HOURS */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRestaurant ? 'Edit Restaurant' : 'Register New Restaurant'}
            </DialogTitle>
            <DialogDescription>
              Provide restaurant address, default delivery fee in PKR, and weekly opening hours schedule.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="rest-name">Restaurant Name</Label>
              <Input
                id="rest-name"
                placeholder="e.g. Karachi Biryani & Grill House"
                {...register('name')}
                error={!!errors.name}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rest-desc">Description</Label>
              <Textarea
                id="rest-desc"
                placeholder="Brief summary of cuisine specialties..."
                {...register('description')}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="rest-phone">Phone</Label>
                <Input
                  id="rest-phone"
                  placeholder="+92 300 1234567"
                  {...register('phone')}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rest-email">Email</Label>
                <Input
                  id="rest-email"
                  type="email"
                  placeholder="contact@restaurant.pk"
                  {...register('email')}
                />
              </div>
            </div>

            {/* Address fields */}
            <div className="p-3 border rounded-xl space-y-3 bg-muted/20">
              <h5 className="font-bold text-xs flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                Physical Address
              </h5>
              <div className="space-y-1.5">
                <Label htmlFor="addr-line1">Line 1</Label>
                <Input
                  id="addr-line1"
                  placeholder="Street / Commercial Plot"
                  {...register('address.line1')}
                  error={!!errors.address?.line1}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="addr-city">City</Label>
                  <Input
                    id="addr-city"
                    placeholder="e.g. Karachi"
                    {...register('address.city')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="addr-country">Country</Label>
                  <Input
                    id="addr-country"
                    defaultValue="Pakistan"
                    {...register('address.country')}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="rest-fee">Delivery Fee (PKR)</Label>
                <Input
                  id="rest-fee"
                  type="number"
                  placeholder="150"
                  {...register('deliveryFeeRupees')}
                  error={!!errors.deliveryFeeRupees}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rest-tz">Time Zone</Label>
                <Select
                  value={watch('timeZone')}
                  onValueChange={(val) => setValue('timeZone', val)}
                >
                  <SelectTrigger id="rest-tz">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Karachi">Asia/Karachi (PKT)</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rest-image">Banner Image URL</Label>
              <Input
                id="rest-image"
                placeholder="https://images.unsplash.com/..."
                {...register('imageUrl')}
              />
            </div>

            {/* OPENING HOURS 7 ROWS EDITOR */}
            <div className="p-3.5 border rounded-xl space-y-3 bg-muted/20">
              <div className="flex items-center justify-between pb-1 border-b">
                <div>
                  <h5 className="font-bold text-xs flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    Weekly Operating Hours (7 Days)
                  </h5>
                  <p className="text-[11px] text-muted-foreground">
                    Define opening and closing times per weekday
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyToAllDays}
                  className="h-7 text-[11px]"
                >
                  <Copy className="mr-1 h-3 w-3" />
                  Copy to All Days
                </Button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {fields.map((field, index) => {
                  const dayName = DAYS_OF_WEEK.find((d) => d.day === field.dayOfWeek)?.label || `Day ${field.dayOfWeek}`;
                  const isClosed = watchHours[index]?.isClosed;

                  return (
                    <div
                      key={field.id}
                      className="flex items-center justify-between gap-3 text-xs p-1.5 bg-background rounded-lg border"
                    >
                      <span className="font-bold w-24">{dayName}</span>

                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          disabled={isClosed}
                          className="h-8 w-24 text-xs"
                          {...register(`openingHours.${index}.opensAt` as const)}
                        />
                        <span className="text-muted-foreground">to</span>
                        <Input
                          type="time"
                          disabled={isClosed}
                          className="h-8 w-24 text-xs"
                          {...register(`openingHours.${index}.closesAt` as const)}
                        />
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Switch
                          checked={!isClosed}
                          onCheckedChange={(checked) =>
                            setValue(`openingHours.${index}.isClosed` as const, !checked)
                          }
                          aria-label={`Open status for ${dayName}`}
                        />
                        <span className="text-[10px] w-12 text-muted-foreground">
                          {!isClosed ? 'Open' : 'Closed'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-xl">
              <div>
                <Label className="font-semibold text-sm">Active Restaurant</Label>
                <p className="text-xs text-muted-foreground">
                  Allow customers to see and place food orders from this restaurant
                </p>
              </div>
              <Switch
                checked={watch('isActive')}
                onCheckedChange={(checked) => setValue('isActive', checked)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingRestaurant ? 'Save Changes' : 'Create Restaurant'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
