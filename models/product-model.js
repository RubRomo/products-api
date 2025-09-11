import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
import OpenAI from 'openai'
dotenv.config()

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

  static async getAIResponse ({ prompt }) {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })

    // 1. Define a list of callable tools for the model
    const tools = [
      {
        type: 'function',
        name: 'getProductById',
        description: 'Get product by ID',
        parameters: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Product by ID.'
            }
          }
        },
        required: ['id']
      },
      {
        type: 'function',
        name: 'getProducts',
        description: 'Get the full list of available products.'
      },
      {
        type: 'function',
        name: 'updateProduct',
        description: 'Update an existing product by ID providing the fields to update.',
        parameters: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Product by ID.'
            },
            input: {
              type: 'object',
              description: 'Product details to update',
              properties: {
                name: { type: 'string', description: 'Product name' },
                price: { type: 'number', description: 'Product price' },
                stock: { type: 'number', description: 'Product stock' },
                archived: { type: 'number', description: '1 if product is archived, 0 if not' }
              }
            }
          },
          required: ['id']
        }
      }
    ]

    // Create a running input list we will add to over time
    let input = [
      { role: 'user', content: prompt },
      {
        role: 'system', content: `
        You are a helpful assistant.

        You have three tools:
        1. getProductById: Use ONLY if the user explicitly provides a product ID and asks to view product details (example: "product id 12", "show me item 4").
        2. getProducts: Use ONLY if the user requests the list of all products without specifying an ID.
        3. updateProduct: Use ONLY if the user wants to update a product by ID and provides the fields to update (example: "update product id 5 to have price 20 and stock 50 and must be active").

        If the user says they want to update a product but does not specify what to update, DO NOT call getProductById. Instead, ask the user the fields required to update (name, price, stock, archived).

        If the user provides an ID and is asking for getting product data, you must NEVER call getProducts. Always call getProductById with that ID, it only applies when user ask for getting product details.
        Here are the details for product id {id}:

        - Name: {name}
        - Price: {price}
        - Stock: {stock}
        - Available: {Archived or Not Archived}

        Do not use bold or markdown other than the bullet list. 
        Always include 'Available: Yes or No' if archived is true or false.

        If user provides an ID and wants to update a product, use updateProduct passing the fields to update.
        `
      }
    ]

    const agentResponse = await openai.responses.create({
      model: 'gpt-4o-mini',
      tools,
      input
    })

    input = input.concat(agentResponse.output)

    /* console.log(agentResponse.output) */

    await Promise.all(
      agentResponse.output.map(async (item) => {
        if (item.type === 'function_call') {
          console.log('funcitoncall')
          const functionResult = await ProductModel.callFunction(item.name, JSON.parse(item.arguments))
          input.push({
            type: 'function_call_output',
            call_id: item.call_id,
            output: JSON.stringify(functionResult)
          })
        }

        if (item.type === 'message') {
          console.log('message')
          input.push({
            role: 'assistant',
            content: item.content[0].text
          })
        }
      })
    )

    console.log(input)

    const response = await openai.responses.create({
      model: 'gpt-4o-mini',
      instructions: 'Make a simple, friendly response using the function_call_output results if available, or use the assistant message text.',
      input
    })

    /* console.log(response) */

    return response.output_text
  }

  static async callFunction (name, args) {
    console.log(name)
    if (name === 'getProducts') {
      return ProductModel.getProducts()
    }
    if (name === 'getProductById') {
      return ProductModel.getProductById(args)
    }
    if (name === 'updateProduct') {
      return ProductModel.updateProduct(args)
    }
    return 'Function not found'
  }
}
