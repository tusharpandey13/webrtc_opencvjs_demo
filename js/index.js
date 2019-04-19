"use strict";

// Put variables in global scope to make them available to the browser console.
const constraints = (window.constraints = {
	audio: false,
	video: true
});

let vc = null;
let video = null;
let streaming = false;
let canplaylistneradded = false;

let width_out, height_out;

function handleSuccess(stream) {
	video = document.querySelector("video");
	const videoTracks = stream.getVideoTracks();
	console.log("Got stream with constraints:", constraints);
	console.log(`Using video device: ${videoTracks[0].label}`);
	window.stream = stream; // make variable available to browser console
	video.srcObject = stream;

	if (!canplaylistneradded) {
		video.addEventListener(
			"canplay",
			function(ev) {
				if (!streaming) {
					canplaylistneradded = true;
					width_out = video.videoWidth;
					height_out = video.videoHeight;
					video.setAttribute("width", width_out);
					video.setAttribute("height", height_out);
					streaming = true;
					vc = new cv.VideoCapture(video);
				}
				startVideoProcessing();
			},
			false
		);
	}
}

function handleError(error) {
	if (error.name === "ConstraintNotSatisfiedError") {
		let v = constraints.video;
		errorMsg(
			`The resolution ${v.width.exact}x${
				v.height.exact
			} px is not supported by your device.`
		);
	} else if (error.name === "PermissionDeniedError") {
		errorMsg(
			"Permissions have not been granted to use your camera and " +
				"microphone, you need to allow the page access to your devices in " +
				"order for the demo to work."
		);
	}
	errorMsg(`getUserMedia error: ${error.name}`, error);
}

function errorMsg(msg, error) {
	const errorElement = document.querySelector("#errorMsg");
	errorElement.innerHTML += `<p>${msg}</p>`;
	if (typeof error !== "undefined") {
		console.error(error);
	}
}

async function init(e) {
	if (!streaming) {
		console.log("fefefefefefe");
		try {
			const stream = await navigator.mediaDevices.getUserMedia(
				constraints
			);
			handleSuccess(stream);
			// e.target.disabled = true;
		} catch (e) {
			handleError(e);
		}
		document.querySelector("#showVideo").innerHTML = "Stop camera";
	} else {
		stopCamera();
		document.querySelector("#showVideo").innerHTML = "Start camera";
	}
}

let source = null;
let dstC1 = null;
let dstC3 = null;
let dstC4 = null;
let faceClassifier = null;

function startVideoProcessing() {
	if (!streaming) {
		console.warn("Please startup your webcam");
		return;
	}
	clearbuffers();
	setupbuffers(width_out, height_out);

	faceClassifier = new cv.CascadeClassifier();
	faceClassifier.load("haarcascade_frontalface_default.xml");

	requestAnimationFrame(processVideo);
}

function passThrough(src) {
	// cv.cvtColor(src, dstC1, cv.COLOR_RGBA2GRAY);
	cv.flip(src, src, 1);
	cv.cvtColor(src, dstC1, cv.COLOR_RGBA2GRAY);

	let facemat = new cv.Mat();
	cv.pyrDown(dstC1, facemat);
	cv.pyrDown(facemat, facemat);
	let size = facemat.size();

	let faces = new cv.RectVector();

	faceClassifier.detectMultiScale(facemat, faces, 1.3, 5);
	// draw faces.
	for (let i = 0; i < faces.size(); i++) {
		let face = faces.get(i);
		let xr = width_out / size.width;
		let yr = height_out / size.height;
		let point1 = new cv.Point(face.x * xr, face.y * yr);
		let point2 = new cv.Point(
			(face.x + face.width) * xr,
			(face.y + face.height) * yr
		);
		cv.rectangle(src, point1, point2, [255, 0, 0, 255]);
	}

	facemat.delete();
	faces.delete();

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
function setupbuffers() {
	source = new cv.Mat(height_out, width_out, cv.CV_8UC4);
	dstC1 = new cv.Mat(height_out, width_out, cv.CV_8UC1);
	dstC3 = new cv.Mat(height_out, width_out, cv.CV_8UC3);
	dstC4 = new cv.Mat(height_out, width_out, cv.CV_8UC4);
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
	console.log("OpenCV.js is ready");
	document.querySelector("#showVideo").innerHTML = "Show video";
	document
		.querySelector("#showVideo")
		.addEventListener("click", e => init(e));
}
