import { EmailModel } from '../models/email.js'

export class EmailController {
  static async sendContactEmail (req, res) {
    const { name, email, message } = req.body
    try {
      await EmailModel.sendContactEmail({ name, email, message })
      // await EmailModel.sendConfirmationEmail({ email }) ses production environment not verified yet
      res.json({ success: true })
    } catch (e) {
      res.status(500).json({ error: 'Sorry there was a problem processing your request' + e.message })
    }
  }
}
