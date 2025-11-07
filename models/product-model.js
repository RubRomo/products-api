import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
dotenv.config()

// Create the connection to database
const connection = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'productsapi',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || ''
})

export class ProductModel {
  static async getProducts () {
    const [result] = await connection.query(
      'SELECT * FROM products'
    )
    return result
  }

  static async getProductById ({ id }) {
    const [result] = await connection.query(
      'SELECT * FROM products WHERE id = ?', [id]
    )
    return result
  }

  static async updateProduct ({ id, input }) {
    // Desctructuring for pulling only rows
    const [resultById] = await connection.query(
      'SELECT * FROM products WHERE id = ?', [id]
    )

    if (resultById.length === 0) {
      return 'ID doesnt exist'
    }

    const [resultByName] = await connection.query(
      'SELECT * FROM products WHERE name = ?', [input.name]
    )

    if (resultByName.length) {
      return 'Product name already exists'
    }

    await connection.query(
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
    const [productResult] = await connection.query(
      'SELECT * FROM products WHERE name = ?', [input.name]
    )

    if (productResult.length !== 0) {
      return 'Product name already exists'
    }

    const [productInsert] = await connection.query(
      'INSERT INTO Product (name, price, stock, active) VALUES (?,?,?,?)',
      [input.name, input.price, input.stock, input.active]
    )

    return { id: productInsert.insertId, ...input }
  }

  static async deleteProduct ({ id }) {
    const [productResult] = await connection.query(
      'SELECT * FROM products WHERE id = ?', [id]
    )
    if (productResult.length === 0) {
      return false
    }
    await connection.query(
      'DELETE FROM products WHERE id = ?', [id]
    )
    return true
  }
}
