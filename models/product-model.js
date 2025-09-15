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
      ,active = ?
      WHERE id = ?
      `, [input.name, input.price, input.stock, input.active, id]
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
                active: { type: 'boolean', description: 'Product status' }
              }
            }
          },
          required: ['id']
        }
      }
    ]

    // Create a running input list we will add to over time
    let input = [
      { role: 'user', content: prompt }
    ]

    const agentResponse = await openai.responses.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      instructions: `
        You are a helpful assistant.

        You have three tools:

        1. getProductById  
          - Use ONLY if the user explicitly provides a product ID and asks to view product details.  
          - Example: "product id 12", "show me item 4".  
          - If the user provides an ID and is asking for product details, NEVER call getProducts. Always call getProductById with that ID.  

        2. getProducts  
          - Use ONLY if the user requests the list of all products without specifying an ID.  
          - If the user says they want to update a product but does not specify what to update, DO NOT call getProductById.  
          - Instead, ask the user for the mandatory fields: (id, name, price, stock, active).  

        3. updateProduct  
          - Use ONLY if the user explicitly asks to update a product AND provides ALL mandatory fields: (id, name, price, stock, active).  
          - If ANY mandatory field is missing, DO NOT invent or assume values.  
          

        GLOBAL RULES:  
        - NEVER fabricate or guess missing values (especially product name).  
        - Only include fields explicitly provided by the user.  
        - Ask **only for the missing fields** (never list the ones already provided).
        - If all fields are present, call updateProduct with exactly those values.
        - Always respond in a friendly and conversational manner.
      `,
      tools,
      input
    })

    input = input.concat(agentResponse.output)

    const assistantMsg = agentResponse.output.find(item => item.type === 'message')
    if (assistantMsg) {
      console.log('is assitant message')
      return assistantMsg.content[0].text
    }

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
          console.log('message test')
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
      instructions: `
        Make a simple, friendly response using the function_call_output results.
        Do not use bold or markdown other than the bullet list. 
      `,
      input
    })

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
