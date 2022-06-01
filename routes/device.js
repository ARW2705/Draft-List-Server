const express = require('express')
const bodyParser = require('body-parser')
const createError = require('http-errors')
const authenticate = require('../authenticate')
const User = require('../models/User')
const Device = require('../models/Device')
const Draft = require('../models/Draft')
const Confirmation = require('../models/Confirmation')
const DeviceToken = require('../models/DeviceToken')
const multer = require('multer')
const upload = multer({
  dest: 'draft-list-uploads/tmp/',
  limits: {
    fileSize: 1000 * 1000, // 1MB limit
    files: 1
  }
})
const imageHandler = require('../shared/image-handler')

const deviceRouter = express.Router()
deviceRouter.use(bodyParser.json())

// 400 response on non /admin or /client routes
deviceRouter.route('/')
  .get((req, res, next) => res.send(400))
  .post((req, res, next) => res.send(400))

/***** Admin Routes *****/

deviceRouter.route('/admin')
  .get(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user.id)
      .populate('deviceList')
      .then(user => {
        if (!user) return next(createError(404, 'User not found'))

        res.statusCode = 200
        res.setHeader('content-type', 'application/json')
        res.json(user.deviceList)
      })
      .catch(next)
  })
  .post(authenticate.verifyUser, upload.single('image'), (req, res, next) => {
    const parsedBody = {
      ...(JSON.parse(req.body.data)),
      author: req.user.id
    }
    const imagePromise = req.file ? imageHandler.storeImage(req.file) : Promise.resolve(null)

    Promise.all([
      User.findById(req.user.id),
      Device.create(parsedBody),
      imagePromise
    ])
    .then(([user, newDevice, newImageFilename]) => {
      if (newImageFilename) newDevice.imageURL = newImageFilename

      user.deviceList.push(newDevice)
      return Promise.all([
        user.save(),
        newDevice.save()
      ])
    })
    .then(([use, finalDevice]) => {
      res.statusCode = 201
      res.setHeader('content-type', 'application/json')
      res.json(finalDevice)
    })
    .catch(next)
  })

deviceRouter.route('/admin/confirm')
  .post(authenticate.verifyUser, (req, res, next) => {
    Confirmation.create(req.body)
      .then(() => res.sendStatus(200))
      .catch(next)
  })

deviceRouter.route('/admin/:deviceId')
  .get(authenticate.verifyUser, (req, res, next) => {
    Device.findById(req.params.deviceId)
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
      .then(device => {
        if (!device) return next(createError(404, 'Device not found'))

        if (!device.author.equals(req.user.id)) {
          return next(createError(403, 'You do not have permission to access this device'))
        }

        res.statusCode = 200
        res.setHeader('content-type', 'application/json')
        res.json(device)
      })
      .catch(next)
  })
  .patch(authenticate.verifyUser, upload.single('image'), (req, res, next) => {
    Device.findById(req.params.deviceId)
      .then(device => {
        if (!device) return next(createError(404, 'Device not found'))

        if (!req.user.admin && !req.user.editor && !device.author.equals(req.user.id)) {
          return next(createError(403, 'You do not have permission to change this device'))
        }

        const parsedBody = JSON.parse(req.body.data)
        return Device.findByIdAndUpdate(req.params.deviceId, { $set: parsedBody }, { new: true })
      })
      .then(preImageStoreDevice => {
        if (req.file) {
          return imageHandler.replaceImage(req.file, preImageStoreDevice.imageURL)
            .then(newImageFilename => {
              preImageStoreDevice.imageURL = newImageFilename
              return preImageStoreDevice.save()
            })
        }
        return Promise.resolve(preImageStoreDevice)
      })
      .then(updatedDevice => {
        res.statusCode = 200
        res.setHeader('content-type', 'application/json')
        res.json(updatedDevice)
      })
      .catch(next)
  })
  .delete(authenticate.verifyUser, (req, res, next) => {
    Promise.all([
      User.findById(req.user.id),
      Device.findById(req.params.deviceId)
    ])
    .then(([user, device]) => {
      if (!user || !device) return next(createError(404, `${ user ? 'Device' : 'User' } not found`))

      if (!device.author.equals(user._id)) {
        return next(createError(400, 'Cannot delete device from another user'))
      }

      return Promise.all(device.draftList.map(draft => Draft.findByIdAndDelete(draft.id)))
        .then(draftDeletions => {
          return Device.findByIdAndDelete(req.params.deviceId)
        })
        .then(dbres => {
          const deviceIndex = user.deviceList.findIndex(dev => dev.equals(req.params.deviceId))
          user.deviceList.splice(deviceIndex, 1)
          return user.save().then(() => dbres)
        })
    })
    .then(dbres => {
      res.statusCode = 200
      res.setHeader('content-type', 'application/json')
      res.json(dbres)
    })
    .catch(next)
  })

/***** End Admin Routes *****/


/***** Client Routes *****/

deviceRouter.post('/client/register', (req, res, next) => {
  Confirmation.findOne({ hardwareId: req.body.hardwareId })
    .then(confirmation => {
      if (confirmation) {
        if (confirmation.passcode === req.body.passcode) {
          return Device.findOne({ hardwareId: req.body.hardwareId })
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
        }
        res.statusCode = 204
        res.setHeader('content-type', 'application/json')
        res.json({ success: false, reason: 'Passcode does not match' })
      } else {
        res.statusCode = 202
        res.setHeader('content-type', 'application/json')
        res.json({ success: false, reason: 'Device confirmation has not yet been submitted' })
      }
      return null
    })
    .then(device => {
      if (device) {
        const accessToken = authenticate.getDeviceToken({ _id: device._id })
        const refreshToken = authenticate.getDeviceRefreshToken({ _id: device._id })
        return DeviceToken.create({ hardwareId: device.hardwareId, token: refreshToken })
          .then(() => {
            res.statusCode = 200
            res.setHeader('content-type', 'application/json')
            res.json({ success: true, device, accessToken, refreshToken })
          })
      }
    })
    .catch(next)
})

deviceRouter.post('/client/refresh', (req, res, next) => {
  Promise.all([
    DeviceToken.findOne({ hardwareId: req.body.hardwareId }),
    Device.findOne({ hardwareId: req.body.hardwareId })
  ])
  .then(([ deviceToken, device ]) => {
    if (!deviceToken) return next(createError(404, 'Refresh token not found'))
    if (!device) return next(createError(404, 'Device not found'))
    if (
      !authenticate.verifyDeviceRefreshToken(req.body.refreshToken)
      || deviceToken.token !== req.body.refreshToken
    ) {
      return next(createError(403, 'Invalid refresh token'))
    }

    const accessToken = authenticate.getDeviceToken({ _id: device._id })
    res.statusCode = 200
    res.setHeader('content-type', 'application/json')
    res.json({ success: true, accessToken })
  })
  .catch(next)
})

deviceRouter.get('/client/:deviceId', authenticate.verifyDeviceClient, (req, res, next) => {
  Device.findById(req.params.deviceId)
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
    .then(device => {
      res.statusCode = 200
      res.setHeader('content-type', 'application/json')
      res.json(device)
    })
    .catch(next)
})

/***** End Client Routes *****/

module.exports = deviceRouter
