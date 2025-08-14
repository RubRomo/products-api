import mysql from 'mysql2/promise'

// Create the connection to database
const connection = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  database: 'productsapi'
})

export class ProductModel {
  static async getProducts () {
    const [result] = await connection.query(
      'SELECT * FROM product'
    )
    return result
  }

  static async getProductById ({ id }) {
    const [result] = await connection.query(
      'SELECT * FROM product WHERE id = ?', [id]
    )
    return result
  }

  static async updateProduct ({ id, input }) {
    const [result] = await connection.query(
      'SELECT * FROM product WHERE id = ?', [id]
    )

    if (result.length === 0) {
      return result
    }

    await connection.query(
      `UPDATE product
      SET name = ?
      , price = ?
      , stock = ?
      ,archived = ?
      WHERE id = ?
      `, [input.name, input.price, input.stock, input.archived, id]
    )

    return { id, ...input }
  }

  static async createProduct ({ input }) {
    const [productResult] = await connection.query(
      'SELECT * FROM product WHERE name = ?', [input.name]
    )

    if (productResult.length !== 0) {
      return []
    }

    const [productInsert] = await connection.query(
      'INSERT INTO Product (name, price, stock, archived) VALUES (?,?,?,?)',
      [input.name, input.price, input.stock, input.archived]
    )
    return { id: productInsert.insertId, ...input }
  }

  static async deleteProduct ({ id }) {
    const [productResult] = await connection.query(
      'SELECT * FROM product WHERE id = ?', [id]
    )
    if (productResult.length === 0) {
      return false
    }
    await connection.query(
      'DELETE FROM product WHERE id = ?', [id]
    )
    return true
  }
}
