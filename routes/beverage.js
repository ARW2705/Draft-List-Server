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
    Beverage.find({})
      .then(beverages => {
        res.statusCode = 200
        res.setHeader('content-type', 'application/json')
        res.json(beverages)
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
      Beverage.create(parsedBody),
      imagePromise
    ])
    .then(([user, newBeverage, newImageFilename]) => {
      if (newImageFilename) newBeverage.imageURL = newImageFilename

      user.authoredList.push(newBeverage._id)
      return Promise.all([
        user.save(),
        newBeverage.save()
      ])
    })
    .then(([user, finalBeverage]) => {
      res.statusCode = 201
      res.setHeader('content-type', 'application/json')
      res.json(finalBeverage)
    })
    .catch(next)
  })

beverageRouter.route('/user')
  .get(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user.id)
      .then(user => Beverage.find({ _id: { $in: user.authoredList } }))
      .then(beverages => {
        res.statusCode = 200
        res.setHeader('content-type', 'application/json')
        res.json(beverages)
      })
      .catch(next)
  })

beverageRouter.route('/admin/:beverageId')
  .delete(authenticate.verifyUser, authenticate.verifyEditor, (req, res, next) => {
    Beverage.findByIdAndDelete(req.params.beverageId)
      .then(dbres => {
        return Promise.all([
          User.findById(dbres.author),
          imageHandler.deleteImage(dbres.imageURL)
        ])
      })
      .then(([user, imageDeletion]) => {
        if (user) {
          const indexToRemove = user.authoredList.findIndex(authored => {
            return authored.equals(req.params.beverageId)
          })
          if (indexToRemove !== -1) {
            user.authoredList.splice(indexToRemove, 1)
            return user.save().then(() => imageDeletion)
          }
        }
        return Promise.resolve(imageDeletion)
      })
      .then(imageDeletion => {
        const response = {
          success: imageDeletion ? 'partial' : 'successful',
          error: imageDeletion
        }
        res.statusCode = 200
        res.setHeader('content-type', 'application/json')
        res.json(response)
      })
      .catch(next)
  })

beverageRouter.route('/:beverageId')
  .get(authenticate.verifyUser, (req, res, next) => {
    Beverage.findById(req.params.beverageId)
      .then(beverages => {
        res.statusCode = 200
        res.setHeader('content-type', 'application/json')
        res.json(beverages)
      })
      .catch(next)
  })
  .patch(authenticate.verifyUser, upload.single('image'), (req, res, next) => {
    Beverage.findById(req.params.beverageId)
      .then(beverage => {
        if (!beverage) return next(createError(404, 'Beverage not found'))

        if (!req.user.admin && !req.user.editor && !beverage.author.equals(req.user.id)) {
          return next(createError(403, 'You do not have permission to change this beverage'))
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

        const indexToRemove = user.authoredList.findIndex(authored => {
          return authored.equals(req.params.beverageId)
        })
        if (indexToRemove !== -1) {
          user.authoredList.splice(indexToRemove, 1)
          return user.save()
        }
        return Promise.resolve(null)
      })
      .then(() => {
        res.statusCode = 200
        res.setHeader('content-type', 'application/json')
        res.json({ success: 'successful' })
      })
      .catch(next)
  })

module.exports = beverageRouter
