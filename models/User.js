const mongoose = require('mongoose')
const Schema = mongoose.Schema
const passportLocalMongoose = require('passport-local-mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  admin: {
    type: Boolean,
    default: false
  },
  editor: {
    type: Boolean,
    default: false
  },
  deviceList: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Device'
    }
  ],
  authoredList: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Beverage'
    }
  ],
  previousList: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Beverage'
    }
  ]
}, {
  timestamps: true
})

userSchema.plugin(passportLocalMongoose)
userSchema.plugin(uniqueValidator)

module.exports = mongoose.model('User', userSchema)
