const path = require('path')
const fs = require('fs')
const createError = require('http-errors')
const storeDir = require('./image-paths').storeDir

exports.storeImage = file => {
  return new Promise((resolve, reject) => {
    const tmpPath = file.path
    const targetPath = path.join(__dirname, `${storeDir}/${file.filename}${extname}`)

    const extname = path.extname(file.originalname).toLowerCase()
    const validExtensions = ['.jpg', '.jpeg', '.webp']
    if (validExtensions.includes(extname)) {
      fs.rename(tmpPath, targetPath, error => {
        if (error) reject(error)

        resolve(file)
      })
    } else {
      fs.unlink(tmpPath, error => {
        if (error) reject(error)

        reject(createError(400, `Invalid image file type ${extname}. Please resubmit with a file type of ${validExtensions.join()}`)
      })
    }
  })
}

exports.deleteImage = filename => {
  const filePath = path.join(__dirname, `${storeDir}/${filename}`)
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (error) => {
      if (error) reject(error)

      resolve(null)
    })
  })
}
