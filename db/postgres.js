import pkg from 'pg'
import dotenv from 'dotenv'
dotenv.config()

const { Pool } = pkg

export const postgresPool = new Pool({
  connectionString: process.env.POSTGRES_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})
