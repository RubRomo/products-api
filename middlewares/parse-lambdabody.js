export function parseLambdaBody (req, res, next) {
  // Si el body ya está parseado (un objeto), continuar
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return next()
  }

  try {
    // Si el body es un buffer (como en serverless-http)
    if (Buffer.isBuffer(req.body)) {
      const str = req.body.toString('utf-8')
      req.body = JSON.parse(str)
    } else if (typeof req.body === 'string' && /^[A-Za-z0-9+/=]+$/.test(req.body)) {
      // Si es base64 string (en algunos eventos Lambda)
      const buff = Buffer.from(req.body, 'base64')
      const str = buff.toString('utf-8')
      req.body = JSON.parse(str)
    }
  } catch (err) {
    console.warn('No se pudo parsear el body:', err.message)
    // en caso de error, mantener el body como string
  }
  next()
}
