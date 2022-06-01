const mongoose = require('mongoose')
const Schema = mongoose.Schema

const draftContainerSchema = new Schema({
  containerInfo: {
    type: Schema.Types.ObjectId,
    ref: 'Container'
  },
  quantity: {
    type: Number,
    required: true
  },
  contentColor: {
    type: String
  }
}, {
  _id: false
})

module.exports = draftContainerSchema
