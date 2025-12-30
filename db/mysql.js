import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
dotenv.config()

export const mysqlConnection = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'productsapi',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || ''
})
