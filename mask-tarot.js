/* globals Vue, p5, masks, CONTOURS, Vector2D */
(function () {
  
  let mask = {
    //=========================================================================================
    // TODO: custom data

    hide: false,
    name: "tarot", // Lowercase only no spaces! (we reuse this for some Vue stuff)
    description: "a mask with some particle systems",

    eyebrowRaise: 1,
    media: {},
    type: "light",
    cardIndex: 30,
    eyeOpacity: 0.3,
    typeLimit: "all",
    scarfHue: 273,
    // What kind of data does your mask need?

    //=========================================================================================

    setup({ p }) {
      // Runs when you start this mask
      console.log("START MASK - ", this.name);
      var mediaURL = "data/tarot.json";
      fetch(mediaURL)
        .then((response) => response.json()) // Parse the response as JSON
        .then((data) => {
          // Now 'data' is a JavaScript object containing the parsed JSON data
          console.log(data);
          // THIS RUNS AFTER THE DATA FUNCTION ENDS SO I CANT PASS STUFF BACK
          this.media = data;
        })
        .catch((error) => {
          console.error("Error loading JSON data:", error);
        });
      this.calls = 0;
    },

    chooseTarot({ p }) {
      let index = Math.floor(Math.random() * 77);
      let t = "light";
      if (this.typeLimit == "all") {
        if (Math.random() < 0.5) {
          t = "shadow";
        }
      } else if (this.typeLimit == "shadow") {
        t = "shadow";
      }

      this.type = t;
      this.cardIndex = index;
    },

    drawBackground({ p }) {
      // console.log(this.backgroundTransparency);
      if (this.type == "light") {
        p.background(50, 80, 90);
      } else {
        p.background(200, 80, 30);
      }
    },

    setupHand({ p, hand }) {
      // Any data that you need on each hand
    },

    setupFace({ p, face }) {
      // Any data that you need on each face

      face.particles = [];
      face.earrings = [];
      face.eyeballs = [];

      face.ears.forEach((ear) => {
        let pt = new Vector2D(0, 0);
        pt.velocity = new Vector2D(0, 0);
        pt.force = new Vector2D(0, 0);
        pt.offsetToParent = new Vector2D(0, 0);
        pt.parent = ear;
        pt.idNumber = 0;
        face.particles.push(pt);
        face.earrings.push(pt);
      });

      face.eyes.forEach((eye) => {
        // Earring particle
        let pt = new Vector2D(0, 0);
        pt.velocity = new Vector2D(0, 0);
        pt.force = new Vector2D(0, 0);
        pt.offsetToParent = new Vector2D(0, 0);
        pt.parent = eye;
        face.eyeballs.push(pt);
      });
    },

    drawHand({ p, hand }) {
      let t = p.millis() * 0.001;

      CONTOURS.fingers.forEach((finger, fingerIndex) => {
        p.noFill();
        p.strokeWeight(15 * 2);
        p.stroke(0, 0, 0, 0.8);
        hand.drawContour({
                p,
                contour: [0].concat(finger),
                // contour: finger,
              });
      });
    },

    update(p) {
      if (this.calls % 50 == 0) {
        this.chooseTarot(p);
      }
      this.calls += 1;
    },

    drawFace({ p, face }) {
      let t = p.millis() * 0.001;
      let dt = p.deltaTime * 0.001;
      // Before drawing the face, do my particle simulation
      face.particles.forEach((pt) => {
        pt.force.mult(0);
      });

      // Set earring forces
      face.earrings.forEach((pt) => {
        // apply force toward ear
        pt.offsetToParent.setToOffset(pt.parent, pt);

        // Wander force
        pt.force.addPolar(60, pt.idNumber);
        pt.force.addMultiple(pt.offsetToParent, -2.9);

        // gravity
        pt.force.y += 200;
        if (pt.offsetToParent.magnitude > 100)
          pt.setToLerp(pt, pt.parent, 0.01);
      });

      // Particle update v and pos
      face.particles.forEach((pt) => {
        pt.velocity.mult(0.99);
        pt.addMultiple(pt.velocity, dt);
        pt.velocity.addMultiple(pt.force, dt);
      });

      p.noFill();
      face.forEachSide((sideContours, sideIndex) => {
        p.fill(50);
        for (var i = 0; i < 2; i++) {
          p.strokeWeight(20 * 2);
          p.stroke(this.scarfHue, 40, 28, 0.95);
          face.drawContour({
            stroke: 100,
            p,
            contour: sideContours.faceRings[i],
            contour1: sideContours.faceRings[i - 1],
          });

          p.fill(50);
          face.drawContour({
            stroke: 100,
            p,
            contour: sideContours.faceRings[i + 1],
          });
          // p.fill(273, 90, 78);
          // face.drawContour({
          //   stroke: 100,
          //   p,
          //   contour: sideContours.faceRings[i],
          //   contour1: sideContours.faceRings[i + 1],
          // });
        }
      });

      face.earrings.forEach((pt, index) => {
        if (this.media["tarot_interpretations"] != undefined) {
          p.stroke(1);
          p.strokeWeight(1);
          p.fill(35, 100, 20);
          p.rect(...pt, 50, 80);
          p.fill(100);
          p.textSize(5);
          p.textAlign(p.CENTER);
          p.text(
            this.media["tarot_interpretations"][this.cardIndex][
              "name"
            ].toUpperCase(),
            pt.x + 25,
            pt.y + 20
          );
          p.textSize(6);
          if (this.type == "light") {
            p.text("🌞", pt.x + 25, pt.y + 50);
          } else {
            p.text("🌚", pt.x + 25, pt.y + 50);
          }
          p.text(this.type.toUpperCase(), pt.x + 25, pt.y + 60);
          p.fill(0, 100, 50);
          p.stroke(1);
          p.strokeWeight(1);
          p.line(pt.x + 25, pt.y, ...pt.parent);
        }
      });

      // draw eyes
      face.eyeballs.forEach((pt, index) => {
        p.fill(100);
        p.stroke(0);
        p.ellipse(...pt.parent, 45, 35);

        p.fill(273, 98, 60);
        p.circle(...pt.parent, 25);

        p.fill(0);
        p.circle(...pt.parent, 18);

        console.log(this.eyeOpacity) // buggy !!
        p.fill(0, 100, 95, this.eyeOpacity);
        p.stroke(0);
        p.ellipse(...pt.parent, 45, 35);
        p.fill(0);
      });

      face.forEachSide((sideIndices) => {
        let eyeRing0 = sideIndices.eyeRings[0];
        let eyeRing1 = sideIndices.eyeRings[1];
        face.drawContour({ p, contour: eyeRing0.slice(3, 7) });
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
		<div>eye opactiy: <input type="range" v-model="mask.eyeOpacity" min="0" max="0.75" step="0.15" /></div>
			  <div>draws: all <input type="radio" v-model="mask.typeLimit" value="all"  /> 
         light <input type="radio" v-model="mask.typeLimit" value="light" />
         shadow <input type="radio" v-model="mask.typeLimit"value="shadow"  /></div>
    <div>scarf hue: <input type="range" v-model="mask.scarfHue" min="0" max="360" step="1" /></div>
		</div>`,

    // Custom data for these controls
    data() {
      return {};
    },
    props: { mask: { required: true, type: Object } }, // We need to have bot
  });

  masks.push(mask);
})();
