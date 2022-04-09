const createError = require('http-errors')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const JwtStrategy = require('passport-jwt').Strategy
const ExtractJwt = require('passport-jwt').ExtractJwt
const jsonwebtoken = require('jsonwebtoken')
const User = require('./models/User')
const TOKEN_KEY = process.env.TOKEN_KEY

passport.use(new LocalStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

const opts = {}
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken()
opts.secretOrKey = TOKEN_KEY

passport.use(new JwtStrategy(opts, (jwt_payload, done) => {
  User.findOne({id: jwt_payload.sub}, (error, user) => {
    if (error) {
      return done(error, false)
    }

    if (user) {
      return done(null, user)
    } else {
      return done(null, false)
    }
  })
}))

exports.getToken = user => jsonwebtoken.sign(user, TOKEN_KEY, { expiresIn: '30d' })

exports.verifyUser = passport.authenticate('jwt', { session: false })

exports.verifyAdmin = (req, res, next) => req.user.admin ? next() : next(createError(403))

exports.verifyEditor = (req, res, next) => {
  return (req.user.editor || req.user.admin) ? next() : next(createError(403))
}
