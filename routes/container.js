const express = require('express')
const bodyParser = require('body-parser')
const createError = require('http-errors')
const authenticate = require('../authenticate')
const Container = require('../models/Container')

const containerRouter = express.Router()
containerRouter.use(bodyParser.json())


containerRouter.route('/')
  .get(authenticate.verifyUser, (req, res, next) => {
    Container.find({})
      .then(containers => {
        res.statusCode = 200
        res.setHeader('content-type', 'application/json')
        res.json(containers)
      })
      .catch(next)
  })
  .post(authenticate.verifyUser, (req, res, next) => {
    Container.create(req.body)
      .then(container => {
        res.statusCode = 201
        res.setHeader('content-type', 'application/json')
        res.json(container)
      })
      .catch(next)
  })

containerRouter.route('/:containerId')
  .get(authenticate.verifyEditor, (req, res, next) => {
    Container.findById(req.user.id)
      .then(container => {
        if (!container) return next(createError(404, 'Container not found'))

        res.statusCode = 200
        res.setHeader('content-type', 'application/json')
        res.json(container)
      })
      .catch(next)
  })
  .patch(authenticate.verifyEditor, (req, res, next) => {
    Container.findByIdAndUpdate(req.params.containerId, { $set: req.body }, { new: true })
      .then(updatedContainer => {
        if (!container) return next(createError(404, 'Container not found'))

        res.statusCode = 200
        res.setHeader('content-type', 'application/json')
        res.json(updatedContainer)
      })
      .catch(next)
  })
  .delete(authenticate.verifyAdmin, (req, res, next) => {
    Container.findByIdAndDelete(req.params.containerId)
      .then(dbres => {
        res.statusCode = 200
        res.setHeader('content-type', 'application/json')
        res.json(dbres)
      })
      .catch(next)
  })

module.exports = containerRouter
