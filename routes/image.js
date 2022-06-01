const express = require('express')
const createError = require('http-errors')
const authenticate = require('../authenticate')
const imageHandler = require('../shared/image-handler')

const imageRouter = express.Router()

imageRouter.get('/admin/:imageId', authenticate.verifyUser, (req, res, next) => {
  res.sendFile(imageHandler.getImagePath(req.params.imageId), error => {
    if (error) return next(createError(404, 'Image not found'))
  })
})

imageRouter.get('/client/:imageId', (req, res, next) => {
  res.sendFile(imageHandler.getImagePath(req.params.imageId), error => {
    if (error) return next(createError(404, 'Image not found'))
  })
})

module.exports = imageRouter
