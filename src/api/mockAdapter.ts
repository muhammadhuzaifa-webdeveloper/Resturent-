import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import {
  INITIAL_RESTAURANTS,
  INITIAL_CATEGORIES,
  INITIAL_MENU_ITEMS,
  INITIAL_ORDERS,
  INITIAL_CUSTOMERS,
  INITIAL_ADMINS,
} from './mockData';
import type {
  Restaurant,
  Category,
  MenuItem,
  Order,
  User,
  CustomerStats,
  OrderStatus,
  PaymentStatus,
  ApprovalStatus,
} from './types';
import { ALLOWED_ORDER_TRANSITIONS } from '@/lib/constants';

class MockDatabase {
  restaurants: Restaurant[];
  categories: Category[];
  menuItems: MenuItem[];
  orders: Order[];
  customers: CustomerStats[];
  admins: User[];
  currentCart: {
    restaurantId: string | null;
    items: Array<{ menuItemId: string; quantity: number }>;
  };

  constructor() {
    this.restaurants = this.load('mock_restaurants', INITIAL_RESTAURANTS);
    this.categories = this.load('mock_categories', INITIAL_CATEGORIES);
    this.menuItems = this.load('mock_menu_items', INITIAL_MENU_ITEMS);
    this.orders = this.load('mock_orders', INITIAL_ORDERS);
    this.customers = this.load('mock_customers', INITIAL_CUSTOMERS);
    this.admins = this.load('mock_admins', INITIAL_ADMINS);
    this.currentCart = this.load('mock_cart', { restaurantId: null, items: [] });
  }

  private load<T>(key: string, fallback: T): T {
    try {
      const saved = localStorage.getItem(`dineflow_${key}`);
      return saved ? JSON.parse(saved) : fallback;
    } catch {
      return fallback;
    }
  }

  private save<T>(key: string, data: T): void {
    try {
      localStorage.setItem(`dineflow_${key}`, JSON.stringify(data));
    } catch {
      // storage quota or incognito
    }
  }

  persist(): void {
    this.save('mock_restaurants', this.restaurants);
    this.save('mock_categories', this.categories);
    this.save('mock_menu_items', this.menuItems);
    this.save('mock_orders', this.orders);
    this.save('mock_customers', this.customers);
    this.save('mock_admins', this.admins);
    this.save('mock_cart', this.currentCart);
  }
}

export const mockDb = new MockDatabase();

// Simulates network latency
const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

function createSuccessResponse<T>(data: T, message?: string, status = 200): AxiosResponse {
  return {
    data: {
      success: true,
      message,
      data,
    },
    status,
    statusText: 'OK',
    headers: {},
    config: {} as InternalAxiosRequestConfig,
  };
}

function createErrorResponse(
  status: number,
  code: string,
  message: string,
  details?: Array<{ field: string; message: string }>
): Promise<never> {
  const errorObj = {
    response: {
      status,
      data: {
        success: false,
        message,
        errors: [{ code, message, details }],
        requestId: `req_${Math.random().toString(36).substring(2, 9)}`,
      },
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    },
  };
  return Promise.reject(errorObj);
}

/**
 * Custom mock adapter handler for Axios
 */
export async function handleMockRequest(
  config: InternalAxiosRequestConfig
): Promise<AxiosResponse> {
  await delay();

  const url = config.url || '';
  const method = (config.method || 'get').toLowerCase();
  const body = typeof config.data === 'string' ? JSON.parse(config.data || '{}') : config.data || {};
  const query = config.params || {};

  // Extract auth user from token if present
  let authUserId = 'user-admin-1';
  let authUserRole = 'admin';
  const authHeader = config.headers?.Authorization as string | undefined;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const rawToken = authHeader.replace('Bearer ', '');
    try {
      const decoded = JSON.parse(atob(rawToken));
      authUserId = decoded.id;
      authUserRole = decoded.role;
    } catch {
      // default mock user
    }
  }

  // --- HEALTH CHECK ---
  if (url === '/health/live' || url === '/health/ready') {
    return createSuccessResponse({ status: 'ready', database: 'connected' });
  }

  // --- AUTH / REGISTER ---
  if (method === 'post' && url === '/api/auth/register') {
    const { name, email, role, phone } = body;
    const existing = mockDb.admins.find((a) => a.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return createErrorResponse(409, 'EMAIL_ALREADY_EXISTS', 'An account with this email already exists.');
    }

    if (role === 'admin') {
      const newAdmin: User = {
        id: `admin-${Date.now()}`,
        name,
        email,
        phone: phone || '',
        role: 'admin',
        status: 'active',
        approvalStatus: 'pending',
        approvedBy: null,
        approvedAt: null,
        createdAt: new Date().toISOString(),
      };
      mockDb.admins.push(newAdmin);
      mockDb.persist();
      return createSuccessResponse(
        { user: newAdmin },
        'Admin registration submitted. Awaiting approval from existing admin.'
      );
    } else {
      const newClient: User = {
        id: `client-${Date.now()}`,
        name,
        email,
        phone: phone || '',
        role: 'client',
        status: 'active',
        approvalStatus: 'approved',
        createdAt: new Date().toISOString(),
      };
      const token = btoa(JSON.stringify({ id: newClient.id, role: newClient.role }));
      return createSuccessResponse({ user: newClient, accessToken: token }, 'Registration successful');
    }
  }

  // --- AUTH / LOGIN ---
  if (method === 'post' && url === '/api/auth/login') {
    const { email, password } = body;
    if (!password) {
      return createErrorResponse(400, 'INVALID_CREDENTIALS', 'Invalid credentials');
    }

    const adminUser = mockDb.admins.find((a) => a.email.toLowerCase() === email.toLowerCase());
    if (adminUser) {
      if (adminUser.approvalStatus === 'pending') {
        return createErrorResponse(403, 'ADMIN_PENDING_APPROVAL', 'Your admin account is awaiting approval.');
      }
      if (adminUser.approvalStatus === 'rejected') {
        return createErrorResponse(403, 'ADMIN_REJECTED', 'Your admin account was rejected.');
      }
      const token = btoa(JSON.stringify({ id: adminUser.id, role: adminUser.role }));
      return createSuccessResponse({ user: adminUser, accessToken: token }, 'Login successful');
    }

    // Check if client
    const clientUser = mockDb.customers.find((c) => c.email.toLowerCase() === email.toLowerCase());
    if (clientUser) {
      if (clientUser.status === 'blocked') {
        return createErrorResponse(403, 'FORBIDDEN', 'Your account has been blocked. Contact support.');
      }
      const user: User = {
        id: clientUser.id,
        name: clientUser.name,
        email: clientUser.email,
        phone: clientUser.phone,
        role: 'client',
        status: clientUser.status,
        approvalStatus: 'approved',
        createdAt: clientUser.joinedDate,
      };
      const token = btoa(JSON.stringify({ id: user.id, role: user.role }));
      return createSuccessResponse({ user, accessToken: token }, 'Login successful');
    }

    // Default mock login fallback: if logging in with any other email
    const fallbackUser: User = {
      id: `client-demo`,
      name: email.split('@')[0],
      email: email,
      phone: '+92 300 1234567',
      role: email.includes('admin') ? 'admin' : 'client',
      status: 'active',
      approvalStatus: 'approved',
      createdAt: new Date().toISOString(),
    };
    const token = btoa(JSON.stringify({ id: fallbackUser.id, role: fallbackUser.role }));
    return createSuccessResponse({ user: fallbackUser, accessToken: token }, 'Login successful');
  }

  // --- AUTH / LOGOUT ---
  if (method === 'post' && url === '/api/auth/logout') {
    return createSuccessResponse(null, 'Logged out successfully');
  }

  // --- USERS / ME ---
  if (url === '/api/users/me') {
    if (method === 'get') {
      const user =
        mockDb.admins.find((a) => a.id === authUserId) ||
        mockDb.admins[0];
      return createSuccessResponse(user);
    }
    if (method === 'patch') {
      const user = mockDb.admins.find((a) => a.id === authUserId) || mockDb.admins[0];
      if (body.name) user.name = body.name;
      if (body.phone !== undefined) user.phone = body.phone;
      mockDb.persist();
      return createSuccessResponse(user, 'Profile updated successfully');
    }
  }

  // --- USERS / CHANGE-PASSWORD ---
  if (method === 'patch' && url === '/api/users/change-password') {
    return createSuccessResponse(null, 'Password changed successfully. All sessions signed out.');
  }

  // --- ADMIN APPROVALS ---
  if (method === 'get' && url === '/api/admin/admins') {
    const { approvalStatus, page = 1, limit = 10 } = query;
    let list = [...mockDb.admins];
    if (approvalStatus) {
      list = list.filter((a) => a.approvalStatus === approvalStatus);
    }
    const total = list.length;
    const startIndex = (Number(page) - 1) * Number(limit);
    const items = list.slice(startIndex, startIndex + Number(limit));
    return createSuccessResponse({
      items,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    });
  }

  if (method === 'patch' && url.match(/^\/api\/admin\/admins\/([^/]+)\/approve$/)) {
    const targetId = url.split('/')[4];
    if (targetId === authUserId) {
      return createErrorResponse(403, 'CANNOT_REVIEW_SELF', 'You cannot review your own admin account');
    }
    const admin = mockDb.admins.find((a) => a.id === targetId);
    if (!admin) {
      return createErrorResponse(404, 'ADMIN_NOT_FOUND', 'Admin not found');
    }
    if (admin.approvalStatus === 'approved') {
      return createErrorResponse(409, 'ALREADY_REVIEWED', 'Admin is already approved');
    }
    admin.approvalStatus = 'approved';
    admin.approvedBy = authUserId;
    admin.approvedAt = new Date().toISOString();
    admin.rejectionReason = null;
    mockDb.persist();
    return createSuccessResponse(admin, 'Admin approved successfully');
  }

  if (method === 'patch' && url.match(/^\/api\/admin\/admins\/([^/]+)\/reject$/)) {
    const targetId = url.split('/')[4];
    if (targetId === authUserId) {
      return createErrorResponse(403, 'CANNOT_REVIEW_SELF', 'You cannot review your own admin account');
    }
    const admin = mockDb.admins.find((a) => a.id === targetId);
    if (!admin) {
      return createErrorResponse(404, 'ADMIN_NOT_FOUND', 'Admin not found');
    }
    if (admin.approvalStatus === 'rejected') {
      return createErrorResponse(409, 'ALREADY_REVIEWED', 'Admin is already rejected');
    }
    admin.approvalStatus = 'rejected';
    admin.approvedBy = authUserId;
    admin.approvedAt = new Date().toISOString();
    admin.rejectionReason = body.reason || 'Account application rejected by administrator';
    mockDb.persist();
    return createSuccessResponse(admin, 'Admin registration rejected');
  }

  // --- RESTAURANTS ---
  if (method === 'get' && url === '/api/restaurants') {
    const { search, city, isActive } = query;
    let list = [...mockDb.restaurants];
    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter((r) => r.name.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q));
    }
    if (city) {
      list = list.filter((r) => r.address.city.toLowerCase() === String(city).toLowerCase());
    }
    if (isActive !== undefined) {
      list = list.filter((r) => r.isActive === (isActive === 'true' || isActive === true));
    }
    return createSuccessResponse(list);
  }

  if (method === 'get' && url.match(/^\/api\/restaurants\/([^/]+)$/)) {
    const id = url.split('/')[3];
    const restaurant = mockDb.restaurants.find((r) => r.id === id);
    if (!restaurant) {
      return createErrorResponse(404, 'NOT_FOUND', 'Restaurant not found');
    }
    return createSuccessResponse(restaurant);
  }

  if (method === 'post' && url === '/api/restaurants') {
    const newRest: Restaurant = {
      id: `rest-${Date.now()}`,
      name: body.name,
      description: body.description || '',
      ownerUserId: authUserId,
      phone: body.phone,
      email: body.email,
      address: body.address,
      deliveryFeePaisa: body.deliveryFeePaisa,
      image: body.imageUrl ? { url: body.imageUrl } : undefined,
      openingHours: body.openingHours || [],
      timeZone: body.timeZone || 'Asia/Karachi',
      isActive: body.isActive ?? true,
      createdAt: new Date().toISOString(),
    };
    mockDb.restaurants.unshift(newRest);
    mockDb.persist();
    return createSuccessResponse(newRest, 'Restaurant created successfully', 201);
  }

  if (method === 'patch' && url.match(/^\/api\/restaurants\/([^/]+)$/)) {
    const id = url.split('/')[3];
    const index = mockDb.restaurants.findIndex((r) => r.id === id);
    if (index === -1) {
      return createErrorResponse(404, 'NOT_FOUND', 'Restaurant not found');
    }
    const current = mockDb.restaurants[index];
    const updated: Restaurant = {
      ...current,
      ...body,
      address: body.address ? { ...current.address, ...body.address } : current.address,
      image: body.imageUrl ? { url: body.imageUrl } : current.image,
      updatedAt: new Date().toISOString(),
    };
    mockDb.restaurants[index] = updated;
    mockDb.persist();
    return createSuccessResponse(updated, 'Restaurant updated successfully');
  }

  // --- CATEGORIES ---
  if (method === 'get' && url.match(/^\/api\/restaurants\/([^/]+)\/categories$/)) {
    const restId = url.split('/')[3];
    const list = mockDb.categories
      .filter((c) => c.restaurantId === restId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    return createSuccessResponse(list);
  }

  if (method === 'post' && url.match(/^\/api\/restaurants\/([^/]+)\/categories$/)) {
    const restId = url.split('/')[3];
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      restaurantId: restId,
      name: body.name,
      description: body.description || '',
      sortOrder: body.sortOrder ?? mockDb.categories.length + 1,
      isActive: body.isActive ?? true,
      image: body.imageUrl ? { url: body.imageUrl } : undefined,
      createdAt: new Date().toISOString(),
    };
    mockDb.categories.push(newCat);
    mockDb.persist();
    return createSuccessResponse(newCat, 'Category created successfully', 201);
  }

  if (method === 'patch' && url.match(/^\/api\/categories\/([^/]+)$/)) {
    const id = url.split('/')[3];
    const cat = mockDb.categories.find((c) => c.id === id);
    if (!cat) return createErrorResponse(404, 'NOT_FOUND', 'Category not found');
    Object.assign(cat, body, { updatedAt: new Date().toISOString() });
    mockDb.persist();
    return createSuccessResponse(cat, 'Category updated successfully');
  }

  if (method === 'delete' && url.match(/^\/api\/categories\/([^/]+)$/)) {
    const id = url.split('/')[3];
    mockDb.categories = mockDb.categories.filter((c) => c.id !== id);
    mockDb.persist();
    return createSuccessResponse(null, 'Category deleted successfully');
  }

  // --- MENU ITEMS ---
  if (method === 'get' && url.match(/^\/api\/restaurants\/([^/]+)\/menu-items$/)) {
    const restId = url.split('/')[3];
    let items = mockDb.menuItems.filter((m) => m.restaurantId === restId);
    if (query.categoryId) {
      items = items.filter((m) => m.categoryId === query.categoryId);
    }
    if (query.isAvailable !== undefined) {
      items = items.filter((m) => m.isAvailable === (query.isAvailable === 'true' || query.isAvailable === true));
    }
    if (query.search) {
      const q = String(query.search).toLowerCase();
      items = items.filter((m) => m.name.toLowerCase().includes(q) || m.description?.toLowerCase().includes(q));
    }
    return createSuccessResponse(items);
  }

  if (method === 'get' && url === '/api/menu-items') {
    let items = [...mockDb.menuItems];
    if (query.restaurantId) {
      items = items.filter((m) => m.restaurantId === query.restaurantId);
    }
    if (query.search) {
      const q = String(query.search).toLowerCase();
      items = items.filter((m) => m.name.toLowerCase().includes(q));
    }
    return createSuccessResponse(items);
  }

  if (method === 'post' && url.match(/^\/api\/restaurants\/([^/]+)\/menu-items$/)) {
    const restId = url.split('/')[3];
    const newItem: MenuItem = {
      id: `item-${Date.now()}`,
      restaurantId: restId,
      categoryId: body.categoryId,
      name: body.name,
      description: body.description || '',
      pricePaisa: body.pricePaisa,
      discountPricePaisa: body.discountPricePaisa || undefined,
      ingredients: body.ingredients || [],
      isAvailable: body.isAvailable ?? true,
      preparationTimeMinutes: body.preparationTimeMinutes || 20,
      image: body.imageUrl ? { url: body.imageUrl } : undefined,
      createdAt: new Date().toISOString(),
    };
    mockDb.menuItems.unshift(newItem);
    mockDb.persist();
    return createSuccessResponse(newItem, 'Menu item created successfully', 201);
  }

  if (method === 'patch' && url.match(/^\/api\/menu-items\/([^/]+)$/)) {
    const id = url.split('/')[3];
    const item = mockDb.menuItems.find((m) => m.id === id);
    if (!item) return createErrorResponse(404, 'NOT_FOUND', 'Menu item not found');
    Object.assign(item, body, { updatedAt: new Date().toISOString() });
    if (body.imageUrl !== undefined) {
      item.image = body.imageUrl ? { url: body.imageUrl } : undefined;
    }
    mockDb.persist();
    return createSuccessResponse(item, 'Menu item updated successfully');
  }

  if (method === 'post' && url.match(/^\/api\/menu-items\/([^/]+)\/duplicate$/)) {
    const id = url.split('/')[3];
    const original = mockDb.menuItems.find((m) => m.id === id);
    if (!original) return createErrorResponse(404, 'NOT_FOUND', 'Menu item not found');
    const duplicate: MenuItem = {
      ...original,
      id: `item-${Date.now()}`,
      name: `${original.name} (Copy)`,
      createdAt: new Date().toISOString(),
    };
    mockDb.menuItems.unshift(duplicate);
    mockDb.persist();
    return createSuccessResponse(duplicate, 'Menu item duplicated successfully');
  }

  if (method === 'delete' && url.match(/^\/api\/menu-items\/([^/]+)$/)) {
    const id = url.split('/')[3];
    mockDb.menuItems = mockDb.menuItems.filter((m) => m.id !== id);
    mockDb.persist();
    return createSuccessResponse(null, 'Menu item deleted');
  }

  // --- CART ---
  if (method === 'get' && url === '/api/cart') {
    const detailedItems = mockDb.currentCart.items.map((line) => {
      const item = mockDb.menuItems.find((m) => m.id === line.menuItemId);
      return {
        menuItemId: line.menuItemId,
        quantity: line.quantity,
        menuItem: item,
      };
    });
    const restaurant = mockDb.currentCart.restaurantId
      ? mockDb.restaurants.find((r) => r.id === mockDb.currentCart.restaurantId)
      : undefined;

    return createSuccessResponse({
      id: 'cart-user',
      userId: authUserId,
      restaurantId: mockDb.currentCart.restaurantId,
      items: detailedItems,
      restaurant,
    });
  }

  if (method === 'post' && url === '/api/cart/items') {
    const { menuItemId, quantity = 1, restaurantId, forceReset = false } = body;
    const item = mockDb.menuItems.find((m) => m.id === menuItemId);
    if (!item) return createErrorResponse(404, 'NOT_FOUND', 'Item not found');

    if (
      mockDb.currentCart.restaurantId &&
      mockDb.currentCart.restaurantId !== restaurantId &&
      !forceReset
    ) {
      return createErrorResponse(
        409,
        'RESTAURANT_MISMATCH',
        'Your cart has items from another restaurant. Please confirm clearing it.'
      );
    }

    if (forceReset || !mockDb.currentCart.restaurantId) {
      mockDb.currentCart.restaurantId = restaurantId;
      mockDb.currentCart.items = [];
    }

    const existingIdx = mockDb.currentCart.items.findIndex((i) => i.menuItemId === menuItemId);
    if (existingIdx > -1) {
      mockDb.currentCart.items[existingIdx].quantity += quantity;
    } else {
      mockDb.currentCart.items.push({ menuItemId, quantity });
    }
    mockDb.persist();
    return createSuccessResponse(mockDb.currentCart, 'Item added to cart');
  }

  if (method === 'patch' && url.match(/^\/api\/cart\/items\/([^/]+)$/)) {
    const menuItemId = url.split('/')[4];
    const { quantity } = body;
    if (quantity <= 0) {
      mockDb.currentCart.items = mockDb.currentCart.items.filter((i) => i.menuItemId !== menuItemId);
    } else {
      const line = mockDb.currentCart.items.find((i) => i.menuItemId === menuItemId);
      if (line) line.quantity = quantity;
    }
    if (mockDb.currentCart.items.length === 0) {
      mockDb.currentCart.restaurantId = null;
    }
    mockDb.persist();
    return createSuccessResponse(mockDb.currentCart, 'Cart updated');
  }

  if (method === 'delete' && url === '/api/cart') {
    mockDb.currentCart = { restaurantId: null, items: [] };
    mockDb.persist();
    return createSuccessResponse(null, 'Cart cleared');
  }

  // --- ORDERS ---
  if (method === 'get' && url === '/api/orders') {
    let list = [...mockDb.orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    if (query.orderStatus) {
      list = list.filter((o) => o.orderStatus === query.orderStatus);
    }
    if (query.paymentStatus) {
      list = list.filter((o) => o.paymentStatus === query.paymentStatus);
    }
    if (query.restaurantId) {
      list = list.filter((o) => o.restaurantId === query.restaurantId);
    }
    if (query.search) {
      const q = String(query.search).toLowerCase();
      list = list.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName?.toLowerCase().includes(q) ||
          o.phone.includes(q)
      );
    }

    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);
    const total = list.length;
    const startIndex = (page - 1) * limit;
    const items = list.slice(startIndex, startIndex + limit);

    return createSuccessResponse({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  }

  if (method === 'get' && url === '/api/orders/my-orders') {
    const list = mockDb.orders
      .filter((o) => o.userId === authUserId || authUserRole === 'admin')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return createSuccessResponse(list);
  }

  if (method === 'get' && url.match(/^\/api\/orders\/([^/]+)$/)) {
    const id = url.split('/')[3];
    const order = mockDb.orders.find((o) => o.id === id || o.orderNumber === id);
    if (!order) return createErrorResponse(404, 'NOT_FOUND', 'Order not found');
    return createSuccessResponse(order);
  }

  if (method === 'post' && url === '/api/orders') {
    const { items, deliveryAddress, phone, notes, restaurantId } = body;
    const restaurant = mockDb.restaurants.find((r) => r.id === restaurantId) || mockDb.restaurants[0];

    let subtotalPaisa = 0;
    const orderItems = items.map(
      (it: { menuItemId: string; quantity: number }) => {
        const menuItem = mockDb.menuItems.find((m) => m.id === it.menuItemId);
        const price = menuItem?.discountPricePaisa || menuItem?.pricePaisa || 50000;
        const lineSub = price * it.quantity;
        subtotalPaisa += lineSub;
        return {
          menuItemId: it.menuItemId,
          name: menuItem?.name || 'Menu Item',
          unitPricePaisa: price,
          quantity: it.quantity,
          lineSubtotalPaisa: lineSub,
        };
      }
    );

    const deliveryFeePaisa = restaurant.deliveryFeePaisa;
    const totalPaisa = subtotalPaisa + deliveryFeePaisa;
    const newOrderNumber = `DF-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: newOrderNumber,
      userId: authUserId,
      customerName: 'Valued Customer',
      customerEmail: 'customer@example.pk',
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      items: orderItems,
      deliveryAddress,
      phone,
      subtotalPaisa,
      deliveryFeePaisa,
      discountPaisa: 0,
      totalPaisa,
      currency: 'PKR',
      paymentMethod: 'cash',
      paymentStatus: 'pending',
      orderStatus: 'pending',
      notes,
      createdAt: new Date().toISOString(),
      statusHistory: [
        {
          to: 'pending',
          actorUserId: authUserId,
          actorName: 'Customer',
          at: new Date().toISOString(),
          reason: 'Order placed via online checkout',
        },
      ],
    };

    mockDb.orders.unshift(newOrder);
    mockDb.currentCart = { restaurantId: null, items: [] };
    mockDb.persist();
    return createSuccessResponse(newOrder, 'Order placed successfully', 201);
  }

  // --- ORDER STATUS TRANSITION ---
  if (method === 'patch' && url.match(/^\/api\/orders\/([^/]+)\/status$/)) {
    const id = url.split('/')[3];
    const { orderStatus: nextStatus, reason } = body as {
      orderStatus: OrderStatus;
      reason?: string;
    };
    const order = mockDb.orders.find((o) => o.id === id);
    if (!order) return createErrorResponse(404, 'NOT_FOUND', 'Order not found');

    const allowed = ALLOWED_ORDER_TRANSITIONS[order.orderStatus];
    if (!allowed.includes(nextStatus)) {
      return createErrorResponse(
        400,
        'INVALID_STATUS_TRANSITION',
        `Cannot transition order from '${order.orderStatus}' to '${nextStatus}'.`
      );
    }

    if ((nextStatus === 'rejected' || nextStatus === 'cancelled') && !reason?.trim()) {
      return createErrorResponse(
        422,
        'VALIDATION_ERROR',
        'A reason is required to reject or cancel an order',
        [{ field: 'reason', message: 'Reason is required' }]
      );
    }

    const previousStatus = order.orderStatus;
    order.orderStatus = nextStatus;
    if (nextStatus === 'cancelled') {
      order.cancelledAt = new Date().toISOString();
    }

    order.statusHistory.push({
      from: previousStatus,
      to: nextStatus,
      actorUserId: authUserId,
      actorName: 'Admin Staff',
      at: new Date().toISOString(),
      reason: reason || undefined,
    });

    mockDb.persist();
    return createSuccessResponse(order, `Order updated to ${nextStatus}`);
  }

  // --- ORDER PAYMENT STATUS ---
  if (method === 'patch' && url.match(/^\/api\/orders\/([^/]+)\/payment$/)) {
    const id = url.split('/')[3];
    const { paymentStatus } = body as { paymentStatus: PaymentStatus };
    const order = mockDb.orders.find((o) => o.id === id);
    if (!order) return createErrorResponse(404, 'NOT_FOUND', 'Order not found');
    order.paymentStatus = paymentStatus;
    mockDb.persist();
    return createSuccessResponse(order, 'Payment status updated');
  }

  // --- CUSTOMERS ---
  if (method === 'get' && url === '/api/admin/customers') {
    const { search, status, page = 1, limit = 10 } = query;
    let list = [...mockDb.customers];
    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone?.includes(q));
    }
    if (status) {
      list = list.filter((c) => c.status === status);
    }
    const total = list.length;
    const startIndex = (Number(page) - 1) * Number(limit);
    const items = list.slice(startIndex, startIndex + Number(limit));
    return createSuccessResponse({
      items,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    });
  }

  if (method === 'patch' && url.match(/^\/api\/admin\/customers\/([^/]+)\/status$/)) {
    const id = url.split('/')[4];
    const { status, reason } = body;
    const customer = mockDb.customers.find((c) => c.id === id);
    if (!customer) return createErrorResponse(404, 'NOT_FOUND', 'Customer not found');
    customer.status = status;
    customer.blockReason = reason;
    mockDb.persist();
    return createSuccessResponse(customer, `Customer ${status === 'blocked' ? 'blocked' : 'unblocked'}`);
  }

  // --- ANALYTICS / OVERVIEW ---
  if (method === 'get' && url === '/api/admin/analytics/overview') {
    const pendingCount = mockDb.orders.filter((o) => o.orderStatus === 'pending').length;
    const totalOrdersCount = mockDb.orders.length;
    const todayRevenue = mockDb.orders
      .filter((o) => o.orderStatus === 'delivered')
      .reduce((acc, curr) => acc + curr.totalPaisa, 0);

    const pendingAdmins = mockDb.admins.filter((a) => a.approvalStatus === 'pending').length;

    return createSuccessResponse({
      todayRevenuePaisa: todayRevenue,
      todayRevenueTrend: 14.2,
      totalOrders: totalOrdersCount,
      totalOrdersTrend: 8.5,
      pendingOrders: pendingCount,
      pendingOrdersTrend: -4.1,
      activeCustomers: mockDb.customers.filter((c) => c.status === 'active').length,
      activeCustomersTrend: 12.0,
      averageOrderValuePaisa: totalOrdersCount > 0 ? Math.round(todayRevenue / Math.max(totalOrdersCount, 1)) : 0,
      averageOrderValueTrend: 5.6,
      cancellationRate: 3.8,
      cancellationRateTrend: -1.2,
      pendingAdminApprovalsCount: pendingAdmins,
    });
  }

  // Fallback 404
  return createErrorResponse(404, 'ROUTE_NOT_FOUND', `Mock route not found: ${method.toUpperCase()} ${url}`);
}
