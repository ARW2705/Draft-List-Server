const path = require('path')
const fs = require('fs')

const getImagePath = filename => {
  const storeDir = '../../draft-list-uploads/images'
  return path.join(__dirname, `${storeDir}/${filename}`)
}
exports.getImagePath = getImagePath

const storeImage = file => {
  return new Promise((resolve, reject) => {
    const extension = file.mimetype.replace('image/', '.')
    if (!['.jpg', '.jpeg', '.png', '.webp'].includes(extension)) {
      reject({ status: 400, message: `Invalid image file type: ${extension}` })
    }

    const tmpPath = file.path
    const newFilename = `${file.filename}${extension}`
    const targetPath = getImagePath(newFilename)

    fs.rename(tmpPath, targetPath, (error) => {
      if (error) {
        console.error('Image migration error', error)
        reject(error)
      }
      resolve(newFilename)
    })
  })
}
exports.storeImage = storeImage

const deleteImage = filename => {
  return new Promise((resolve, reject) => {
    const filePath = getImagePath(filename)
    fs.unlink(filePath, error => {
      if (error) {
        console.error('Image file removal error', error)
        resolve(error)
      }
      resolve(null)
    })
  })
}
exports.deleteImage = deleteImage

exports.replaceImage = (file, oldFilename) => {
  return Promise.all([storeImage(file), deleteImage(oldFilename)])
    .then(([newFilename, deletion]) => newFilename)
}
