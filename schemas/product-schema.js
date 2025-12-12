import z from 'zod'

const productSchema = z.object({
  name: z.string({
    invalid_type_error: 'product name must be a string',
    required_error: 'product name is required'
  }).max(255),
  price: z.number().min(0),
  stock: z.number().min(0),
  active: z.number().min(0).max(1)
})

export function validateProduct (object) {
  return productSchema.safeParse(object)
}

export function validatePartialProduct (object) {
  return productSchema.partial().safeParse(object)
}
