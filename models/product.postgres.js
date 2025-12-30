import { postgresPool } from '../db/postgres.js'

export class ProductModelPostgres {
  static async getProducts () {
    const { rows } = await postgresPool.query(
      'SELECT * FROM products'
    )
    return rows
  }

  static async getProductById ({ id }) {
    const { rows } = await postgresPool.query(
      'SELECT * FROM products WHERE id = $1', [id]
    )
    return rows
  }

  static async updateProduct ({ id, input }) {
    const { rows: rowsById } = await postgresPool.query(
      'SELECT * FROM products WHERE id = $1', [id]
    )

    if (!rowsById.length) {
      return 'ID doesnt exist'
    }

    const { rows: rowsByName } = await postgresPool.query(
      'SELECT * FROM products WHERE name = $1', [input.name]
    )

    if (rowsByName.length) {
      return 'Product name already exists'
    }

    await postgresPool.query(
      `UPDATE products
       SET name = $1, price = $2, stock = $3, active = $4
       WHERE id = $5`,
      [input.name, input.price, input.stock, input.active, id]
    )

    return { id, ...input }
  }

  static async createProduct ({ input }) {
    const { rows: rowCount } = await postgresPool.query(
      'SELECT 1 FROM products WHERE name = $1', [input.name]
    )

    if (rowCount.length) {
      return 'Product name already exists'
    }

    const { rows } = await postgresPool.query(
      `INSERT INTO products (name, price, stock, active)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [input.name, input.price, input.stock, input.active]
    )

    return { id: rows[0].id, ...input }
  }

  static async deleteProduct ({ id }) {
    const { rows } = await postgresPool.query(
      'SELECT * FROM products WHERE id = $1', [id]
    )

    if (!rows.length) {
      return false
    }

    await postgresPool.query(
      'DELETE FROM products WHERE id = $1', [id]
    )
    return true
  }
}
