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
  source: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  style: {
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

module.exports = mongoose.model('Beverage', beverageSchema)
