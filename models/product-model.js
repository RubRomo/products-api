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
        name: 'getProducts',
        description: 'Get list of available products.'
      }
    ]

    // Create a running input list we will add to over time
    let input = [
      { role: 'user', content: 'What are the available products.' }
    ]

    const agentResponse = await openai.responses.create({
      model: 'gpt-4o-mini',
      tools,
      input
    })

    input = input.concat(agentResponse.output)

    await Promise.all(
      agentResponse.output.map(async (item) => {
        if (item.type === 'function_call') {
          const functionResult = await ProductModel.callFunction(item.name, JSON.parse(item.arguments))
          input.push({
            type: 'function_call_output',
            call_id: item.call_id,
            output: JSON.stringify(functionResult)
          })
        }
      })
    )

    console.log(input)

    const response = await openai.responses.create({
      model: 'gpt-4o-mini',
      instructions: 'Make simple friendly response with the function_call_output results provided.',
      tools,
      input
    })

    console.log(response)
    return response.output_text
  }

  static async callFunction (name, args) {
    if (name === 'getProducts') {
      return ProductModel.getProducts()
    }
    return 'Not found'
  }
}
