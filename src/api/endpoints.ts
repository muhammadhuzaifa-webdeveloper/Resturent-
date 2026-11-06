import { apiClient } from './client';
import type {
  ApiResponse,
  User,
  Restaurant,
  Category,
  MenuItem,
  Cart,
  Order,
  PaginatedResult,
  CustomerStats,
  AnalyticsSummary,
  OrderStatus,
  PaymentStatus,
  ApprovalStatus,
  OrderDeliveryAddress,
} from './types';
import type {
  RegisterFormValues,
  LoginFormValues,
  ProfileUpdateFormValues,
} from './schemas';

// AUTH ENDPOINTS
export const authApi = {
  async register(data: RegisterFormValues): Promise<ApiResponse<{ user: User; accessToken?: string }>> {
    const res = await apiClient.post<ApiResponse<{ user: User; accessToken?: string }>>('/api/auth/register', data);
    return res.data;
  },

  async login(data: LoginFormValues): Promise<ApiResponse<{ user: User; accessToken: string }>> {
    const res = await apiClient.post<ApiResponse<{ user: User; accessToken: string }>>('/api/auth/login', data);
    return res.data;
  },

  async logout(): Promise<ApiResponse<null>> {
    const res = await apiClient.post<ApiResponse<null>>('/api/auth/logout');
    return res.data;
  },

  async getMe(): Promise<ApiResponse<User>> {
    const res = await apiClient.get<ApiResponse<User>>('/api/users/me');
    return res.data;
  },

  async updateMe(data: ProfileUpdateFormValues): Promise<ApiResponse<User>> {
    const res = await apiClient.patch<ApiResponse<User>>('/api/users/me', data);
    return res.data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<null>> {
    const res = await apiClient.patch<ApiResponse<null>>('/api/users/change-password', {
      currentPassword,
      newPassword,
    });
    return res.data;
  },
};

// ADMIN & USERS MANAGEMENT ENDPOINTS
export const adminApi = {
  async listAdmins(params?: {
    approvalStatus?: ApprovalStatus;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedResult<User>>> {
    const res = await apiClient.get<ApiResponse<PaginatedResult<User>>>('/api/admin/admins', { params });
    return res.data;
  },

  async approveAdmin(id: string): Promise<ApiResponse<User>> {
    const res = await apiClient.patch<ApiResponse<User>>(`/api/admin/admins/${id}/approve`);
    return res.data;
  },

  async rejectAdmin(id: string, reason?: string): Promise<ApiResponse<User>> {
    const res = await apiClient.patch<ApiResponse<User>>(`/api/admin/admins/${id}/reject`, { reason });
    return res.data;
  },

  async listCustomers(params?: {
    search?: string;
    status?: 'active' | 'blocked';
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedResult<CustomerStats>>> {
    const res = await apiClient.get<ApiResponse<PaginatedResult<CustomerStats>>>('/api/admin/customers', { params });
    return res.data;
  },

  async updateCustomerStatus(
    id: string,
    status: 'active' | 'blocked',
    reason?: string
  ): Promise<ApiResponse<CustomerStats>> {
    const res = await apiClient.patch<ApiResponse<CustomerStats>>(`/api/admin/customers/${id}/status`, {
      status,
      reason,
    });
    return res.data;
  },

  async getAnalyticsOverview(): Promise<ApiResponse<AnalyticsSummary>> {
    const res = await apiClient.get<ApiResponse<AnalyticsSummary>>('/api/admin/analytics/overview');
    return res.data;
  },
};

// RESTAURANTS ENDPOINTS
export const restaurantsApi = {
  async list(params?: {
    search?: string;
    city?: string;
    isActive?: boolean | string;
  }): Promise<ApiResponse<Restaurant[]>> {
    const res = await apiClient.get<ApiResponse<Restaurant[]>>('/api/restaurants', { params });
    return res.data;
  },

  async getById(id: string): Promise<ApiResponse<Restaurant>> {
    const res = await apiClient.get<ApiResponse<Restaurant>>(`/api/restaurants/${id}`);
    return res.data;
  },

  async create(data: Partial<Restaurant>): Promise<ApiResponse<Restaurant>> {
    const res = await apiClient.post<ApiResponse<Restaurant>>('/api/restaurants', data);
    return res.data;
  },

  async update(id: string, data: Partial<Restaurant>): Promise<ApiResponse<Restaurant>> {
    const res = await apiClient.patch<ApiResponse<Restaurant>>(`/api/restaurants/${id}`, data);
    return res.data;
  },
};

// CATEGORIES ENDPOINTS
export const categoriesApi = {
  async listByRestaurant(restaurantId: string): Promise<ApiResponse<Category[]>> {
    const res = await apiClient.get<ApiResponse<Category[]>>(`/api/restaurants/${restaurantId}/categories`);
    return res.data;
  },

  async create(restaurantId: string, data: Partial<Category>): Promise<ApiResponse<Category>> {
    const res = await apiClient.post<ApiResponse<Category>>(`/api/restaurants/${restaurantId}/categories`, data);
    return res.data;
  },

  async update(id: string, data: Partial<Category>): Promise<ApiResponse<Category>> {
    const res = await apiClient.patch<ApiResponse<Category>>(`/api/categories/${id}`, data);
    return res.data;
  },

  async delete(id: string): Promise<ApiResponse<null>> {
    const res = await apiClient.delete<ApiResponse<null>>(`/api/categories/${id}`);
    return res.data;
  },
};

// MENU ITEMS ENDPOINTS
export const menuApi = {
  async listByRestaurant(
    restaurantId: string,
    params?: { categoryId?: string; isAvailable?: boolean | string; search?: string }
  ): Promise<ApiResponse<MenuItem[]>> {
    const res = await apiClient.get<ApiResponse<MenuItem[]>>(`/api/restaurants/${restaurantId}/menu-items`, {
      params,
    });
    return res.data;
  },

  async listAll(params?: { restaurantId?: string; search?: string }): Promise<ApiResponse<MenuItem[]>> {
    const res = await apiClient.get<ApiResponse<MenuItem[]>>('/api/menu-items', { params });
    return res.data;
  },

  async create(restaurantId: string, data: Partial<MenuItem>): Promise<ApiResponse<MenuItem>> {
    const res = await apiClient.post<ApiResponse<MenuItem>>(`/api/restaurants/${restaurantId}/menu-items`, data);
    return res.data;
  },

  async update(id: string, data: Partial<MenuItem>): Promise<ApiResponse<MenuItem>> {
    const res = await apiClient.patch<ApiResponse<MenuItem>>(`/api/menu-items/${id}`, data);
    return res.data;
  },

  async duplicate(id: string): Promise<ApiResponse<MenuItem>> {
    const res = await apiClient.post<ApiResponse<MenuItem>>(`/api/menu-items/${id}/duplicate`);
    return res.data;
  },

  async delete(id: string): Promise<ApiResponse<null>> {
    const res = await apiClient.delete<ApiResponse<null>>(`/api/menu-items/${id}`);
    return res.data;
  },
};

// CART ENDPOINTS
export const cartApi = {
  async get(): Promise<ApiResponse<Cart>> {
    const res = await apiClient.get<ApiResponse<Cart>>('/api/cart');
    return res.data;
  },

  async addItem(
    menuItemId: string,
    quantity: number,
    restaurantId: string,
    forceReset = false
  ): Promise<ApiResponse<Cart>> {
    const res = await apiClient.post<ApiResponse<Cart>>('/api/cart/items', {
      menuItemId,
      quantity,
      restaurantId,
      forceReset,
    });
    return res.data;
  },

  async updateQuantity(menuItemId: string, quantity: number): Promise<ApiResponse<Cart>> {
    const res = await apiClient.patch<ApiResponse<Cart>>(`/api/cart/items/${menuItemId}`, { quantity });
    return res.data;
  },

  async clear(): Promise<ApiResponse<null>> {
    const res = await apiClient.delete<ApiResponse<null>>('/api/cart');
    return res.data;
  },
};

// ORDERS ENDPOINTS
export const ordersApi = {
  async create(data: {
    restaurantId: string;
    items: Array<{ menuItemId: string; quantity: number }>;
    deliveryAddress: OrderDeliveryAddress;
    phone: string;
    notes?: string;
  }): Promise<ApiResponse<Order>> {
    const res = await apiClient.post<ApiResponse<Order>>('/api/orders', data);
    return res.data;
  },

  async list(params?: {
    orderStatus?: OrderStatus;
    paymentStatus?: PaymentStatus;
    restaurantId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedResult<Order>>> {
    const res = await apiClient.get<ApiResponse<PaginatedResult<Order>>>('/api/orders', { params });
    return res.data;
  },

  async listMyOrders(): Promise<ApiResponse<Order[]>> {
    const res = await apiClient.get<ApiResponse<Order[]>>('/api/orders/my-orders');
    return res.data;
  },

  async getById(id: string): Promise<ApiResponse<Order>> {
    const res = await apiClient.get<ApiResponse<Order>>(`/api/orders/${id}`);
    return res.data;
  },

  async updateStatus(id: string, orderStatus: OrderStatus, reason?: string): Promise<ApiResponse<Order>> {
    const res = await apiClient.patch<ApiResponse<Order>>(`/api/orders/${id}/status`, {
      orderStatus,
      reason,
    });
    return res.data;
  },

  async updatePaymentStatus(id: string, paymentStatus: PaymentStatus): Promise<ApiResponse<Order>> {
    const res = await apiClient.patch<ApiResponse<Order>>(`/api/orders/${id}/payment`, { paymentStatus });
    return res.data;
  },

  async cancel(id: string, reason: string): Promise<ApiResponse<Order>> {
    return this.updateStatus(id, 'cancelled', reason);
  },
};
