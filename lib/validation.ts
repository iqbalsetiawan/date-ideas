import { z } from 'zod'

export const itemSchema = z.object({
  nama: z.string().min(1, 'Name is required'),
  type_id: z.string().min(1, 'Type is required'),
  lokasi: z.string().min(1, 'Location is required'),
  link: z.url('Invalid URL').optional().or(z.literal('')),
  status: z.boolean(),
})

export type ItemFormValues = z.infer<typeof itemSchema>

export const typeSchema = z.object({
  name: z.string().min(1, 'Type name is required'),
  category: z.enum(['food', 'place'], { error: 'Category is required' }),
})

export type TypeFormValues = z.infer<typeof typeSchema>
