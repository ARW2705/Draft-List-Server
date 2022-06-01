const express = require('express')
const bodyParser = require('body-parser')
const passport = require('passport')
const createError = require('http-errors')
const User = require('../models/User')
const authenticate = require('../authenticate')

const userRouter = express.Router()
userRouter.use(bodyParser.json())


userRouter.route('/')
  .get(authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user.id)
      .then(user => {
        if (!user) return next(createError(404, 'User not found'))

        const { username, email, deviceList, authoredList } = user
        res.statusCode = 200
        res.setHeader('content-type', 'application/json')
        res.json({
          username,
          email,
          deviceList,
          authoredList
        })
      })
  })

userRouter.get('/checkUserJWT', (req, res, next) => {
  passport.authenticate('UserStrategy', {session: false}, (error, user, data) => {
    if (error) return next(error)

    if (!user) {
      res.statusCode = 401
      res.setHeader('content-type', 'application/json')
      return res.json({
        status: 'JWT invalid',
        success: false,
        user: null,
        error: data
      })
    } else {
      res.statusCode = 200
      res.setHeader('content-type', 'application/json')
      return res.json({
        user,
        status: 'JWT valid',
        success: true,
        error: null
      })
    }
  })(req, res, next)
})

userRouter.post('/login', (req, res, next) => {
  passport.authenticate('local', (error, user, data) => {
    if (error) return next(error)

    if (!user) {
      res.statusCode = 401
      res.setHeader('content-type', 'application/json')
      return res.json({success: false, status: 'login unsuccessful', error: data})
    }

    res.statusCode = 200
    res.setHeader('content-type', 'application/json')
    return res.json({
      success: true,
      status: 'login successful',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        token: authenticate.getUserToken({_id: user._id})
      }
    })
  })(req, res, next)
})

userRouter.post('/signup', (req, res, next) => {
  User.find({})
    .then(users => {
      if (users && users.length > 20) {
        res.statusCode = 423
        res.setHeader('content-type', 'application/json')
        return res.json({success: false, status: 'Max users reached for this version: contact admin'})
      }
      return null
    })
    .then(() => {
      User.register(
        new User({
          username: req.body.username,
          email: req.body.email
        }),
        req.body.password,
        (error, user) => {
          if (error) return next(createError(400, error))

          passport.authenticate('local')(req, res, () => {
            res.statusCode = 200
            res.setHeader('content-type', 'application/json')
            res.json({
              success: true,
              status: 'registration successful',
              token: authenticate.getUserToken({ _id: user._id })
            })
          })
        }
      )
    })
})

module.exports = userRouter
