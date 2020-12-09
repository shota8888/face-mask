let filter;
function selectFilter() {
  filter = document.getElementById("filter").value;
}

function resetValue() {
  stampValue = 0;
  filter = null;
}

async function main() {
  // 表示用のCanvas
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  // 画像処理用のオフスクリーンCanvas
  const offscreen = document.createElement("canvas");
  const offscreenCtx = offscreen.getContext("2d");
  // カメラから映像を取得するためのvideo要素
  const video = document.createElement("video");

  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user" },
  });

  video.srcObject = stream;
  video.onloadedmetadata = () => {
    video.play();

    canvas.width = offscreen.width = video.videoWidth;
    canvas.height = offscreen.height = video.videoHeight;

    tick();
  };

  function tick() {
    offscreenCtx.drawImage(video, 0, 0);
    // イメージデータを取得
    const imageData = offscreenCtx.getImageData(0, 0, offscreen.width, offscreen.height);
    
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

    offscreenCtx.putImageData(imageData, 0, 0);
    ctx.drawImage(offscreen, 0, 0);
    window.requestAnimationFrame(tick);
  }

  // スタンプ変更
  function changeStamp(num) {
    stampValue = num;
    drawCanvas();
  }

  /////////// ↓フィルター処理  ///////////
  function grayScale(data) {
    for (let i = 0; i < data.length; i += 4) {
      const color = (data[i] + data[i + 1] + data[i + 2]) / 3;
      data[i] = data[i + 1] = data[i + 2] = color;
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

    const getColor = (data, i) => {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (threshold < avg) {
        // white
        return 255;
      } else {
        // black
        return 0;
      }
    };

    for (let i = 0; i < data.length; i += 4) {
      const color = getColor(data, i);
      data[i] = data[i + 1] = data[i + 2] = color;
    }
  }

  function gamma(data) {
    const gamma = 2.0;

    const correctify = (val) => 255 * Math.pow(val / 255, 1 / gamma);

    for (let i = 0; i < data.length; i += 4) {
      data[i] = correctify(data[i]);
      data[i + 1] = correctify(data[i + 1]);
      data[i + 2] = correctify(data[i + 2]);
    }
  }

  function sharpening(data) {
    const _data = data.slice();
    const sharpedColor = (color, i) => {
      const sub = -1;
      const main = 10;

      const prevLine = i - canvas.width * 4;
      const nextLine = i + canvas.width * 4;

      const sumPrevLineColor = _data[prevLine - 4 + color] * sub + _data[prevLine + color] * sub + _data[prevLine + 4 + color] * sub;
      const sumCurrLineColor = _data[i - 4 + color] * sub + _data[i + color] * main + _data[i + 4 + color] * sub;
      const sumNextLineColor = _data[nextLine - 4 + color] * sub + _data[nextLine + color] * sub + _data[nextLine + 4 + color] * sub;

      return (sumPrevLineColor + sumCurrLineColor + sumNextLineColor) / 2;
    };

    for (let i = canvas.width * 4; i < data.length - canvas.width * 4; i += 4) {
      if (i % (canvas.width * 4) === 0 || i % (canvas.width * 4 + 300) === 0) {
      } else {
        data[i] = sharpedColor(0, i);
        data[i + 1] = sharpedColor(1, i);
        data[i + 2] = sharpedColor(2, i);
      }
    }
  }

  function emboss(data) {
    const _data = data.slice();
    const embossColor = (color, i) => {
      const prevLine = i - canvas.width * 4;
      return _data[prevLine - 4 + color] * -1 + _data[i + color] + 255 / 2;
    };

    for (let i = canvas.width * 4; i < data.length - canvas.width * 4; i += 4) {
      if (i % (canvas.width * 4) === 0 || i % (canvas.width * 4 + 300) === 0) {
      } else {
        data[i] = embossColor(0, i);
        data[i + 1] = embossColor(1, i);
        data[i + 2] = embossColor(2, i);
      }
    }
  }
}

main();
