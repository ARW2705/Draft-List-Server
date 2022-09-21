const mongoose = require('mongoose')
const Schema = mongoose.Schema

const beverageSchema = new Schema({
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  name: {
    type: String,
    required: true
  },
  name_lower: {
    type: String
  },
  source: {
    type: String,
    required: true
  },
  source_lower: {
    type: String
  },
  description: {
    type: String
  },
  style: {
    type: String,
    required: true
  },
  style_lower: {
    type: String
  },
  abv: {
    type: Number
  },
  ibu: {
    type: Number
  },
  srm: {
    type: Number
  },
  imageURL: {
    type: String
  },
  contentColor: {
    type: String
  }
})

beverageSchema.index({ name_lower: 1, source_lower: 1, style_lower: 1 })

module.exports = mongoose.model('Beverage', beverageSchema)
