'use strict';

// Put variables in global scope to make them available to the browser console.
const constraints = window.constraints = {
  audio: false,
  video: true
};

let vc = null;
let video = null;
let streaming = false;
let canplaylistneradded = false;

function handleSuccess(stream) {
  video = document.querySelector('video');
  const videoTracks = stream.getVideoTracks();
  console.log('Got stream with constraints:', constraints);
  console.log(`Using video device: ${videoTracks[0].label}`);
  window.stream = stream; // make variable available to browser console
  video.srcObject = stream;

  if (!canplaylistneradded){
    let width = null; let height = null;
    video.addEventListener("canplay", function(ev) {
      if (!streaming) {
        canplaylistneradded = true;
        width = video.videoWidth;
        height = video.videoHeight;
        video.setAttribute("width", width);
        video.setAttribute("height", height);
        streaming = true;
        vc = new cv.VideoCapture(video);
      }
      startVideoProcessing(width, height);
    }, false);
  }

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
  if (!streaming) {
    console.log("fefefefefefe");
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      handleSuccess(stream);
      // e.target.disabled = true;
    } catch (e) {
      handleError(e);
    }
    document.querySelector('#showVideo').innerHTML = "Stop camera";
  }
  else{
    stopCamera();
    document.querySelector('#showVideo').innerHTML = "Start camera";
  }
}


let source = null;
let dstC1 = null;
let dstC3 = null;
let dstC4 = null;


function startVideoProcessing(width, height) {
  if (!streaming) {
    console.warn("Please startup your webcam");
    return;
  }
  clearbuffers();
  setupbuffers(width, height);
  requestAnimationFrame(processVideo);
}

function passThrough(src) {
  // cv.cvtColor(src, dstC1, cv.COLOR_RGBA2GRAY);
  cv.flip(src, src, 1);
  cv.cvtColor(src, dstC1, cv.COLOR_RGBA2GRAY);
  
  let classifier = new cv.CascadeClassifier();  // initialize classifier
  let utils = new Utils('errorMessage'); //use utils class
  let faceCascadeFile = 'xml/haarcascade_frontalface_default.xml'; // path to xml
  // use createFileFromUrl to "pre-build" the xml
  utils.createFileFromUrl(faceCascadeFile, faceCascadeFile, () => {
    classifier.load(faceCascadeFile); // in the callback, load the cascade from file 
  });

  let faces = new cv.RectVector();
  classifier.detectMultiScale(dstC1, faces, 1.3, 5);
  // draw faces.
  for (let i = 0; i < faces.size(); ++i) {
      let face = faces.get(i);
      let point1 = new cv.Point(face.x, face.y);
      let point2 = new cv.Point(face.x + face.width, face.y + face.height);
      cv.rectangle(src, point1, point2, [255, 0, 0, 255]);
  }


  return src;
}

function processVideo() {
  if (!streaming) return;
  // stats.begin();
  vc.read(source);
  let result = passThrough(source);
  cv.imshow("canvasOutput", result);
  // stats.end();
  requestAnimationFrame(processVideo);
}

function clearbuffers() {
  if (source != null && !source.isDeleted()) source.delete();
  if (dstC1 != null && !dstC1.isDeleted()) dstC1.delete();
  if (dstC3 != null && !dstC3.isDeleted()) dstC3.delete();
  if (dstC4 != null && !dstC4.isDeleted()) dstC4.delete();
}
function setupbuffers(width, height){
  source = new cv.Mat(height, width, cv.CV_8UC4);
  dstC1 = new cv.Mat(height, width, cv.CV_8UC1);
  dstC3 = new cv.Mat(height, width, cv.CV_8UC3);
  dstC4 = new cv.Mat(height, width, cv.CV_8UC4);
}
function stopCamera() {
  if (!streaming) return;
  streaming = false;
  clearbuffers();
  // document.getElementById("canvasOutput").getContext("2d").clearRect(0, 0, width, height);
  video.pause();
  video.srcObject = null;
  if (window.stream != null) window.stream.getVideoTracks()[0].stop();
}

function opencvIsReady() {
  console.log('OpenCV.js is ready');
  document.querySelector('#showVideo').addEventListener('click', e => init(e));
}
