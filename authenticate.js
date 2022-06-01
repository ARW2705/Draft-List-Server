const createError = require('http-errors')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const JwtStrategy = require('passport-jwt').Strategy
const ExtractJwt = require('passport-jwt').ExtractJwt
const jsonwebtoken = require('jsonwebtoken')
const User = require('./models/User')
const Device = require('./models/Device')

passport.use(new LocalStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

const USER_TOKEN_KEY = process.env.USER_TOKEN_KEY
const userOpts = {}
userOpts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken()
userOpts.secretOrKey = USER_TOKEN_KEY
passport.use('UserStrategy', new JwtStrategy(userOpts, (jwt_payload, done) => {
  User.findOne({_id: jwt_payload._id}, (error, user) => {
    if (error) return done(error, false)

    if (user) {
      return done(null, user)
    } else {
      return done(null, false)
    }
  })
}))

const DEVICE_TOKEN_KEY = process.env.DEVICE_TOKEN_KEY
const DEVICE_REFRESH_TOKEN_KEY = process.env.DEVICE_REFRESH_TOKEN_KEY
const deviceOpts = {}
deviceOpts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken()
deviceOpts.secretOrKey = DEVICE_TOKEN_KEY
passport.use('DeviceStrategy', new JwtStrategy(deviceOpts, (jwt_payload, done) => {
  Device.findOne({_id: jwt_payload._id}, (error, device) => {
    if (error) return done(error, false)

    if (device) {
      return done(null, device)
    } else {
      return done(null, false)
    }
  })
}))

exports.getUserToken = user => jsonwebtoken.sign(user, USER_TOKEN_KEY, { expiresIn: '30d' })
exports.verifyUser = passport.authenticate('UserStrategy', { session: false })
exports.verifyAdmin = (req, res, next) => req.user.admin ? next() : next(createError(403))
exports.verifyEditor = (req, res, next) => {
  return (req.user.editor || req.user.admin) ? next() : next(createError(403))
}

exports.getDeviceToken = device => {
  return jsonwebtoken.sign(device, DEVICE_TOKEN_KEY, { expiresIn: '1d' })
}
exports.getDeviceRefreshToken = device => {
  return jsonwebtoken.sign(device, DEVICE_REFRESH_TOKEN_KEY)
}
exports.verifyDeviceClient = passport.authenticate('DeviceStrategy', { session: false })
exports.verifyDeviceRefreshToken = token => jsonwebtoken.verify(token, DEVICE_REFRESH_TOKEN_KEY)
