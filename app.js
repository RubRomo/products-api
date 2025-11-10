import express, { json } from 'express'
import { productRouter } from './routes/product-routes.js'
import cors from 'cors'
import { parseLambdaBody } from './middlewares/parse-lambdabody.js'

const app = express()

// middlewares
app.use(json())
app.use(cors())

if (process.env.NODE_ENV === 'production') {
  app.use(parseLambdaBody)
}

app.use('/products', productRouter)

export default app
