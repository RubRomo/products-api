import { ProductModelMySQL } from './product.mysql.js'
import { ProductModelPostgres } from './product.postgres.js'

const DB_ENGINE = process.env.DB_ENGINE || 'mysql'

export const ProductModel =
  DB_ENGINE === 'postgres'
    ? ProductModelPostgres
    : ProductModelMySQL
