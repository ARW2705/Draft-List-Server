const createError = require('http-errors')
const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
const mongoose = require('mongoose')
const Bluebird = require('bluebird')
mongoose.Promise = Bluebird
const passport = require('passport')
const customErrorHandler = require('./shared/custom-error-handlers/custom-error-handler')

const apiVersion = '0.0.1'
const apiRoute = `draft_list_${apiVersion}`

const indexRouter = require('./routes/index')
const usersRouter = require('./routes/users')
const beverageRouter = require('./routes/beverage')
const deviceRouter = require('./routes/device')
const draftRouter = require('./routes/draft')
const imageRouter = require('./routes/image')
const containerRouter = require('./routes/container')

const connect = mongoose.connect(
  process.env.MONGO_URL,
  {
    keepAlive: true,
    keepAliveInitialDelay: 300000,
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
    useCreateIndex: true,
    autoIndex: process.env.PROD !== 'true'
  }
)

connect.then(
  () => console.log(`Draft List ${apiVersion} database connection established`),
  error => console.log(error)
)

const app = express()

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')

app.use(bodyParser.json())
app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

app.use(passport.initialize())

app.use('/', indexRouter)
app.use(`/${apiRoute}/users`, usersRouter)
app.use(`/${apiRoute}/drafts`, draftRouter)
app.use(`/${apiRoute}/devices`, deviceRouter)
app.use(`/${apiRoute}/beverages`, beverageRouter)
app.use(`/${apiRoute}/images`, imageRouter)
app.use(`/${apiRoute}/containers`, containerRouter)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404))
})

// mongo error handler
app.use((err, req, res, next) => {
  return next(customErrorHandler(err))
})

// error logger
app.use((err, req, res, next) => {
  console.error(err.stack)
  return next(err)
})

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // send error response
  if (req.url.includes(apiRoute)) {
    res.status(err.status || 500)
    res.setHeader('content-type', 'application/json')
    res.json({ message: err.message || '', status: err.status || 500 })
  } else {
    res.status(400)
    res.render('index', { title: 'Draft List API' })
  }
})

module.exports = app
