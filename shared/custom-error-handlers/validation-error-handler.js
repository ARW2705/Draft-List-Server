const createError = require('http-errors')

const createValidationError = error => {
  let errMsg = 'ValidationError'
  const { errors } = error
  for (const key in errors) {
    const error = errors[key]
    errMsg += `: ${error.path} must be ${error.kind}`
  }
  return createError(400, errMsg)
}

module.exports = createValidationError
