const mongoose = require('mongoose')
const Schema = mongoose.Schema
const draftContainerSchema = require('./DraftContainer')

const draftSchema = new Schema({
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  beverage: {
    type: Schema.Types.ObjectId,
    ref: 'Beverage'
  },
  container: draftContainerSchema
}, {
  timestamps: true
})

module.exports = mongoose.model('Draft', draftSchema)
