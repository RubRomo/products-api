const DB_ENGINE = process.env.DB_ENGINE || 'postgres'

let ProductModel

if (DB_ENGINE === 'postgres') {
  const module = await import('./product.postgres.js')
  ProductModel = module.ProductModelPostgres
} else {
  const module = await import('./product.mysql.js')
  ProductModel = module.ProductModelMySQL
}

export { ProductModel }
