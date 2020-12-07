
(async () => {
  const { writeFile } = require('fs')
  const { detectFacesInVideo } = require('./multi-process.js')
  const cliProgress = require('cli-progress')
  const multibar = new cliProgress.MultiBar({
    clearOnComplete: false,
    hideCursor: true
  }, cliProgress.Presets.shades_grey)
  const detector = detectFacesInVideo('./smalltest.mp4')
  let b1 = {}
  let b2 = {}
  detector.start()
  detector.on('start', (duration) => {
    b1 = multibar.create(duration, 0)
    b2 = multibar.create(duration, 0)
  })
  detector.on('frameDone', () => b2.increment())
  detector.on('frameLoaded', () => b1.increment())
  detector.on('end', async (faces) => {
    b1.stop()
    await writeFile('./faces.json', JSON.stringify(faces), console.log)
  })
})()
