const { fork } = require('child_process')
const { getVideoDurationInSeconds } = require('get-video-duration')
const { EventEmitter } = require('events')
const { Converter } = require('ffmpeg-stream')
const { ExtractFrames } = require('./utils.js')

function detectFacesInVideo (videoPath, fps = 0.1, minScore = 0.6, numWorkers = 1) {
  const em = new EventEmitter()
  // Generate Thumbnails
  em.start = async () => {
    em.emit('start', (await getVideoDurationInSeconds(videoPath)) * fps)
    new Promise((resolve, reject) => {
      const temp = []
      const converter = new Converter()
      let index = 0
      converter.createOutputStream({ f: 'image2pipe', vcodec: 'mjpeg', vf: `fps=fps=${fps}` }).pipe(new ExtractFrames('FFD8FF'))
        .on('error', reject).on('data', async frameData => { temp.push({ frameData, index: index++ }); em.emit('frameLoaded') })
        .on('end', async () => { resolve(temp) })
      converter.createInputFromFile(videoPath)
      converter.run()
    }).then(async pool => {
      const temp = []
      const workers = []
      for (let i = 0; i < numWorkers; i++) {
        workers.push(new Promise(async (resolve, reject) => {
          const worker = await fork('./multi-process-worker.js', ['special'])
          worker.on('error', reject)
          worker.on('message', async msg => {
            if (msg.ready) {
              // Adding data
              if (msg.data) { temp.push(msg.data); em.emit('frameDone') }
              if (pool.length > 0) {
                worker.send(pool.shift())
              } else {
                await worker.kill()
                resolve()
              }
            } else reject(Error('thread not ready?'))
          })
        }))
      }
      await Promise.all(workers)
      return temp
    }).then((allFaces) => {
      em.emit('end', allFaces)
    })
  }
  return em
}
exports.detectFacesInVideo = detectFacesInVideo
