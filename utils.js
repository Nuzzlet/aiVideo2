const { Transform } = require('stream')
class ExtractFrames extends Transform {
  constructor (magicNumberHex) {
    super({ readableObjectMode: true })
    this.magicNumber = Buffer.from(magicNumberHex, 'hex')

    this.currentData = Buffer.alloc(0)
  }

  _transform (newData, encoding, done) {
    // Add new data
    this.currentData = Buffer.concat([this.currentData, newData])

    // Find frames in current data
    while (true) {
      // Find the start of a frame
      const startIndex = this.currentData.indexOf(this.magicNumber)
      if (startIndex < 0) break // start of frame not found

      // Find the start of the next frame
      const endIndex = this.currentData.indexOf(
        this.magicNumber,
        startIndex + this.magicNumber.length
      )
      if (endIndex < 0) break // we haven't got the whole frame yet

      // Handle found frame
      this.push(this.currentData.slice(startIndex, endIndex)) // emit a frame
      this.currentData = this.currentData.slice(endIndex) // remove frame data from current data
      if (startIndex > 0) console.error(`Discarded ${startIndex} bytes of invalid data`)
    }

    done()
  }
  // TODO: Fix not emitting the last frame in a stream
}

exports.ExtractFrames = ExtractFrames
