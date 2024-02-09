/* globals Vue, p5, masks, CONTOURS, Vector2D */
(function () {
  // STEAL THIS FUNCTION
  function drawInNeonColors({ p, color, width, fxn }) {
    // Handy function to draw neon!
    p.noFill();
    p.strokeWeight(width * 2);
    p.stroke(color[0], color[1], color[2], 0.3);
    fxn();

    p.strokeWeight(width);
    p.stroke(color[0], color[1], color[2] + 10, 0.3);
    fxn();

    p.strokeWeight(width * 0.6);
    p.stroke(color[0], color[1], color[2] + 30, 1);
    fxn();
    p.strokeWeight(1);
  }

  let mask = {
    //=========================================================================================
    // TODO: custom data

    hide: false,
    name: "sadcat", // Lowercase only no spaces! (we reuse this for some Vue stuff)
    description: "a mask with some examples of drawing",

    borderColor: [100, 100, 50],
    eyeColor: [300, 100, 50],
    backgroundTransparency: 1,

    maneLerp: -1,
    tearDelay: 21,
    tearSize: 20,
    tearHue: 216,
    colorChange: 0,

    // What kind of data does your bot need?

    //=========================================================================================

    setup({ p }) {
      // Runs when you start this mask
      console.log("START MASK - ", this.name);

      this.particles = [];
      this.frameCount = 0;
    },

    makeRipple(p, eye) {
      if (this.frameCount % this.tearDelay == 0) {
        let pt = new Vector2D(eye.x, eye.y);

        // Helpful: a unique ID number
        pt.idNumber = this.particles.length;

        // Basic particle info
        pt.force = new Vector2D();

        pt.wanderForce = new Vector2D();

        pt.isEye = false;
        this.particles.push(pt);
      }
      this.frameCount += 1;
    },

    drawBackground({ p }) {
      p.background(200, 100, 80, 0.3);
    },

    setupHand({ p, hand }) {
      // Any data that you need on each hand
    },

    setupFace({ p, face }) {
      // Any data that you need on each face
    },

    update({ p, face }) {
      let center = new Vector2D(p.width / 2, p.height / 2);
      // Set the forces

      face.eyes.forEach((pt) => {
        this.makeRipple(p, pt);
      });

      console.log(this.particles);
      this.particles.forEach((pt) => {
        // Calculate forces
        // TODO - your forces here
        pt.wanderForce = 100 + pt.idNumber * 0.3;
        pt.force.setToAdd(pt.wanderForce);
        // console.log(pt.wanderForce)
      });

      // Move the particles
      this.particles.forEach((pt) => {
        // This stays the same for most particle systems
        // They all follow the same
        // - add-acceleration-to-velocity
        // - add-velocity-to-position
        // routine

        // Apply the force to the velocity
        // pt.velocity.addMultiple(pt.force, deltaTime);

        // Apply the velocity to the position
        let v = new Vector2D();
        // if (this.direction == "up") {
        //   v.y = -200 * this.speed;
        // } else if (this.direction == "right") {
        //   v.x = 200 * this.speed;
        // } else if (this.direction == "down") {
        //   v.y = 200 * this.speed;
        // } else if (this.direction == "left") {
        //   v.x = -200 * this.speed;
        // }
        v.y = 200;
        pt.velocity = v;
        pt.addMultiple(pt.velocity, 0.1);
      });
    },

    drawHand({ p, hand }) {
      let t = p.millis() * 0.001;

      CONTOURS.fingers.forEach((finger, fingerIndex) => {
        if (fingerIndex != 0 && fingerIndex != 5) {
          drawInNeonColors({
            p,
            color: [50, 80, 17],
            width: 35,
            fxn: () => {
              hand.drawContour({
                p,
                contour: [0].concat(finger),
                // contour: finger,
              });
            },
          });
        }
      });

      // Look at all landmarks

      //       hand.landmarks.forEach((pt, index) =>{
      //         p.fill(100)
      //         p.text(index, ...pt)
      //       })
    },

    drawFace({ p, face }) {
      let t = p.millis() * 0.001;

      // Landmark-based- draw an emoji on each landmark
      //       face.landmarks.forEach((pt, index)=> {
      //         let size= 40*p.noise(index + t)
      //         // p.textSize(size)
      //         // p.text("💔", ...pt)

      //         p.rect(...pt, size, size)
      //       })

      // Available contours
      // centerLine
      // mouth 0-4
      // sides[0-1].faceRings [0-2]
      // sides[0-1].eyeRings [0-4]

      // Do something for each side
      face.forEachSide((SIDE_CONTOURS, sideIndex) => {
        // each face countour
        // Set color based on the side index, sides ahve different colors
        let tp = sideIndex * 40 + 10;

        let brightness = 20;
        p.fill(38, 100, brightness, tp);
        face.drawContour({
          p,
          contour: SIDE_CONTOURS.faceRings[0],
          contour1: SIDE_CONTOURS.faceRings[1],
        });

        face.drawContour({
          stroke: 200,
          fill: Math.random() * 360,
          p,
          contour: SIDE_CONTOURS.faceRings[2],
          contour1: SIDE_CONTOURS.faceRings[0],
        });
      });

      p.stroke(0);
      p.fill(30, 88, 88);

      // ears
      face.forEachSide((SIDE_CONTOURS, sideIndex) => {
        let earBase0 = face.landmarks[SIDE_CONTOURS.faceRings[1][6]];
        let earBase1 = face.landmarks[SIDE_CONTOURS.faceRings[1][8]];

        // Make a horn tip, based on the different vectors derived from the face points
        // ()
        let earTip0 = Vector2D.edgePoint({
          pt0: earBase0,
          pt1: earBase1,
          pct: 0.5,
        });
        let earTip1 = Vector2D.edgePoint({
          pt0: earBase0,
          pt1: earBase1,
          pct: 0.1,
        });
        // let sideVector = face.offsetEars[sideIndex]; // A vector that points outward
        let sideVector = face.offsetEyes[sideIndex]; // A vector that points outward

        earTip0.addMultiple(face.offsetLength, 0.2); //  e.g, go up the length of the face,
        earTip1.addMultiple(face.offsetLength, 0.2); //  e.g, go up the length of the face,
        // .addMultiple(sideVector, -1); //  and then out in the direction of the ears from the nose

        p.beginShape();
        p.vertex(...earBase0);
        p.vertex(...earBase1);
        p.vertex(...earTip0);
        p.vertex(...earTip1);

        p.endShape();

        p.fill(0, 0, 0, 0.3);

        let innerEye = face.landmarks[SIDE_CONTOURS.faceRings[2][0]];

        // Use every other point in this contour so it's smoother
        let mane = SIDE_CONTOURS.faceRings[0].filter(
          (item, index) => index % 1 == 0
        );

        p.fill(50, 90, 50, 0.5);
        face.drawContour({
          p,
          // the finalPoint gets moved into position
          transformPoint: (finalPoint, basePoint, index) => {
            finalPoint.setToLerp(
              basePoint,
              innerEye,
              this.maneLerp + -0.3 * Math.sin(index * 3 + 3 * t)
            );
          },
          useCurveVertices: false,
          contour: mane,
        });
      });

      // Draw basic eye contours for the innermost eye
      p.fill(Math.cos(this.colorChange) * 30 + 10, 80, 50);
      p.stroke(0);
      face.drawContour({
        p,
        contour: CONTOURS.sides[0].eyeRings[4],
        useCurveVertices: true,
      });

      p.fill(Math.sin(this.colorChange) * 30 + 10, 80, 50);
      p.stroke(0);
      face.drawContour({
        p,
        contour: CONTOURS.sides[1].eyeRings[4],
        useCurveVertices: true,
      });

      // DRAW EACH EYE
      face.eyes.forEach((eyePt) => {
        this.colorChange += 0.05;

        p.fill(10);
        p.circle(eyePt.x, eyePt.y, 15);

        p.noStroke;
        this.particles.forEach((ripple) => {
          p.fill(this.tearHue, 40, 70, 0.8);
          p.circle(
            ripple.x - this.tearSize * 0.15,
            ripple.y - this.tearSize * 0.15,
            this.tearSize
          );
        });
      });
    },
  };

  //============================================================
  /**
   * Input controls for this bot.
   * Do we just need a chat input? Do we need anything else?
   * What about game controls, useful buttons, sliders?
   **/

  Vue.component(`input-${mask.name}`, {
    // Custom inputs for this bot
    template: `<div>
			  <div> tear delay: <input type="range" v-model="mask.tearDelay" min="5" max="33" step="2" /></div>
			  <div>tear size: <input type="range" v-model="mask.tearSize" min="5" max="40" step="0.5" /></div>
        <div>tear hue: <input type="range" v-model="mask.tearHue" min="0" max="360" step="0.5" /></div>
        
			</div>
		</div>`,

    // Custom data for these controls
    data() {
      return {};
    },
    props: { mask: { required: true, type: Object } }, // We need to have bot
  });

  masks.push(mask);
})();
