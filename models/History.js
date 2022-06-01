const mongoose = require('mongoose')
const Schema = mongoose.Schema

const historySchema = new Schema({
  start: {
    type: Date
  },
  finish: {
    type: Date
  }
})

module.exports = historySchema
