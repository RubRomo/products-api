import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'

export class EmailModel {
  static async sendContactEmail ({ name, email, message }) {
    const ses = new SESClient({ region: 'us-east-1' })

    const params = {
      Source: process.env.EMAIL_SOURCE,
      Destination: {
        ToAddresses: process.env.EMAIL_TOADDRESSES.split(',')
      },
      Message: {
        Subject: {
          Data: `Ruben's Portfolio - New message from ${name}`
        },
        Body: {
          Html: {
            Data: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden;">
                  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px; font-weight: 600;">New Contact Message</h1>
                  </div>
                  <div style="padding: 30px 20px;">
                    <div style="margin-bottom: 20px;">
                      <div style="font-weight: 600; color: #667eea; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px;">From</div>
                      <div style="background: #f9f9f9; padding: 12px 15px; border-left: 4px solid #667eea; border-radius: 4px; color: #333; line-height: 1.6;">${name}</div>
                    </div>
                    <div style="margin-bottom: 20px;">
                      <div style="font-weight: 600; color: #667eea; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px;">Email</div>
                      <div style="background: #f9f9f9; padding: 12px 15px; border-left: 4px solid #667eea; border-radius: 4px; color: #333; line-height: 1.6;"><a href="mailto:${email}" style="color: #667eea; text-decoration: none;">${email}</a></div>
                    </div>
                    <div style="margin-bottom: 20px;">
                      <div style="font-weight: 600; color: #667eea; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px;">Message</div>
                      <div style="background: #f0f4ff; padding: 15px; border-radius: 6px; border: 1px solid #e0e7ff; color: #333; line-height: 1.6; white-space: pre-wrap;">${message}</div>
                    </div>
                  </div>
                  <div style="background: #f9f9f9; padding: 20px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee;">
                    <p style="margin: 0;">This message was sent from Ruben's portfolio contact form.</p>
                  </div>
                </div>
              `
          }
        }
      }
    }

    await ses.send(new SendEmailCommand(params))
  }

  static async sendConfirmationEmail ({ email }) {
    const ses = new SESClient({ region: 'us-east-1' })

    const params = {
      Source: process.env.EMAIL_SOURCE,
      Destination: {
        ToAddresses: email
      },
      Message: {
        Subject: {
          Data: 'Ruben\'s Portfolio - Your message has been received'
        },
        Body: {
          Html: {
            Data: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center;">
                        <h1 style="margin: 0; font-size: 28px; font-weight: 600;">✓ Message Received</h1>
                    </div>
                    
                    <div style="padding: 30px 20px;">
                        <p style="color: #333; font-size: 16px; margin: 0 0 20px 0;">Hello,</p>
                        
                        <p style="color: #555; font-size: 14px; line-height: 1.8; margin: 0 0 20px 0;">Thank you for reaching out! I've received your message and appreciate you taking the time to contact me.</p>
                        
                        <div style="background: #f0f4ff; padding: 15px; border-radius: 6px; border-left: 4px solid #667eea; margin: 20px 0;">
                        <p style="margin: 0 0 10px 0; color: #667eea; font-weight: 600; font-size: 12px; text-transform: uppercase;">Ticket ID</p>
                        <p style="margin: 0; color: #333; font-size: 18px; font-weight: 600; font-family: monospace;">TKT-20260123001</p>
                        </div>

                        <p style="color: #555; font-size: 14px; line-height: 1.8; margin: 20px 0;">I'll review your message and get back to you as soon as possible. You can typically expect a response within <strong>24-48 hours</strong>.</p>

                        <div style="background: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
                        <p style="color: #667eea; font-weight: 600; font-size: 12px; text-transform: uppercase; margin: 0 0 8px 0;">What's next?</p>
                        <ul style="margin: 0; padding-left: 20px; color: #555; font-size: 14px;">
                            <li style="margin-bottom: 6px;">I'll review your message carefully</li>
                            <li style="margin-bottom: 6px;">I'll respond to your inquiry</li>
                            <li>Keep this email for your records with your ticket ID</li>
                        </ul>
                        </div>

                        <p style="color: #999; font-size: 13px; margin: 20px 0 0 0;">If you have any urgent matters, feel free to reach out directly.</p>
                    </div>
                    
                    <div style="background: #f9f9f9; padding: 20px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee;">
                        <p style="margin: 0;">This is an automated confirmation email. Please don't reply to this message.</p>
                    </div>
                </div>
              `
          }
        }
      }
    }

    await ses.send(new SendEmailCommand(params))
  }
}
