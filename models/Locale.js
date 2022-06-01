const mongoose = require('mongoose')
const Schema = mongoose.Schema

const localeSchema = new Schema({
  city: {
    type: String
  },
  region: {
    type: String
  },
  country: {
    type: String
  }
}, {
  _id: false
})

module.exports = localeSchema
