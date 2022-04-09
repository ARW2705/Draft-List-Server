const mongoose = require('mongoose')
const Schema = mongoose.Schema
const passportLocalMongoose = require('passport-local-mongoose')

const UserSchema = new Schema({
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
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
  ]
}, {
  timestamps: true
})

userSchema.plugin(passportLocalMongoose)

module.exports = mongoose.model('User', UserSchema)
