const mongoose = require('mongoose')
const Schema = mongoose.Schema
const beverageSchema = require('./Beverage')
const containerSchema = require('./Schema')

const draftSchema = new Schema({
  isActive: {
    type: Boolean,
    required: true
  },
  beverage: beverageSchema,
  container: containerSchema
}, {
  timestamps: true
})

module.exports = mongoose.model('Draft', draftSchema)
