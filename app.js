/**
 * Starter code
 *
 */
/* globals Vue, p5, Tracker */
// GLOBAL VALUES, CHANGE IF YOU WANT

const DEFAULT_FRAME_RATE = 30;

let masks = [];

const WIDTH = 600;
const HEIGHT = 400;

document.addEventListener("DOMContentLoaded", (event) => {
  console.log("DOM fully loaded and parsed");

  new Vue({
    template: `<div id="app">
      
			<div ref="p5"></div>
      
      <div class="controls">
        <div class="controls-section" style="width:200px">
        Draw debug data:<input type="checkbox" v-model="drawDebugData" />
        <select v-model="activeMask">
          <option v-for="mask in masks.filter(b=>!b.hide)" :value="mask">{{mask.name}}</option>
        </select>
        <button @click="toggleLive">🎥 START FACE-TRACKING</button>
        <button v-if="false" @click="tracker.toggleRecording()">⏺️ record</button>
        <button v-if="false" @click="tracker.togglePlayback()">⏯️ playback</button>
       	</div>
        <component class="controls-section" :is="'input-' + activeMask.name" :mask="activeMask" />
      </div>
		</div>`,

    methods: {
      toggleLive() {
        console.log("TOGGLE LIVE MODE", this.capture);
        if (this.capture === undefined) {
          this.startCameraAndTracking();
        } else {
          this.pauseTracking = !this.pauseTracking;
        }
      },

      startCameraAndTracking() {
        console.log("TRACKING - START VIDEO CAPTURE");
        this.capture = this.settings.p.createCapture(this.settings.p.VIDEO);
        this.capture.hide();

        let count = 0;
        const maxCount = 100;
        const interval = 50;

        const intervalId = setInterval(() => {
          // console.log(this.capture.elt)
          if (this.capture.elt.width > 0) {
            // If the condition is met, stop the loop
            clearInterval(intervalId);
            console.log("Condition met, stopping loop.");
            this.tracker.setVideoSource(this.capture);
            this.tracker.initTracking();
          } else if (count >= maxCount) {
            // If 100 iterations have occurred without meeting the condition, stop the loop
            clearInterval(intervalId);
            console.warn("No capture created");
          }
          count++;
        }, interval);
      },

      initializeMask() {
        let p = this.settings.p;
        this.activeMask.setup({ p });
        this.tracker.hands.forEach((hand) =>
          this.activeMask.setupHand({ p, hand })
        );
        this.tracker.faces.forEach((face) =>
          this.activeMask.setupFace({ p, face })
        );
      },
    },
    watch: {
      activeMask() {
        this.initializeMask();
        localStorage.setItem("lastMask", this.activeMask.name);
      },
    },

    mounted() {
      new p5((p) => {
        // We have a new "p" object representing the sketch

        // Save p to the Vue element, so we have access in other methods
        this.settings.p = p;

        p.frameRate(DEFAULT_FRAME_RATE);

        this.capture;
        p.setup = () => {
          p.createCanvas(WIDTH, HEIGHT);

          p.colorMode(p.HSL);
         
          // setup()
          this.initializeMask();
        };

        // p.preload = () => {
        //   console.log(window);
        //   // this.facemesh = ml5.facemesh( { maxFaces: 1, refineLandmarks: false, flipHorizontal: true });
        // };

        p.draw = () => {
          // p.background(100, 0, 100);
          this.activeMask.drawBackground({ p });
          if (this.capture) {
            // Mirror the capture
            p.push();
            p.scale(-0.4, 0.4);
            p.translate(-this.capture.width, 0);
            p.image(this.capture, 0, 0);
            p.pop();

            this.tracker.makePredictions();
          }

          if (this.drawDebugData) this.tracker.drawDebugData(p);
          
          this.tracker.activeFaces.forEach((face) =>
            this.activeMask.update({ p, face })
          );
          
          this.tracker.activeFaces.forEach((face) =>
            this.activeMask.drawFace({ p, face })
          );
          this.tracker.activeHands.forEach((hand) =>
            this.activeMask.drawHand({ p, hand })
          );
          
          
           this.activeMask.drawAll?.({ p, hands: this.tracker.activeHands, faces: this.tracker.activeFaces })
          
           
          
        };
      }, this.$refs.p5);

      this.tracker.togglePlayback();
    },

    data() {
      let lastMask = localStorage.getItem("lastMask");
      // Use the last-used space, or the first if we don't have a record
      let activeMask =
        masks.find((s) => s.name === lastMask) ||
        masks.filter((s) => !s.hide)[0];

      return {
        // Stuff that we pass to all fxns
        settings: {
          p: undefined,
          deltaTime: 0.1,
          time: 0,
        },

        activeMask,

        drawDebugData: false,
        tracker: new Tracker(trackingConfig),
        pauseTracking: false,
        isPaused: false,
      };
    },
    el: "#app",
  });
});
