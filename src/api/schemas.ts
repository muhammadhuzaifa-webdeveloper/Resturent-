import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(120, 'Name cannot exceed 120 characters'),
  email: z.string().email('Invalid email address').max(254),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password cannot exceed 72 characters'),
  phone: z.string().max(32, 'Phone number too long').optional().or(z.literal('')),
  role: z.enum(['client', 'admin']),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .max(72, 'New password cannot exceed 72 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export const profileUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(120),
  phone: z.string().max(32).optional().or(z.literal('')),
});

export type ProfileUpdateFormValues = z.infer<typeof profileUpdateSchema>;

export const restaurantFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(160),
  description: z.string().max(2000).optional().or(z.literal('')),
  phone: z.string().max(32).optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.object({
    line1: z.string().min(3, 'Address line 1 is required').max(200),
    line2: z.string().max(200).optional().or(z.literal('')),
    city: z.string().min(2, 'City is required').max(100),
    postalCode: z.string().max(24).optional().or(z.literal('')),
    country: z.string().min(2, 'Country is required').default('Pakistan'),
  }),
  deliveryFeeRupees: z.coerce.number().min(0, 'Delivery fee cannot be negative'),
  imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  timeZone: z.string().default('Asia/Karachi'),
  isActive: z.boolean().default(true),
  openingHours: z.array(
    z.object({
      dayOfWeek: z.number().min(0).max(6),
      opensAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time (HH:mm)'),
      closesAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time (HH:mm)'),
      isClosed: z.boolean().default(false),
    })
  ),
});

export type RestaurantFormValues = z.infer<typeof restaurantFormSchema>;

export const categoryFormSchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100),
  description: z.string().max(1000).optional().or(z.literal('')),
  imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  sortOrder: z.coerce.number().min(0).default(0),
  isActive: z.boolean().default(true),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export const menuItemFormSchema = z
  .object({
    categoryId: z.string().min(1, 'Category is required'),
    name: z.string().min(1, 'Item name is required').max(160),
    description: z.string().max(2000).optional().or(z.literal('')),
    priceRupees: z.coerce.number().min(1, 'Price must be at least Rs 1'),
    discountPriceRupees: z.coerce
      .number()
      .optional()
      .nullable()
      .transform((val) => (val && val > 0 ? val : null)),
    ingredients: z.array(z.string()).max(50, 'Max 50 ingredients').default([]),
    isAvailable: z.boolean().default(true),
    preparationTimeMinutes: z.coerce.number().min(1).max(1440).default(20),
    imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  })
  .refine(
    (data) => {
      if (data.discountPriceRupees !== null && data.discountPriceRupees !== undefined) {
        return data.discountPriceRupees < data.priceRupees;
      }
      return true;
    },
    {
      message: 'Discount price must be lower than regular price',
      path: ['discountPriceRupees'],
    }
  );

export type MenuItemFormValues = z.infer<typeof menuItemFormSchema>;

export const checkoutFormSchema = z.object({
  line1: z.string().min(3, 'Delivery address is required').max(200),
  line2: z.string().max(200).optional().or(z.literal('')),
  city: z.string().min(2, 'City is required').max(100),
  postalCode: z.string().max(24).optional().or(z.literal('')),
  country: z.string().min(2, 'Country is required').default('Pakistan'),
  phone: z.string().min(7, 'Contact phone number is required').max(32),
  notes: z.string().max(1000).optional().or(z.literal('')),
});

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

export const orderStatusReasonSchema = z.object({
  reason: z.string().min(3, 'Please provide a reason').max(500),
});

export type OrderStatusReasonFormValues = z.infer<typeof orderStatusReasonSchema>;

export const adminRejectSchema = z.object({
  reason: z.string().max(500).optional().or(z.literal('')),
});

export type AdminRejectFormValues = z.infer<typeof adminRejectSchema>;
