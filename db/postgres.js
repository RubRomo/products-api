import pkg from 'pg'
import dotenv from 'dotenv'
dotenv.config()

const { Pool } = pkg

export const postgresPool = new Pool({
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
  ssl: { rejectUnauthorized: false }
})
