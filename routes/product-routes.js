import { Router } from 'express'
import { ProductController } from '../controllers/product-controller.js'

export const productRouter = Router()

productRouter.get('/', ProductController.getProducts)
productRouter.get('/:id', ProductController.getProductById)
productRouter.patch('/:id', ProductController.updateProduct)
productRouter.post('/', ProductController.createProduct)
productRouter.delete('/:id', ProductController.deleteProduct)
