// workers actual import tfjs and faceapi modules
const { node: { decodeImage }, tidy, engine } = require('@tensorflow/tfjs-node-gpu')
const faceapi = require('@vladmandic/face-api')

async function main () {
  process.on('message', async ({ frameData, index }) => {
    engine().startScope()
    const tensor = tidy(() => decodeImage(Buffer.from(frameData)).toFloat().expandDims());
    const result = await faceapi.detectAllFaces(tensor, optionsSSDMobileNet).withFaceLandmarks().withFaceDescriptors()
    process.send({ ready: true, data: result })
    tensor.dispose()
    engine().endScope()
  })

  // then initialize tfjs
  await faceapi.tf.setBackend('tensorflow')
  await faceapi.tf.enableProdMode()
  await faceapi.tf.ENV.set('DEBUG', false)
  await faceapi.tf.ready()

  // and load and initialize facepi models
  const modelPath = './node_modules/@vladmandic/face-api/model'
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath)
  await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath)
  await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath)
  const optionsSSDMobileNet = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.6 })
  // now we're ready, so send message back to main that it knows it can use this worker
  process.send({ ready: true })
}

main()
