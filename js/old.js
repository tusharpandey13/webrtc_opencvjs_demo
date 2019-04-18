let width = 0;
let height = 0;

let qvga = {
  width: {
    exact: 320
  },
  height: {
    exact: 240
  }
};

let vga = {
  width: {
    exact: 640
  },
  height: {
    exact: 480
  }
};

let resolution = window.innerWidth < 640 ? qvga : vga;

// whether streaming video from the camera.
let streaming = false;

let video = document.getElementById("video");
let stream = null;
let vc = null;

let info = document.getElementById('info');
let container = document.getElementById('container');

function startCamera() {
  if (streaming) return;
  await navigator.mediaDevices.getUserMedia({
      video: resolution,
      audio: false
    })
    .then(function(s) {
      stream = s;
      video.srcObject = s;
      video.play();
    })
    .catch(function(err) {
      console.log("An error occured! " + err);
    });

  video.addEventListener("canplay", function(ev) {
    if (!streaming) {
      height = video.videoHeight;
      width = video.videoWidth;
      video.setAttribute("width", width);
      video.setAttribute("height", height);
      streaming = true;
      vc = new cv.VideoCapture(video);
    }
    startVideoProcessing();
  }, false);
}

let src = null;
let dstC1 = null;
let dstC3 = null;
let dstC4 = null;

function startVideoProcessing() {
  if (!streaming) {
    console.warn("Please startup your webcam");
    return;
  }
  stopVideoProcessing();
  src = new cv.Mat(height, width, cv.CV_8UC4);
  dstC1 = new cv.Mat(height, width, cv.CV_8UC1);
  dstC3 = new cv.Mat(height, width, cv.CV_8UC3);
  dstC4 = new cv.Mat(height, width, cv.CV_8UC4);
  requestAnimationFrame(processVideo);
}

function passThrough(src) {
  return src;
}

function processVideo() {
  // stats.begin();
  vc.read(src);
  let result;
  result = passThrough(src);
  cv.imshow("canvasOutput", result);
  // stats.end();
  requestAnimationFrame(processVideo);
}

function stopVideoProcessing() {
  if (src != null && !src.isDeleted()) src.delete();
  if (dstC1 != null && !dstC1.isDeleted()) dstC1.delete();
  if (dstC3 != null && !dstC3.isDeleted()) dstC3.delete();
  if (dstC4 != null && !dstC4.isDeleted()) dstC4.delete();
}

function stopCamera() {
  if (!streaming) return;
  stopVideoProcessing();
  document.getElementById("canvasOutput").getContext("2d").clearRect(0, 0, width, height);
  video.pause();
  video.srcObject = null;
  stream.getVideoTracks()[0].stop();
  streaming = false;
}

// var stats = null;




function opencvIsReady() {
  console.log('OpenCV.js is ready');
  // if (!featuresReady) {
  //   console.log('Requred features are not ready.');
  //   return;
  // }
  info.innerHTML = '';
  container.className = '';
  // initUI();
  startCamera();
}
