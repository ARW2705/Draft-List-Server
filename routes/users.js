const express = require('express')
const passport = require('passport')
const createError = require('http-errors')
const User = require('../models/User')
const authenticate = require('../authenticate')

const userRouter = express.Router()

userRouter.get('/checkJWT', (req, res) => {
  passport.authenticate('jwt', {session: false}, (error, user, data) => {
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
        status: 'JWT valid',
        success: true,
        user: user,
        error: null
      })
    }
  })(req, res)
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
        id: user.id,
        username: user.username,
        email: user.email,
        token: authenticate.getToken({_id: req.user._id})
      }
    })
  })
})

userRouter.post('/signup', async (req, res, next) => {
  const users = await User.find({})
  if (users.length > 20) {
    res.statusCode = 423
    res.setHeader('content-type', 'application/json')
    return res.json({success: false, status: 'Max users reached for this version: contact admin'})
  }

  const parsedDoc = JSON.parse(req.body.user)
  req.body['username'] = parsedDoc.username
  req.body['password'] = parsedDoc.password

  User.register(
    new User({
      username: parsedDoc.username,
      email: parsedDoc.email
    }),
    parsedDoc.password,
    (error, user) => {
      if (error) return next(error)

      req.login(user, error => {
        if (error) return next(error)

        res.statusCode = 200
        res.setHeader('content-type', 'application/json')
        res.json({
          success: true,
          status: 'registration successful',
          token: authenticate.getToken({ _id: user._id })
        })
      })
    }
  )
})
