document.body.addEventListener("keydown", event => {
  switch (event.key) {
    case 'f':
      document.getElementById(`filterBtn${(filterValue + 1) % 7}`).click();
      break;
    case 's':
      document.getElementById(`stampBtn${(stampValue + 1) % 5}`).click();
      break;
    case 'r':
      document.getElementById("resetBtn").click();
      break;
    default:
      break;
  }
});

let filter;
let filterValue = 0;
let filterValueBackup;
let stampValue = 0;
let stampValueBackup;

let net, pose;

let eyes, nose, wScale, width, height, x, y;

// 画像
let catEars = new Image();
let dogEars = new Image();
let mask = new Image();
let higeMegane = new Image();
catEars.src = "Images/catEars.png";
dogEars.src = "Images/dogEars.png";
mask.src = "Images/mask.png";
higeMegane.src = "Images/higeMegane.png";

let image = catEars;

const video = document.getElementById("video");
video.width = 853;
video.height = 480;

// 表示用Canvas
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
// 画像処理用Canvas
const processingCanvas = document.createElement("canvas");
const processingCanvasCtx = processingCanvas.getContext("2d");


function selectFilter(num) {
  for (var i = 0; i < 7; i++) {
    document.getElementById(`filterBtn${i}`).classList.remove("active");
  }

  document.getElementById(`filterBtn${num}`).classList.add("active");
  filterValue = num;

  switch (filterValue) {
    case 1:
      filter = "gray"
      break;
    case 2:
      filter = "negaPosi"
      break;
    case 3: 
      filter = "binarization"
      break;
    case 4:
      filter = "gamma"
      break;
    case 5:
      filter = "sharpening"
      break;
    case 6:
      filter = "emboss"
      break;
    default:
      filter = "none"
      break;
  }
}

function resetValue() {
  filterValueBackup = filterValue;
  selectFilter(0)
  stampValueBackup = stampValue;
  handleSetValue(0)
}

function cancelReset() {
  selectFilter(filterValueBackup)
  handleSetValue(stampValueBackup)
}

function handleSetValue(num) {
  for (var i = 0; i < 5; i++) {
    document.getElementById(`stampBtn${i}`).classList.remove("active");
  }

  document.getElementById(`stampBtn${num}`).classList.add("active");
  stampValue = num;
}


async function main() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user" },
  });

  video.srcObject = stream;

  await new Promise(resolve => {video.onloadedmetadata = () => {resolve(video);};});

  net = await posenet.load({
    architecture: 'MobileNetV1',
    outputStride: 16,
    inputResolution: { width: 853, height: 480 },
    multiplier: 0.75
  });

  video.play(); 

  canvas.width = processingCanvas.width = video.videoWidth;
  canvas.height = processingCanvas.height = video.videoHeight; 

  draw(); 
  changeStamp();
}

  function draw() {
    processingCanvasCtx.drawImage(video, 0, 0);
    // イメージデータを取得
    const imageData = processingCanvasCtx.getImageData(0, 0, processingCanvas.width, processingCanvas.height);
    
    // イメージデータを直接書き換える
    switch (filter) {
      case "gray":
        grayScale(imageData.data);
        break;
      case "negaPosi":
        negaPosi(imageData.data);
        break;
      case "binarization":
        binarization(imageData.data);
        break;
      case "gamma":
        gamma(imageData.data);
        break;
      case "sharpening":
        sharpening(imageData.data);
        break;
      case "emboss":
        emboss(imageData.data);
        break;
      default:
    }

    processingCanvasCtx.putImageData(imageData, 0, 0);
    ctx.drawImage(processingCanvas, 0, 0);

    if (stampValue != 0) {
      ctx.drawImage(image, x, y, width, height)
    }

    window.requestAnimationFrame(draw);
  }

  // スタンプ変更
  function changeStamp() {
    switch (stampValue) {
      case 1:
        setPosition(catEars, 2, 3.5, 2.8, -1.8);
        image = catEars;
        break;
      case 2:
        setPosition(dogEars, 2, 3.8, 2.8, -1.0);
        image = dogEars;
        break;
      case 3: 
        setPosition(mask, 0, 3.8, 2.1, 3.3);
        image = mask;
        break;
      case 4:
        setPosition(higeMegane, 0, 3.2, 2.15, 1.8);
        image = higeMegane;
        break;
      default:
        break;
    } 

    window.requestAnimationFrame(changeStamp);
  }

  /**
   * 
   * @param img 画像
   * @param key 顔の部位 
   * 0: nose, 1: leftEye, 2: rightEye, 3: leftEar, 4: rightEar
   * @param scale 大きさ
   * @param hShift 横シフト
   * @param vShift 縦シフト
   */
  async function setPosition(img, key, scale, hShift, vShift) {
    pose = await net.estimateSinglePose(video);

    eyes = pose.keypoints[1].position.x - pose.keypoints[2].position.x;
    nose = pose.keypoints[0].position.y - pose.keypoints[1].position.y;
    wScale = eyes / img.width;
    width = img.width * scale * wScale;
    height = img.height * scale * wScale;
    x = pose.keypoints[key].position.x - width / 2 + eyes * hShift;
    y = pose.keypoints[key].position.y - height / 2 + nose * vShift;
  }

  // フィルター処理
  function grayScale(data) {
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      data[i] = data[i + 1] = data[i + 2] = avg;
    }
  }

  function negaPosi(data) {
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i];
      data[i + 1] = 255 - data[i + 1];
      data[i + 2] = 255 - data[i + 2];
    }
  }

  function binarization(data) {
    const threshold = 255 / 2;
    const judgBinari = (data, i) => {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      return threshold < avg ? 255 : 0; // RGBの平均が閾値を超えたら白
    };

    for (let i = 0; i < data.length; i += 4) {
      const color = judgBinari(data, i);
      data[i] = data[i + 1] = data[i + 2] = color;
    }
  }

  function gamma(data) {
    // 明るくしたい場合はgammaを大きくする
    const gamma = 2.0;
    const conversion = (val) => 255 * Math.pow(val / 255, 1 / gamma);
    for (let i = 0; i < data.length; i += 4) {
      data[i] = conversion(data[i]);
      data[i + 1] = conversion(data[i + 1]);
      data[i + 2] = conversion(data[i + 2]);
    }
  }

  function sharpening(data) {
    const dupData = data.slice();
    const sharpedColor = (color, i) => {
      const sub = -1;
      const main = 10;
      const prevLine = i - canvas.width * 4;
      const nextLine = i + canvas.width * 4;

      const sumPrevLine = (dupData[prevLine - 4 + color] + dupData[prevLine + color] + dupData[prevLine + 4 + color]) * sub;
      const sumCurrLine = (dupData[i - 4 + color] + dupData[i + 4 + color]) * sub + dupData[i + color] * main;
      const sumNextLine = (dupData[nextLine - 4 + color] + dupData[nextLine + color] + dupData[nextLine + 4 + color]) * sub;

      return (sumPrevLine + sumCurrLine + sumNextLine) / 2;
    };

    for (let i = canvas.width * 4; i < data.length - canvas.width * 4; i += 4) {
      if (i % (canvas.width * 4) !== 0 && i % (canvas.width * 4 + 300) !== 0) {
        data[i] = sharpedColor(0, i);
        data[i + 1] = sharpedColor(1, i);
        data[i + 2] = sharpedColor(2, i);
      }
    }
  }

  function emboss(data) {
    const dupData = data.slice();
    const embossColor = (color, i) => {
      const prevLine = i - canvas.width * 4;
      return (dupData[prevLine - 4 + color] * -1 + dupData[i + color]) + (255 / 2);
    };

    for (let i = canvas.width * 4; i < data.length - canvas.width * 4; i += 4) {
      if (i % (canvas.width * 4) !== 0 && i % ((canvas.width * 4) + 300) !== 0) {
        data[i] = embossColor(0, i);
        data[i + 1] = embossColor(1, i);
        data[i + 2] = embossColor(2, i);
      }
    }
  }

main();
