const createError = require('http-errors')
const createValidationError = require('./validation-error-handler')
const createMongoError = require('./mongo-error-handler')
const createIdCastError = require('./id-cast-error-handler')

const parseError = error => {
  if (error.name) {
    const errorName = error.name.toLowerCase()
    if (errorName === 'validationerror') {
      return createValidationError(error)
    } else if (errorName === 'mongoerror') {
      return createMongoError(error)
    } else if (errorName === 'casterror') {
      return createIdCastError(error)
    }
  }
  return createError(error)
}

module.exports = parseError
