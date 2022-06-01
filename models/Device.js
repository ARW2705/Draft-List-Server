const mongoose = require('mongoose')
const Schema = mongoose.Schema
const localeSchema = require('./Locale')
const uniqueValidator = require('mongoose-unique-validator')

const deviceSchema = new Schema({
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  name: {
    type: String,
    required: true
  },
  title: {
    type: String
  },
  imageURL: {
    type: String
  },
  locale: localeSchema,
  hardwareId: {
    type: String,
    required: true,
    unique: true
  },
  draftList: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Draft'
    }
  ]
}, {
  timestamps: true
})

deviceSchema.index({ hardwareId: 1 })
deviceSchema.plugin(uniqueValidator)

module.exports = mongoose.model('Device', deviceSchema)
