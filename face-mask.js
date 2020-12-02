// const: 定数
// let: 変数
const video = document.getElementById("video") // ビデオ要素の取得
const canvas = document.getElementById("myCanvas") // Canvas要素の取得
const ctx = canvas.getContext("2d") // 描画命令の準備
let net, pose

// パラメータオブジェクト
const PARAMS = {
  camera: false,
  skelton: true,
  radius: 5,
  color: "rgba(0, 100, 100, 0.5)",
}

// 初期化処理（非同期）
async function init() {
  // Tweakpaneの生成と要素の追加
  const pane = new Tweakpane()
  pane.addInput(PARAMS, "camera")
  pane.addInput(PARAMS, "skelton")
  pane.addInput(PARAMS, "radius", { max: 50, min: 1 })
  pane.addInput(PARAMS, "color")

  // videoのソースにWebカメラの情報を流す
  video.srcObject = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: { facingMode: "user" },
  })
  // Webカメラの準備ができるまで待つ
  await new Promise((resolve) => {
    video.onloadedmetadata = () => {
      resolve(video)
    }
  })
  // PoseNetの読み込みが完了するまで待つ
  net = await posenet.load({
    architecture: "MobileNetV1",
    outputStride: 16,
    inputResolution: { width: 640, height: 480 },
    multiplier: 0.75,
  })
  // ビデオを再生
  video.play()
  draw()
}

// 2点間の描画
function drawLine(a, b) {
  if (a.score > 0.3 && b.score > 0.3) {
    ctx.beginPath()
    ctx.moveTo(a.position.x, a.position.y)
    ctx.lineTo(b.position.x, b.position.y)
    ctx.stroke()
  }
}

// 描画処理（非同期）
async function draw() {
  // 画像・動画の姿勢推定
  pose = await net.estimateSinglePose(video)
  // console.log(pose);
  // 画面のクリア
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  // 枠線の描画
  ctx.lineWidth = 1
  ctx.strokeStyle = "black"
  ctx.strokeRect(0, 0, canvas.width, canvas.height)

  if (PARAMS.camera) {
    // カメラの映像を描画
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  }

  for (let i = 0; i < pose.keypoints.length; i++) {
    // 各特徴点の信頼スコアで変化させる
    // スコアが0.9より大きければ、円で表示
    // それ以外は四角。また、大きさも変化
    if (pose.keypoints[i].score > 0.9) {
      ctx.beginPath()
      ctx.arc(
        pose.keypoints[i].position.x - PARAMS.radius,
        pose.keypoints[i].position.y - PARAMS.radius,
        3 * PARAMS.radius,
        0,
        2 * Math.PI
      )
      ctx.fill()
    } else if (pose.keypoints[i].score > 0.8) {
      ctx.fillRect(
        pose.keypoints[i].position.x - PARAMS.radius,
        pose.keypoints[i].position.y - PARAMS.radius,
        3 * PARAMS.radius,
        3 * PARAMS.radius
      )
    } else if (pose.keypoints[i].score > 0.6) {
      ctx.fillRect(
        pose.keypoints[i].position.x - PARAMS.radius,
        pose.keypoints[i].position.y - PARAMS.radius,
        2 * PARAMS.radius,
        2 * PARAMS.radius
      )
    }
  }

  // 骨格の線の描画
  if (PARAMS.skelton) {
    drawLine(pose.keypoints[5], pose.keypoints[7])
    drawLine(pose.keypoints[7], pose.keypoints[9])
    drawLine(pose.keypoints[5], pose.keypoints[6])
    drawLine(pose.keypoints[6], pose.keypoints[8])
    drawLine(pose.keypoints[8], pose.keypoints[10])
  }

  // 色の設定
  ctx.fillStyle = PARAMS.color

  // テキストの描画とフォントの設定
  ctx.font = "bold 15px sans-serif"

  requestAnimationFrame(draw)
}

init()
