const mongoose = require('mongoose')
const Schema = mongoose.Schema

const containerSchema = new Schema({
  type: {
    type: String,
    required: true
  },
  capacity: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  contentColor: {
    type: String
  }
})

module.exports = containerSchema
