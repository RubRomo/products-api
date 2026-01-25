import { Router } from 'express'
import { EmailController } from '../controllers/email-controller.js'

export const EmailRouter = Router()

EmailRouter.post('/send', EmailController.sendContactEmail)
