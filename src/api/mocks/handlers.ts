import { http, HttpResponse } from 'msw';
import {
  INITIAL_RESTAURANTS,
  INITIAL_CATEGORIES,
  INITIAL_MENU_ITEMS,
  INITIAL_ORDERS,
  INITIAL_CUSTOMERS,
  INITIAL_ADMINS,
} from '../mockData';

export const handlers = [
  http.get('/health/live', () => {
    return HttpResponse.json({ success: true, data: { status: 'live' } });
  }),

  http.get('/health/ready', () => {
    return HttpResponse.json({
      success: true,
      data: { status: 'ready', database: 'connected' },
    });
  }),

  http.post('/api/auth/login', async ({ request }) => {
    const body = (await request.json()) as { email: string };
    const user =
      INITIAL_ADMINS.find((a) => a.email === body.email) ||
      INITIAL_CUSTOMERS.find((c) => c.email === body.email) ||
      INITIAL_ADMINS[0];
    return HttpResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        accessToken: btoa(JSON.stringify({ id: user.id, role: 'role' in user ? user.role : 'client' })),
      },
    });
  }),

  http.get('/api/users/me', () => {
    return HttpResponse.json({
      success: true,
      data: INITIAL_ADMINS[0],
    });
  }),

  http.get('/api/restaurants', () => {
    return HttpResponse.json({
      success: true,
      data: INITIAL_RESTAURANTS,
    });
  }),

  http.get('/api/restaurants/:id', ({ params }) => {
    const restaurant = INITIAL_RESTAURANTS.find((r) => r.id === params.id) || INITIAL_RESTAURANTS[0];
    return HttpResponse.json({
      success: true,
      data: restaurant,
    });
  }),

  http.get('/api/restaurants/:id/categories', ({ params }) => {
    const list = INITIAL_CATEGORIES.filter((c) => c.restaurantId === params.id);
    return HttpResponse.json({
      success: true,
      data: list,
    });
  }),

  http.get('/api/restaurants/:id/menu-items', ({ params }) => {
    const list = INITIAL_MENU_ITEMS.filter((m) => m.restaurantId === params.id);
    return HttpResponse.json({
      success: true,
      data: list,
    });
  }),

  http.get('/api/orders', () => {
    return HttpResponse.json({
      success: true,
      data: {
        items: INITIAL_ORDERS,
        total: INITIAL_ORDERS.length,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    });
  }),

  http.get('/api/admin/admins', () => {
    return HttpResponse.json({
      success: true,
      data: {
        items: INITIAL_ADMINS,
        total: INITIAL_ADMINS.length,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    });
  }),
];
