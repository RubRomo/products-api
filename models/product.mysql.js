import dotenv from 'dotenv'
import { mysqlConnection } from '../db/mysql.js'
dotenv.config()

export class ProductModelMySQL {
  static async getProducts () {
    const [result] = await mysqlConnection.query(
      'SELECT * FROM products'
    )
    return result
  }

  static async getProductById ({ id }) {
    const [result] = await mysqlConnection.query(
      'SELECT * FROM products WHERE id = ?', [id]
    )
    return result
  }

  static async updateProduct ({ id, input }) {
    // Desctructuring for pulling only rows
    const [resultById] = await mysqlConnection.query(
      'SELECT * FROM products WHERE id = ?', [id]
    )

    if (resultById.length === 0) {
      return 'ID doesnt exist'
    }

    const [resultByName] = await mysqlConnection.query(
      'SELECT * FROM products WHERE name = ?', [input.name]
    )

    if (resultByName.length) {
      return 'Product name already exists'
    }

    await mysqlConnection.query(
      `UPDATE products
      SET name = ?
      , price = ?
      , stock = ?
      ,active = ?
      WHERE id = ?
      `, [input.name, input.price, input.stock, input.active, id]
    )

    return { id, ...input }
  }

  static async createProduct ({ input }) {
    const [productResult] = await mysqlConnection.query(
      'SELECT * FROM products WHERE name = ?', [input.name]
    )

    if (productResult.length !== 0) {
      return 'Product name already exists'
    }

    const [productInsert] = await mysqlConnection.query(
      'INSERT INTO products (name, price, stock, active) VALUES (?,?,?,?)',
      [input.name, input.price, input.stock, input.active]
    )

    return { id: productInsert.insertId, ...input }
  }

  static async deleteProduct ({ id }) {
    const [productResult] = await mysqlConnection.query(
      'SELECT * FROM products WHERE id = ?', [id]
    )
    if (productResult.length === 0) {
      return false
    }
    await mysqlConnection.query(
      'DELETE FROM products WHERE id = ?', [id]
    )
    return true
  }
}
