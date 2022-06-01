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
    User.findById(req.user.id)
      .populate({
        path: 'draftList',
        populate: {
          path: 'beverage'
        }
      })
      .populate({
        path: 'draftList',
        populate: {
          path: 'container.containerInfo'
        }
      })
      .then(user => {
        if (!user) return next(createError(404, 'User not found'))

        const fullDraftList = []
        user.deviceList.forEach(device => {
          device.draftList.forEach(draft => {
            if (!req.query.isActive || draft.isActive) {
              fullDraftList.push(draft)
            }
          })
        })
        return Draft.find({ _id: { $in: fullDraftList } })
      })
      .then(draftList => {
        res.statusCode = 200
        res.setHeader('content-type', 'application/json')
        res.json(draftList)
      })
      .catch(next)
  })

draftRouter.route('/device/:deviceId')
  .get(authenticate.verifyUser, (req, res, next) => {
    Device.findById(req.params.deviceId)
      .populate('draftList')
      .then(device => {
        if (!device) return next(createError(404, 'Device not found'))
        if (!device.author.equals(req.user.id)) return next(createError(403, 'Device does not belong to user'))

        const fullDraftList = []
        device.draftList.forEach(draft => {
          if (!req.query.isActive || draft.isActive) {
            fullDraftList.push(draft)
          }
        })

        return Draft.find({ _id: { $in: fullDraftList } })
          .populate({
            path: 'draftList',
            populate: {
              path: 'beverage'
            }
          })
          .populate({
            path: 'draftList',
            populate: {
              path: 'container.containerInfo'
            }
          })
      })
      .then(draftList => {
        res.statusCode = 200
        res.setHeader('content-type', 'application/json')
        res.json(draftList)
      })
  })
  .post(authenticate.verifyUser, (req, res, next) => {
    Device.findById(req.params.deviceId)
      .then(device => {
        if (!device) return next(createError(404, 'Device not found'))
        if (!device.author.equals(req.user.id)) {
          return next(createError(403, 'Device does not belong to user'))
        }

        if (req.body.beverage.contentColor) {
          req.body.container.contentColor = req.body.beverage.contentColor
        }
        Object.assign(req.body, { author: req.user.id })
        return Draft.create(req.body)
          .then(draft => {
            device.draftList.push(draft)
            return device.save().then(() => draft)
          })
      })
      .then(newDraft => {
        res.statusCode = 201
        res.setHeader('content-type', 'application/json')
        res.json(newDraft)
      })
      .catch(next)
  })

draftRouter.route('/:draftId')
  .get(authenticate.verifyUser, (req, res, next) => {
    Promise.all([
      User.findById(req.user.id),
      Draft.findById(req.params.draftId)
        .populate({
          path: 'draftList',
          populate: {
            path: 'beverage'
          }
        })
        .populate({
          path: 'draftList',
          populate: {
            path: 'container.containerInfo'
          }
        })
    ])
    .then(([user, draft]) => {
      if (!user || !draft) return next(createError(404, `${ user ? 'Draft' : 'User' } not found`))

      if (!user.equals(draft.author)) {
        return next(createError(400, 'Draft does not belong to the current user'))
      }

      res.statusCode = 200
      res.setHeader('content-type', 'application/json')
      res.json(draft)
    })
    .catch(next)
  })
  .patch(authenticate.verifyUser, (req, res, next) => {
    Promise.all([
      User.findById(req.user.id),
      Draft.findById(req.params.draftId)
    ])
    .then(([user, draft]) => {
      if (!user || !draft) return next(createError(404, `${ user ? 'Draft' : 'User' } not found`))

      if (!user.equals(draft.author)) {
        return next(createError(400, 'Draft does not belong to the current user'))
      }

      return Draft.findByIdAndUpdate(req.params.draftId, { $set: req.body }, { new: true })
        .populate({
          path: 'draftList',
          populate: {
            path: 'beverage'
          }
        })
        .populate({
          path: 'draftList',
          populate: {
            path: 'container.containerInfo'
          }
        })
    })
    .then(updatedDraft => {
      res.statusCode = 200
      res.setHeader('content-type', 'application/json')
      res.json(updatedDraft)
    })
    .catch(next)
  })

module.exports = draftRouter
