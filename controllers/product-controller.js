import { ProductModel } from '../models/product-model.js'
import { validateProduct } from '../schemas/product-schema.js'

export class ProductController {
  static async getProducts (req, res) {
    try {
      const products = await ProductModel.getProducts()
      res.json({ data: products })
    } catch (e) {
      res.status(500).json({ error: 'Sorry there was a problem processing your request' })
    }
  }

  static async getProductById (req, res) {
    const { id } = req.params
    try {
      const product = await ProductModel.getProductById({ id })
      if (product.length === 0) {
        return res.status(404).json({ error: 'Product not found' })
      }
      res.json({ data: product })
    } catch (e) {
      res.status(500).json({ error: 'Sorry there was a problem processing your request' })
    }
  }

  static async updateProduct (req, res) {
    const productCheck = validateProduct(req.body)
    if (!productCheck.success) {
      return res.status(404).json({ error: JSON.parse(productCheck.error.message) })
    }
    const { id } = req.params
    try {
      const updatedProduct = await ProductModel.updateProduct({ id, input: req.body })
      if (updatedProduct.length === 0) {
        return res.status(404).json({ error: 'Product not found' })
      }
      res.json({ data: updatedProduct })
    } catch (e) {
      res.status(500).send({ error: 'Sorry there was a problem processing your request' })
    }
  }

  static async createProduct (req, res) {
    const productCheck = validateProduct(req.body)
    if (!productCheck.success) {
      return res.status(400).json({ error: JSON.parse(productCheck.error.message) })
    }
    try {
      const newProduct = await ProductModel.createProduct({ input: productCheck.data })
      if (newProduct.length === 0) {
        return res.status(409).json({ error: 'Product name already exists' })
      }
      res.json({ data: newProduct })
    } catch (error) {
      res.status(500).send({ error: 'Sorry there was a problem processing your request' })
    }
  }

  static async deleteProduct (req, res) {
    const { id } = req.params
    try {
      const isProductDeleted = await ProductModel.deleteProduct({ id })
      if (!isProductDeleted) {
        return res.status(404).json({ error: 'Product not found' })
      }
      res.status(204).send()
    } catch (e) {
      res.status(500).send({ error: 'Sorry there was a problem processing your request' })
    }
  }

  static async getAIResponse (req, res) {
    const { messages } = req.body
    try {
      const aiResponse = await ProductModel.getAIResponse({ messages })
      res.json(aiResponse)
    } catch (e) {
      res.status(500).json({ error: e.message.toString() })
    }
  }

  static async getChatCompletion (req, res) {
    try {
      const result = await ProductModel.getChatCompletion()
      res.json(result)
    } catch (e) {
      res.status(500).json({ error: e.message.toString() })
    }
  }
}
