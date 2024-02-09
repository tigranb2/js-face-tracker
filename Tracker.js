/**
 * A class fortracking hand/face/etc data
 * and playing or recording data
 *
 **/
/* globals Vue, p5, TEST_FACE_DATA, TEST_HAND_DATA , Vector2D*/

const CONTOURS = {
  fingers: [
    [1, 2, 3, 4],
    [5, 6, 7, 8],
    [9, 10, 11, 12],
    [13, 14, 15, 16],
    [17, 18, 19, 20],
  ],

  centerLine: [
    10, 151, 9, 8, 168, 6, 197, 195, 5, 4, 1, 19, 94, 2, 164, 0, 11, 12, 13, 14,
    15, 16, 17, 18, 200, 199, 175, 152,
  ],
  mouth: [
    [
      287, 436, 426, 327, 326, 2, 97, 98, 206, 216, 57, 43, 106, 182, 83, 18,
      313, 406, 335, 273,
    ],
    [
      291, 410, 322, 391, 393, 164, 167, 165, 92, 186, 61, 146, 91, 181, 84, 17,
      314, 405, 321, 375,
    ],
    [
      306, 409, 270, 269, 267, 0, 37, 39, 40, 185, 76, 77, 90, 180, 85, 16, 315,
      404, 320, 307,
    ],
    [
      292, 408, 304, 303, 302, 11, 72, 73, 74, 184, 62, 96, 89, 179, 86, 15,
      316, 403, 319, 325,
    ],
    [
      308, 407, 310, 311, 312, 13, 82, 81, 80, 183, 78, 95, 88, 178, 87, 14,
      317, 402, 318, 324,
    ],
  ],

  sides: [
    // RIGHT
    {
      faceRings: [
        [
          10, 109, 67, 103, 54, 21, 162, 127, 234, 93, 132, 58, 172, 136, 150,
          149, 176, 148, 152,
        ],
        [
          151, 108, 69, 104, 68, 71, 139, 34, 227, 137, 177, 215, 138, 135, 169,
          170, 140, 171, 175,
        ],
        [
          9, 107, 66, 105, 63, 70, 156, 143, 116, 123, 147, 213, 192, 214, 210,
          211, 32, 208, 199,
        ],
      ],
      eyeRings: [
        [
          122, 168, 107, 66, 105, 63, 70, 156, 143, 116, 123, 50, 101, 100, 47,
          114, 188,
        ],
        [
          245, 193, 55, 65, 52, 53, 46, 124, 35, 111, 117, 118, 119, 120, 121,
          128,
        ],
        [
          244, 189, 221, 222, 223, 224, 225, 113, 226, 31, 228, 229, 230, 231,
          232, 233,
        ],
        [243, 190, 56, 28, 27, 29, 30, 247, 130, 25, 110, 24, 23, 22, 26, 112],
        [
          133, 173, 157, 158, 159, 160, 161, 246, 33, 7, 163, 144, 145, 153,
          154, 155,
        ],
      ],
    },
    // LEFT
    {
      faceRings: [
        [
          10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365,
          379, 378, 400, 377, 152,
        ],
        [
          151, 337, 299, 333, 298, 301, 368, 264, 447, 366, 401, 435, 367, 364,
          394, 395, 369, 396, 175,
        ],
        [
          9, 336, 296, 334, 293, 300, 383, 372, 345, 352, 376, 433, 416, 434,
          430, 431, 262, 428, 199,
        ],
      ],
      eyeRings: [
        [
          351, 168, 336, 296, 334, 293, 300, 383, 372, 345, 352, 280, 330, 329,
          277, 343, 412,
        ],
        [
          465, 417, 285, 295, 282, 283, 276, 353, 265, 340, 346, 347, 348, 349,
          350, 357,
        ],
        [
          464, 413, 441, 442, 443, 444, 445, 342, 446, 261, 448, 449, 450, 451,
          452, 453,
        ],
        [
          463, 414, 286, 258, 257, 259, 260, 467, 359, 255, 339, 254, 253, 252,
          256, 341,
        ],
        [
          362, 398, 384, 385, 386, 387, 388, 466, 263, 249, 390, 373, 374, 380,
          381, 382,
        ],
      ],
    },
  ],

  // [10 109 87 103]
};

// For landmarks you want, set to true; set false the ones you don't.
// Works best with just one or two sets of landmarks.
const trackingConfig = {
  // doAcquireHandLandmarks: !true,
  // doAcquirePoseLandmarks: !true,
  // doAcquireFaceLandmarks: true,
  doAcquireFaceMetrics: true,
  poseModelLiteOrFull: "lite" /* "lite" (3MB) or "full" (6MB) */,
  cpuOrGpuString: "GPU" /* "GPU" or "CPU" */,
  maxNumHands: 2,
  maxNumPoses: 1,
  maxNumFaces: 2,
};

let trackableCount = 0;
class Trackable {
  constructor(landmarkCount) {
    this.idNumber = trackableCount++;
    this.idColor = [(this.idNumber * 73) % 360, 100, 50];
    this.isActive = false;
    this.landmarks = Array.from(
      { length: landmarkCount },
      () => new Vector2D(0, 0)
    );
  }

  contourToPoints(contour) {
    return contour.map((index) => this.landmarks[index]);
  }

  setLandmarksFromRecording(landmarks) {
    this.landmarks.forEach((pt, index) => {
      // Scale and mirror the positions, so they are in screen space
      let scale = 1;
      // The new Golan version has 2 more points ¯\_(ツ)_/¯
      if (index < landmarks.length) {
        pt.setTo(
          landmarks[index][0] * scale * 1.2 + 300,
          landmarks[index][1] * scale + 200
        );
      }
    });
    this.calculateMetaTrackingData?.();
  }

  setLandmarksFromTracker(landmarks, imageDimensions) {
    // console.log("set to landmarks", landmarks)
    this.landmarks.forEach((pt, index) => {
      // Scale and mirror the positions, so they are in screen space
      pt.setTo(
        (1 - landmarks[index].x) * imageDimensions[0],
        landmarks[index].y * imageDimensions[1]
      );
    });
    this.calculateMetaTrackingData?.();
  }

  drawDebugData(p) {
    p.fill(...this.idColor);
    p.stroke(0);
    // console.log(this.landmarks)
    this.landmarks.forEach((pt) => {
      // Landmarks are relative to the image size
      p.circle(...pt, 6);
    });
  }

  drawContour({
    p,
    contour, // A list of Vect2d, or list of indices
    contour1 = undefined,
    image = undefined,
    imageScale = 1,
    useCurveVertices = false,
    onlyVertices = false,
    transformPoint = undefined,
    close = false,
  } = {}) {
    let pt2 = new Vector2D();
    if (!onlyVertices) p.beginShape();
    if (image) {
      p.texture(image);
      p.textureMode(p.IMAGE);
    }

    let drawVertex = (pt, index) => {
      if (!isNaN(pt)) pt = this.landmarks[pt];
      let vFxn = useCurveVertices ? "curveVertex" : "vertex";

      pt2.setTo(...pt);
      // Transform the points with a function?
      if (transformPoint) {
        transformPoint(pt2, pt, index);
      }

      if (image) p[vFxn](...pt2, pt2[0] * imageScale, pt2[1] * imageScale);
      else p[vFxn](...pt2);
    };

    contour.forEach(drawVertex);

    if (contour1) {
      contour1.slice().reverse().forEach(drawVertex);
    }
    if (!onlyVertices) p.endShape(close ? p.CLOSE : undefined);
  }
}

const CATEGORIES = [
  "_neutral",
  "browDownLeft",
  "browDownRight",
  "browInnerUp",
  "browOuterUpLeft",
  "browOuterUpRight",
  "cheekPuff",
  "cheekSquintLeft",
  "cheekSquintRight",
  "eyeBlinkLeft",
  "eyeBlinkRight",
  "eyeLookDownLeft",
  "eyeLookDownRight",
  "eyeLookInLeft",
  "eyeLookInRight",
  "eyeLookOutLeft",
  "eyeLookOutRight",
  "eyeLookUpLeft",
  "eyeLookUpRight",
  "eyeSquintLeft",
  "eyeSquintRight",
  "eyeWideLeft",
  "eyeWideRight",
  "jawForward",
  "jawLeft",
  "jawOpen",
  "jawRight",
  "mouthClose",
  "mouthDimpleLeft",
  "mouthDimpleRight",
  "mouthFrownLeft",
  "mouthFrownRight",
  "mouthFunnel",
  "mouthLeft",
  "mouthLowerDownLeft",
  "mouthLowerDownRight",
  "mouthPressLeft",
  "mouthPressRight",
  "mouthPucker",
  "mouthRight",
  "mouthRollLower",
  "mouthRollUpper",
  "mouthShrugLower",
  "mouthShrugUpper",
  "mouthSmileLeft",
  "mouthSmileRight",
  "mouthStretchLeft",
  "mouthStretchRight",
  "mouthUpperUpLeft",
  "mouthUpperUpRight",
  "noseSneerLeft",
  "noseSneerRight",
];

class Face extends Trackable {
  // Data for one face
  constructor() {
    super(472);
    this.blendShapes = {};
    CATEGORIES.forEach((c) => (this.blendShapes[c] = 0));

    // useful points
    this.eyes = [new Vector2D(0, 0), new Vector2D(0, 0)];
    this.ears = [new Vector2D(0, 0), new Vector2D(0, 0)];
    this.chin = new Vector2D(0, 0);
    this.nose = new Vector2D(0, 0);
    this.center = new Vector2D(0, 0);
    this.forehead = new Vector2D(0, 0);
    this.offsetLength = new Vector2D(0, 0);
    this.offsetWidth = new Vector2D(0, 0);
    this.offsetEars = [new Vector2D(0, 0), new Vector2D(0, 0)];
    this.offsetEyes = [new Vector2D(0, 0), new Vector2D(0, 0)];
  }

  forEachSide(fxn) {
    // TODO, put the correct side forward
    for (var i = 0; i < 2; i++) {
      fxn(CONTOURS.sides[i], i);
    }
  }

  // Do meta calculations
  calculateMetaTrackingData() {
    this.forehead.setTo(this.landmarks[CONTOURS.centerLine[0]]);
    this.nose.setTo(this.landmarks[CONTOURS.centerLine[9]]);
    this.chin.setTo(this.landmarks[CONTOURS.centerLine[26]]);

    this.ears.forEach((pt, index) => {
      let ptIndex = CONTOURS.sides[index].faceRings[0][8];
      pt.setTo(this.landmarks[ptIndex]);
      this.offsetEars[index].setToOffset(this.center, pt);
    });

    this.eyes.forEach((pt, index) => {
      let contour = CONTOURS.sides[index].eyeRings[4];
      pt.setToAverage(contour.map((i) => this.landmarks[i]));

      this.offsetEyes[index].setToOffset(this.center, pt);
    });

    this.offsetLength.setToOffset(this.forehead, this.chin);
    this.offsetWidth.setToOffset(this.ears[1], this.ears[0]);

    this.center.setToAverage(this.ears);
    //     for (var i = 0; i < 2; i++) {
    //       let side = this.sides[i];
    //       this.eyes[i].setToAverage(side.eyeRings[4]);
    //       side.noseToEar.setToDifference(side.ear[2], face.noseTip);
    //       side.blink =
    //         (10 * Vector.getDistance(side.eyeRings[4][4], side.eyeRings[4][8])) /
    //         face.size;
    //       // Hand calculations
    //       let h = hand[i];
    //       h.handDir.setToDifference(h.center, h.wrist);
    //       for (var j = 0; j < 5; j++) {
    //         h.pointDir[j].setToDifference(h.fingers[j][3], h.fingers[j][1]);
    //       }
    //     }
    //     face.center.setToAverage([face.sides[0].eye, face.sides[1].eye]);
    //     face.direction.setToAddMultiples(
    //       face.sides[0].noseToEar,
    //       1,
    //       face.sides[1].noseToEar,
    //       1
    //     );
    //     // console.log(face.center)
    //     if (face.direction.coords[0] < 0) {
    //       face.sideOrder = [face.sides[0], face.sides[1]];
    //     } else {
    //       face.sideOrder = [face.sides[1], face.sides[0]];
    //     }
    this.width = this.ears[0].getDistanceTo(this.ears[1]);
    this.length = this.chin.getDistanceTo(this.forehead);
    this.size = Math.max(this.width * 1.5, this.length);
    this.scale = this.size / 250;
  }
}

class Hand extends Trackable {
  // Data for one face
  constructor() {
    super(21);
    this.handedness = undefined;
  }
}

class Tracker {
  constructor(config) {
    this.config = config;

    // Support up to 3 faces and 6 hands.
    // We don't know whose is whose though
    this.faces = [new Face(), new Face(), new Face()];
    this.hands = [
      new Hand(),
      new Hand(),
      new Hand(),
      new Hand(),
      new Hand(),
      new Hand(),
    ];

    this.playbackInterval = undefined;
    this.frameIndex = 0;
  }

  togglePlayback() {
    if (this.playbackInterval) {
      console.log("STOP PLAYBACK");
    } else {
      this.frameIndex = 0;

      // Playback this particular frame
      this.playbackInterval = setInterval(() => {
        this.frameIndex = (this.frameIndex + 1) % TEST_FACE_DATA.length;

        let faceFrame = TEST_FACE_DATA[this.frameIndex];
        let handFrame = TEST_HAND_DATA[this.frameIndex];

        this.faces[0].isActive = true;
        this.faces[0].setLandmarksFromRecording(faceFrame);

        this.hands[0].isActive = true;
        this.hands[0].setLandmarksFromRecording(handFrame[0]);
        this.hands[1].isActive = true;
        this.hands[1].setLandmarksFromRecording(handFrame[1]);
      }, 60);
    }
  }

  toggleRecording() {
    console.warn("RECORDING NOT YET IMPLEMENTED");
  }

  toggleLive() {}

  drawDebugData(p) {
    this.faces.forEach((face) => {
      if (face.isActive) face.drawDebugData(p);
    });
    this.hands.forEach((hand) => {
      if (hand.isActive) hand.drawDebugData(p);
    });

    p.fill(0);
    p.rect(0, 0, 200, 100);
    p.fill(100);
    p.text(
      `Frame ${this.frameIndex}\nHands: ${
        this.hands.filter((h) => h.isActive).length
      }\nFaces: ${this.faces.filter((h) => h.isActive).length}`,
      10,
      20
    );
  }

  setVideoSource(video) {
    this.video = video;
  }

  get activeFaces() {
    return this.faces.filter((f) => f.isActive);
  }
  get activeHands() {
    return this.hands.filter((f) => f.isActive);
  }

  async initTracking() {
    console.log("TRACKER - initiate tracking!");
    this.mediapipe_module = await import(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.js"
    );

    this.vision = await this.mediapipe_module.FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.7/wasm"
    );

    this.initHandTracking();
    this.initFaceTracking();
    this.initPoseTracking();
  }

  async makePredictions() {
    let t = performance.now();
    // Make sure we are not making double predictions?
    if (t - this.lastPredictionTime > 10) {
      this.predictFace();
      this.predictHand();
    }

    this.lastPredictionTime = t;
  }

  async predictHand() {
    let startTimeMs = performance.now();
    let data = this.handLandmarker?.detectForVideo(this.video.elt, startTimeMs);
    if (data) {
      this.hands.forEach((hand, handIndex) => {
        let landmarks = data.landmarks[handIndex];

        if (landmarks) {
          hand.isActive = true;
          hand.handedness = data.handednesses[handIndex];
          let videoDimensions = [this.video.elt.width, this.video.elt.height];
          hand.setLandmarksFromTracker(landmarks, videoDimensions);
        } else {
          // No face active here
          hand.isActive = false;
        }
      });
    }
  }

  async predictFace() {
    let startTimeMs = performance.now();

    let data = this.faceLandmarker?.detectForVideo(this.video.elt, startTimeMs);

    if (data) {
      this.faces.forEach((face, faceIndex) => {
        let landmarks = data.faceLandmarks[faceIndex];
        let blendShapes = data.faceBlendshapes[faceIndex];

        // Set the face to these landmarks
        if (landmarks) {
          face.isActive = true;
          let videoDimensions = [this.video.elt.width, this.video.elt.height];
          face.setLandmarksFromTracker(landmarks, videoDimensions);
        } else {
          // No face active here
          face.isActive = false;
        }
      });
    }
  }

  async predictPose() {
    let startTimeMs = performance.now();
    this.poseLandmarks = this.poseLandmarker?.detectForVideo(
      this.video.elt,
      startTimeMs
    );
  }

  //------------------------------------------------------------------------
  // Start hand tracking
  // Hand Landmark Tracking:
  // https://codepen.io/mediapipe-preview/pen/gOKBGPN
  // https://mediapipe-studio.webapps.google.com/studio/demo/hand_landmarker

  async initHandTracking() {
    // Create a landmark-tracker we can query for latest landmarks
    this.handLandmarker =
      await this.mediapipe_module.HandLandmarker.createFromOptions(
        this.vision,
        // Handtracking settings
        {
          numHands: this.config.maxNumHands,
          runningMode: "VIDEO",
          baseOptions: {
            delegate: this.config.cpuOrGpuString,
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          },
        }
      );
  }

  //------------------------------------------------------------------------
  // Start pose tracking
  // Pose (Body) Landmark Tracking:
  // https://codepen.io/mediapipe-preview/pen/abRLMxN
  // https://developers.google.com/mediapipe/solutions/vision/pose_landmarker

  async initPoseTracking() {
    // Which model to use? Options: lite or full
    const poseModelLite =
      "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
    const poseModelFull =
      "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task";
    let poseModel = poseModelLite;
    poseModel =
      this.config.poseModelLiteOrFull == "full" ? poseModelFull : poseModelLite;

    // Create a landmark-tracker we can query for latest landmarks
    this.poseLandmarker =
      await this.mediapipe_module.PoseLandmarker.createFromOptions(
        this.vision,
        {
          numPoses: this.config.maxNumPoses,
          runningMode: "VIDEO",
          baseOptions: {
            modelAssetPath: poseModel,
            delegate: this.config.cpuOrGpuString,
          },
        }
      );
  }

  async initFaceTracking() {
    // Create a landmark-tracker we can query for latest landmarks
    this.faceLandmarker =
      await this.mediapipe_module.FaceLandmarker.createFromOptions(
        this.vision,
        {
          numFaces: this.config.maxNumFaces,
          runningMode: "VIDEO",
          outputFaceBlendshapes: this.config.doAcquireFaceMetrics,
          baseOptions: {
            delegate: this.config.cpuOrGpuString,
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          },
        }
      );
  }
}
