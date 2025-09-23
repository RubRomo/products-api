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
    // Desctructuring for pulling only rows
    const [resultById] = await connection.query(
      'SELECT * FROM product WHERE id = ?', [id]
    )

    if (resultById.length === 0) {
      return 'ID doesnt exist'
    }

    const [resultByName] = await connection.query(
      'SELECT * FROM product WHERE name = ?', [input.name]
    )

    if (resultByName.length) {
      return 'Product name already exists'
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
      return 'Product name already exists'
    }

    const [productInsert] = await connection.query(
      'INSERT INTO Product (name, price, stock, active) VALUES (?,?,?,?)',
      [input.name, input.price, input.stock, input.active]
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
      },
      {
        type: 'function',
        name: 'createProduct',
        description: 'Insert a new product',
        parameters: {
          type: 'object',
          properties: {
            input: {
              type: 'object',
              description: 'Product details to insert',
              properties: {
                name: { type: 'string', description: 'Product name' },
                price: { type: 'number', description: 'Product price' },
                stock: { type: 'number', description: 'Product stock' },
                active: { type: 'boolean', description: 'Product status' }
              },
              required: ['name', 'price', 'stock', 'active']
            }
          }
        }
      },
      {
        type: 'function',
        name: 'deleteProduct',
        description: 'Delete product by ID',
        parameters: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Product ID'
            }
          }
        },
        required: ['id']
      }
    ]

    // Create a running input list we will add to over time
    let input = [
      { role: 'user', content: prompt }
    ]

    const agentResponse = await openai.responses.create({
      model: 'gpt-4o-mini',
      /* model: 'gpt-3.5-turbo', */
      temperature: 0,
      instructions: `
        You are a helpful assistant.

        You have three tools:

        1. getProductById  
          - Use ONLY if the user explicitly provides a product ID and asks to view product details.  
          - Example: "product id 12", "show me item 4".  
          - If the user provides an ID and is asking for product details, NEVER call getProducts. Always call getProductById with that ID.  
          - Do NOT call getProductById if user is asking to update or delete a product.

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
        - Do not ask for confimration, just do it.
        - When user provides the status convert it by yourself to boolean (true/false).
        - Always respond in a friendly and conversational manner.
      `,
      tools,
      input
    })

    input = input.concat(agentResponse.output)

    const assistantMsg = agentResponse.output.find(item => item.type === 'message')
    if (assistantMsg) {
      console.log('is assitant message')
      return { data: assistantMsg.content[0].text, refresh: false }
    }

    /*
      Promise.all still runs all tasks in parallel.
      The .map order is preserved in the resolved newItems array.
      Applying this solution when multiple function calls are made at once.
    */
    const orderedItems = await Promise.all(
      agentResponse.output.map(async (item) => {
        if (item.type === 'function_call') {
          console.log('functioncall')
          const functionResult = await ProductModel.callFunction(item.name, JSON.parse(item.arguments))
          return {
            type: 'function_call_output',
            call_id: item.call_id,
            output: JSON.stringify(functionResult)
          }
        }
      })
    )

    /* keeping original funciton calling output order */
    input.push(...orderedItems.filter(Boolean))

    console.log(input)

    const response = await openai.responses.create({
      model: 'gpt-4o-mini',
      instructions: `
        Make a simple, friendly response using the function_call_output results.
        Do not use bold or markdown other than the bullet list.
        consider the below scenarios for your response:
        1. If updateProduct function was called but data has string that means update was not succesful, respond basing on it.
        2. If createProduct funciton was called but result is an empty array, say "Product name: {name} already exists, please review it and try again."
        3. Match correctly the function_call vs function_call_output by the call_id and provide the result basing on his output.
      `,
      input
    })

    const isRefresh = input.some(item => item.type === 'function_call_output' && item.output.includes('"refresh":true'))

    return { data: response.output_text, refresh: isRefresh }
  }

  static async callFunction (name, args) {
    console.log(name)

    if (name === 'getProducts') {
      return { data: await ProductModel.getProducts(), refresh: false }
    }
    if (name === 'getProductById') {
      return { data: await ProductModel.getProductById(args), refresh: false }
    }
    if (name === 'updateProduct') {
      const updateResult = await ProductModel.updateProduct(args)
      return { data: updateResult, refresh: typeof updateResult === 'object' }
    }
    if (name === 'createProduct') {
      const createProductResult = await ProductModel.createProduct(args)
      return { data: createProductResult, refresh: typeof createProductResult === 'object' }
    }
    if (name === 'deleteProduct') {
      const isProductDeleted = await ProductModel.deleteProduct(args)
      return { data: isProductDeleted, refresh: isProductDeleted }
    }
    return 'Function not found'
  }

  static async getChatCompletion () {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Hello!' }]
      })
    })

    console.log('Rate limit headers:')
    console.log('Requests limit:', response.headers.get('x-ratelimit-limit-requests'))
    console.log('Requests remaining:', response.headers.get('x-ratelimit-remaining-requests'))
    console.log('Tokens limit:', response.headers.get('x-ratelimit-limit-tokens'))
    console.log('Tokens remaining:', response.headers.get('x-ratelimit-remaining-tokens'))
    console.log('Reset requests:', response.headers.get('x-ratelimit-reset-requests'))
    console.log('Reset tokens:', response.headers.get('x-ratelimit-reset-tokens'))

    return {
      requestlimit: response.headers.get('x-ratelimit-limit-requests'),
      requestsremaining: response.headers.get('x-ratelimit-remaining-requests'),
      tokenslimit: response.headers.get('x-ratelimit-limit-tokens'),
      tokensremaining: response.headers.get('x-ratelimit-remaining-tokens'),
      resetrequests: response.headers.get('x-ratelimit-reset-requests'),
      resettokens: response.headers.get('x-ratelimit-reset-tokens')
    }
  }
}
