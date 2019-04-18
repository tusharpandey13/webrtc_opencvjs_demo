'use strict';

// Put variables in global scope to make them available to the browser console.
const constraints = window.constraints = {
  audio: false,
  video: true
};

let vc = null;
let video = null;

function handleSuccess(stream) {
  video = document.querySelector('video');
  const videoTracks = stream.getVideoTracks();
  console.log('Got stream with constraints:', constraints);
  console.log(`Using video device: ${videoTracks[0].label}`);
  window.stream = stream; // make variable available to browser console
  video.srcObject = stream;

  video.addEventListener("canplay", function(ev) {
    // if (!streaming) {
    let width = video.videoWidth;
    let height = video.videoHeight;
    video.setAttribute("width", width);
    video.setAttribute("height", height);
    //   streaming = true;
    vc = new cv.VideoCapture(video);
    // }
    startVideoProcessing(width, height);
  }, false);
}

function handleError(error) {
  if (error.name === 'ConstraintNotSatisfiedError') {
    let v = constraints.video;
    errorMsg(`The resolution ${v.width.exact}x${v.height.exact} px is not supported by your device.`);
  } else if (error.name === 'PermissionDeniedError') {
    errorMsg('Permissions have not been granted to use your camera and ' +
      'microphone, you need to allow the page access to your devices in ' +
      'order for the demo to work.');
  }
  errorMsg(`getUserMedia error: ${error.name}`, error);
}

function errorMsg(msg, error) {
  const errorElement = document.querySelector('#errorMsg');
  errorElement.innerHTML += `<p>${msg}</p>`;
  if (typeof error !== 'undefined') {
    console.error(error);
  }
}

async function init(e) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    handleSuccess(stream);
    // e.target.disabled = true;
  } catch (e) {
    handleError(e);
  }

  document.querySelector('#showVideo').innerHTML = "Stop video";
  document.querySelector('#showVideo').addEventListener('click', e => stopCamera());
}


let src = null;
let dstC1 = null;
let dstC3 = null;
let dstC4 = null;


function startVideoProcessing(width, height) {
  // if (!streaming) {
  //   console.warn("Please startup your webcam");
  //   return;
  // }
  // stopVideoProcessing();
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
  let result = passThrough(src);
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
  // if (!streaming) return;
  stopVideoProcessing();
  document.getElementById("canvasOutput").getContext("2d").clearRect(0, 0, width, height);
  video.pause();
  video.srcObject = null;
  if (window.stream != null) window.stream.getVideoTracks()[0].stop();
  // streaming = false;
}

function opencvIsReady() {
  console.log('OpenCV.js is ready');
  // if (!featuresReady) {
  //   console.log('Requred features are not ready.');
  //   return;
  // }
  // info.innerHTML = '';
  // container.className = '';
  // // initUI();
  // startCamera();
  document.querySelector('#showVideo').addEventListener('click', e => init(e));
}
