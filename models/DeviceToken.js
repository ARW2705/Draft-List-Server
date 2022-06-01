const mongoose = require('mongoose')
const Schema = mongoose.Schema

const deviceTokenSchema = new Schema({
  hardwareId: {
    type: String,
    required: true,
    unique: true
  },
  token: {
    type: String,
    required: true
  }
})

deviceTokenSchema.index({ hardwareId: 1 })

module.exports = mongoose.model('DeviceToken', deviceTokenSchema)
