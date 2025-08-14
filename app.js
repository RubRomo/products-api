import express, { json } from 'express'
import { productRouter } from './routes/product-routes.js'

const PORT = process.env.PORT ?? 3000
const app = express()

// middlewares
app.use(json())

app.use('/products', productRouter)

app.listen(PORT, () => {
  console.log(`Server listening on port http://localhost:${PORT}`)
})
