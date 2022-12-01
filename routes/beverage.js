const express = require('express')
const bodyParser = require('body-parser')
const createError = require('http-errors')
const authenticate = require('../authenticate')
const Beverage = require('../models/Beverage')
const User = require('../models/User')
const multer = require('multer')
const upload = multer({
  dest: 'draft-list-uploads/tmp/',
  limits: {
    fileSize: 500 * 1000, // 500kB limit
    files: 1
  }
})
const imageHandler = require('../shared/image-handler')

const beverageRouter = express.Router()
beverageRouter.use(bodyParser.json())

beverageRouter.route('/')
  .get(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user.id)
      .then(user => {
        if (!user) return next(createError(404, 'User not found'))

        return Beverage.find({ _id: { $in: user.beverageList }})
      })
      .then(beverageList => {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json')
        res.json(beverageList)
      })
      .catch(next)
  })
  .post(authenticate.verifyUser, upload.single('image'), (req, res, next) => {
    const parsed = JSON.parse(req.body.data)
    const { name, source, style } = parsed
    const parsedBody = {
      ...parsed,
      name_lower: name.toLowerCase(),
      source_lower: source.toLowerCase(),
      style_lower: style.toLowerCase(),
      author: req.user.id
    }
    const imagePromise = req.file ? imageHandler.storeImage(req.file) : Promise.resolve(null)

    Promise.all([
      User.findById(req.user.id),
      Beverage.create(parsedBody),
      imagePromise
    ])
    .then(([user, newBeverage, newImageFilename]) => {
      if (newImageFilename) newBeverage.imageURL = newImageFilename

      user.beverageList.push(newBeverage._id)
      return Promise.all([
        user.save(),
        newBeverage.save()
      ])
    })
    .then(([_, finalNewBeverage]) => {
      res.statusCode = 201
      res.setHeader('content-type', 'application/json')
      res.json(finalNewBeverage)
    })
    .catch(next)
  })

beverageRouter.route('/query')
  .get(authenticate.verifyUser, (req, res, next) => {
    let query, page, count
    if (Object.keys(req.query).length > 2) {
      page = parseInt(req.query.page)
      count = parseInt(req.query.count)
      if (req.query.name) {
        query = { name_lower: req.query.name.toLowerCase(), author: req.user.id }
      } else if (req.query.source) {
        query = { source_lower: req.query.source.toLowerCase(), author: req.user.id }
      } else if (req.query.style) {
        query = { style_lower: req.query.style.toLowerCase(), author: req.user.id }
      } else {
        return next(createError(400, 'Missing or invalid query type'))
      }
    } else {
      return next(createError(400, 'Missing queries'))
    }

    Beverage
      .find(query)
      .sort({ _id: 1 })
      .skip(page * count)
      .limit(count)
      .then(beverages => {
        res.statusCode = 200
        res.setHeader('content-type', 'application/json')
        res.json(beverages.map(beverage => beverage._id))
      })
      .catch(next)
  })

beverageRouter.route('/:beverageId')
  .get(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user.id)
      .then(user => {
        if (!user) return next(createError(404, 'User not found'))

        if (!user.beverageList.some(beverage => beverage.equals(req.params.beverageId))) {
          return next(createError(403, 'Beverage does not belong to user'))
        }

        return Beverage.findById(req.params.beverageId)
      })
      .then(beverage => {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json')
        res.json(beverage)
      })
      .catch(next)
  })
  .patch(authenticate.verifyUser, upload.single('image'), (req, res, next) => {
    User.findById(req.user.id)
      .then(user => {
        if (!user) return next(createError(404, 'User not found'))

        if (!user.beverageList.some(beverage => beverage.equals(req.params.beverageId))) {
          return next(createError(403, 'Beverage does not belong to user'))
        }

        const parsedBody = JSON.parse(req.body.data)

        return Beverage.findByIdAndUpdate(req.params.beverageId, { $set: parsedBody }, { new: true })
      })
      .then(preImageStoreBeverage => {
        if (req.file) {
          return imageHandler.replaceImage(req.file, preImageStoreBeverage.imageURL)
            .then(newImageFilename => {
              preImageStoreBeverage.imageURL = newImageFilename
              return preImageStoreBeverage.save()
            })
        }
        return Promise.resolve(preImageStoreBeverage)
      })
      .then(updatedBeverage => {
        res.statusCode = 200
        res.setHeader('content-type', 'application/json')
        res.json(updatedBeverage)
      })
      .catch(next)
  })
  .delete(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user.id)
      .then(user => {
        if (!user) return next(createError(404, 'User not found'))

        if (!user.beverageList.some(beverage => beverage.equals(req.params.beverageId))) {
          return next(createError(403, 'Beverage does not belong to user'))
        }

        return Promise.all([
          Promise.resolve(user),
          Beverage.findById(req.params.beverageId)
        ])
      })
      .then(([user, beverage]) => {
        return Promise.all([
          Promise.resolve(user),
          imageHandler.deleteImage(beverage.imageURL),
          Beverage.findByIdAndDelete(req.params.beverageId)
        ])
      })
      .then(([user, imageDeletion, dbres]) => {
        const indexToRemove = user.beverageList.findIndex(beverage => {
          return beverage.equals(dbres._id)
        })
        if (indexToRemove !== -1) {
          user.beverageList.splice(indexToRemove, 1)
          return user.save().then(() => imageDeletion)
        }
      })
      .then(imageDeletion => {
        const response = {
          success: imageDeletion ? 'partial' : 'successful',
          error: imageDeletion ? null : 'Image removal error'
        }
        res.statusCode = 200
        res.setHeader('content-type', 'application/json')
        res.json(response)
      })
      .catch(next)
  })

beverageRouter.route('/client/:beverageId')
  .get(authenticate.verifyDeviceClient, (req, res, next) => {
    Beverage.findById(req.params.beverageId)
      .then(beverage => {
        if (!beverage) return next(createError(404, 'Beverage not found'))

        res.statusCode = 200
        res.setHeader('content-type', 'application/json')
        res.json(beverage)
      })
      .catch(next)
  })

module.exports = beverageRouter
