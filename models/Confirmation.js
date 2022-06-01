const mongoose = require('mongoose')
const Schema = mongoose.Schema

const confirmationSchema = new Schema({
  hardwareId: {
    type: String,
    required: true,
    unique: true
  },
  passcode: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: { expires: 5 * 60 }
  }
})

confirmationSchema.index({ hardwareId: 1 })

module.exports = mongoose.model('Confirmation', confirmationSchema)
