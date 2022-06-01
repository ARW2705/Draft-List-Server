const mongoose = require('mongoose')
const Schema = mongoose.Schema

const containerSchema = new Schema({
  type: {
    type: String,
    required: true,
    unique: true
  },
  capacity: {
    type: Number,
    required: true
  }
})

containerSchema.index({ type: 1 })

module.exports = mongoose.model('Container', containerSchema)
