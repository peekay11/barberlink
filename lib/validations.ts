import { z } from 'zod'

export const shopSchema = z.object({
  shop_name: z.string().min(1, 'Shop name is required'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  address: z.string().min(1, 'Area is required'),
  full_address: z.string().min(10, 'Full address is required'),
  manager_name: z.string().min(1, 'Manager name is required'),
  contact_number: z.string().min(10, 'Valid contact number is required'),
  whatsapp_number: z.string().optional().or(z.literal('')),
  email: z.string().email('Valid email is required'),
  website: z.string().url('Valid website URL').optional().or(z.literal('')),
  facebook_url: z.string().url('Valid Facebook URL').optional().or(z.literal('')),
  instagram_url: z.string().url('Valid Instagram URL').optional().or(z.literal('')),
  twitter_url: z.string().url('Valid Twitter URL').optional().or(z.literal('')),
  services: z.array(z.string()).min(1, 'At least one service is required'),
  price_range: z.string().min(1, 'Price range is required'),
})

export const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(1, 'Comment is required'),
})

export const profileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  role: z.enum(['client', 'vendor']),
})