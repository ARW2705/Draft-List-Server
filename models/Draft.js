const mongoose = require('mongoose')
const Schema = mongoose.Schema
const draftContainerSchema = require('./DraftContainer')
const historySchema = require('./History')

const draftSchema = new Schema({
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  beverage: {
    type: Schema.Types.ObjectId,
    ref: 'Beverage'
  },
  container: draftContainerSchema,
  history: [ historySchema ]
}, {
  timestamps: true
})

module.exports = mongoose.model('Draft', draftSchema)
