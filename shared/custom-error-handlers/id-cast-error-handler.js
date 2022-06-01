const createError = require('http-errors')

module.exports = error => {
  const texts = error.message.split('"')
  const model = texts[texts.length - 2] // second from last will contain error source
  const message = `Received ${model} id is malformed`
  return createError(400, message)
}
