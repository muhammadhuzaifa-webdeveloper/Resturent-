import type { OrderStatus, PaymentStatus, ApprovalStatus, UserRole } from '@/lib/constants';
import type { OpeningHourItem } from '@/lib/date';

export type { OrderStatus, PaymentStatus, ApprovalStatus, UserRole, OpeningHourItem };

export interface ApiResponse<T> {
  success: true;
  message?: string;
  data: T;
}

export interface ApiErrorDetail {
  field: string;
  message: string;
}

export interface ApiErrorItem {
  code: string;
  message?: string;
  details?: ApiErrorDetail[];
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: ApiErrorItem[];
  requestId?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: 'active' | 'blocked';
  approvalStatus: ApprovalStatus;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  createdAt?: string;
}

export interface RestaurantAddress {
  line1: string;
  line2?: string;
  city: string;
  postalCode?: string;
  country: string;
}

export interface ImageObject {
  provider?: string;
  assetId?: string;
  url?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  description?: string;
  ownerUserId?: string;
  phone?: string;
  email?: string;
  address: RestaurantAddress;
  deliveryFeePaisa: number;
  image?: ImageObject;
  openingHours: OpeningHourItem[];
  timeZone: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  image?: ImageObject;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description?: string;
  pricePaisa: number;
  discountPricePaisa?: number;
  image?: ImageObject;
  ingredients: string[];
  isAvailable: boolean;
  preparationTimeMinutes?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  menuItemId: string;
  menuItem?: MenuItem;
  quantity: number;
}

export interface Cart {
  id: string;
  userId: string;
  restaurantId: string | null;
  items: CartItem[];
  restaurant?: Restaurant;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  menuItemId: string | null;
  name: string;
  unitPricePaisa: number;
  quantity: number;
  lineSubtotalPaisa: number;
}

export interface OrderDeliveryAddress {
  line1: string;
  line2?: string;
  city: string;
  postalCode?: string;
  country: string;
}

export interface OrderStatusHistory {
  from?: OrderStatus;
  to: OrderStatus;
  actorUserId: string;
  actorName?: string;
  at: string;
  reason?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  customerName?: string;
  customerEmail?: string;
  restaurantId: string;
  restaurantName?: string;
  items: OrderItem[];
  deliveryAddress: OrderDeliveryAddress;
  phone: string;
  subtotalPaisa: number;
  deliveryFeePaisa: number;
  discountPaisa: number;
  totalPaisa: number;
  currency: 'PKR';
  paymentMethod: 'cash';
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  notes?: string;
  cancelledAt?: string;
  statusHistory: OrderStatusHistory[];
  createdAt: string;
  updatedAt?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminApprovalFilter {
  approvalStatus?: ApprovalStatus;
  page?: number;
  limit?: number;
}

export interface CustomerStats {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'active' | 'blocked';
  blockReason?: string;
  ordersCount: number;
  totalSpentPaisa: number;
  joinedDate: string;
  lastOrderDate?: string;
}

export interface AnalyticsSummary {
  todayRevenuePaisa: number;
  todayRevenueTrend: number; // percentage +/-
  totalOrders: number;
  totalOrdersTrend: number;
  pendingOrders: number;
  pendingOrdersTrend: number;
  activeCustomers: number;
  activeCustomersTrend: number;
  averageOrderValuePaisa: number;
  averageOrderValueTrend: number;
  cancellationRate: number; // percentage
  cancellationRateTrend: number;
  pendingAdminApprovalsCount: number;
}

export interface RevenueDataPoint {
  date: string;
  revenuePaisa: number;
  orders: number;
}

export interface TopSellingItem {
  id: string;
  name: string;
  categoryName: string;
  ordersCount: number;
  revenuePaisa: number;
}

export interface OrdersByHourPoint {
  hour: string; // e.g. "12 PM"
  orders: number;
}

export interface NewCustomersDataPoint {
  week: string;
  count: number;
}
