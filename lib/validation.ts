import { z } from 'zod'

// Schema for validating item (date idea) form data
export const itemSchema = z.object({
  nama: z.string().min(1, 'Name is required'),
  type_id: z.string().min(1, 'Type is required'),
  lokasi: z.string().url('Invalid Google Maps URL'),
  link: z.string().url('Invalid URL').optional().or(z.literal('')),
  status: z.boolean(),
  visited_at: z.string().optional().or(z.literal('')),
})

export type ItemFormValues = z.infer<typeof itemSchema>

// Schema for validating visit log form data
export const visitSchema = z.object({
  visited_at: z.string().optional().or(z.literal('')),
})

export type VisitFormValues = z.infer<typeof visitSchema>

// Schema for validating type (category) form data
export const typeSchema = z.object({
  name: z.string().min(1, 'Type name is required'),
  category: z.enum(['food', 'place'], { error: 'Category is required' }),
})

export type TypeFormValues = z.infer<typeof typeSchema>
