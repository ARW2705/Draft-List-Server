const express = require('express')
const bodyParser = require('body-parser')
const createError = require('http-errors')
const authenticate = require('../authenticate')
const User = require('../models/User')
const Draft = require('../models/Draft')
const Device = require('../models/Device')

const draftRouter = express.Router()
draftRouter.use(bodyParser.json())

draftRouter.route('/')
  .get(authenticate.verifyUser, (req, res, next) => {
    const page = parseInt(req.query.page)
    const count = parseInt(req.query.count)

    Draft.find({})
      .sort({ _id: 1 })
      .skip(page * count)
      .limit(count)
      .populate('container.containerInfo')
      .then(draftList => {
        res.statusCode = 200
        res.setHeader('content-type', 'application/json')
        res.json(draftList)
      })
      .catch(next)
  })

draftRouter.route('/:draftId')
  .get(authenticate.verifyUser, (req, res, next) => {
    Draft.findById(req.params.draftId)
      .populate('container.containerInfo')
      .then(draft => {
        if (!draft) return next(createError(404, 'Draft not found'))
      
        res.statusCode = 200
        res.setHeader('content-type', 'application/json')
        res.json(draft)
      })
      .catch(next)
  })
  .patch(authenticate.verifyUser, (req, res, next) => {
    Draft.findByIdAndUpdate(req.params.draftId, { $set: req.body }, { new: true })
      .populate('container.containerInfo')
      .then(updatedDraft => {
        res.statusCode = 200
        res.setHeader('content-type', 'application/json')
        res.json(updatedDraft)
      })
  })

draftRouter.route('/device/:deviceId')
  .post(authenticate.verifyUser, (req, res, next) => {
    Device.findById(req.params.deviceId)
      .then(device => {
        if (!device) return next(createError(404, 'Device not found'))

        return Draft.create({
          author: req.user.id,
          beverage: req.body.beverage,
          container: req.body.container
        })
        .populate('beverage')
        .populate('container.containerInfo')
        .then(draft => {
          device.draftList.push(draft)
          return device.save()
            .then(() => {
              res.statusCode = 200
              res.setHeader('content-type', 'application/json')
              res.json(draft)
            })
        })
      })
      .catch(next)
  })

draftRouter.route('/device/:deviceId/draft/:draftId')
  .get(authenticate.verifyUser, (req, res, next) => {
    Device.findById(req.params.deviceId)
      .then(device => {
        if (!device.draftList.includes(req.params.draftId)) {
          return next(createError(400, 'Draft does not belong to device'))
        }

        return Draft.findById(req.params.draftId)
          .populate('container.containerInfo')
      })
      .then(draft => {
        res.statusCode = 200
        res.setHeader('content-type', 'application/json')
        res.json(draft)
      })
      .catch(next)
  })

module.exports = draftRouter
