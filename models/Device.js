const mongoose = require('mongoose')
const Schema = mongoose.Schema
const localeSchema = require('./Locale')

const deviceSchema = new Schema({
  owner: {
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
  locale: localeSchema,
  hardwareId: {
    type: String,
    required: true
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

module.exports = mongoose.model('Device', deviceSchema)
