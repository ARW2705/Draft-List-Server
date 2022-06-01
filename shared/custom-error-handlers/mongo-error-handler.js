const createError = require('http-errors')

const createMongoError = error => {
  // TODO: parse mongo error other than 'unique' errors
  console.log('mongo error', error)
  return createError(400, error)
}

module.exports = createMongoError
