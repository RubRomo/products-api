import express, { json } from 'express'
import { productRouter } from './routes/product-routes.js'
import cors from 'cors'

const app = express()

// middlewares
app.use(json())
app.use(cors())

app.use('/products', productRouter)

export default app
