/**
 * @typedef CameraUpdateEvent
 * @type {object}
 * @property {HTMLCanvasElement} renderCanvas
 * @property {CanvasRenderingContext2D} renderCanvasCtx
 * @property {boolean} isReady        Is the camera' stream ready to be played
 * @property {boolean} isPlaying      Is the camera' stream currently being played
 * @property {boolean} newUpdateFrame May the current frame be refreshed based on updateFrameRate
 */

class _FrameHandler {
    /**
     * Constructor
     * @param {Number} rate Frame rate
     */
    constructor(rate) {
        if (rate > 0) this.rate = rate
        else this.rate = 1
        this.last = Date.now()
    }

    get elapsed() {
        const now = Date.now()
        const elapsed = now - this.last
        this.last = now - (elapsed % this.rate)
        return elapsed > this.rate
    }
}

class Camera extends EventTarget {
    /**
     * Constructor
     * @param {MediaStream} cameraStream The mediaStream access
     * @param {String} renderCanvasSelector The canvas to render the webcam
     * @param {Number} frameRate The canvas rendering frame rate. -1 = no limit
     * @param {Number} updateFrameRate Frame rate towhich set `newFrame` to `true`
     */
    constructor(
        cameraStream,
        renderCanvasSelector,
        frameRate = -1,
        updateFrameRate = 1000 / 1
    ) {
        super()

        const self = this

        this.cameraStream = cameraStream

        this.frameRate = new _FrameHandler(frameRate)

        this.updateFrameRate = new _FrameHandler(updateFrameRate)

        this.camera = document.createElement("video")
        this.camera.playsInline = true
        this.camera.muted = true

        /**
         * @type {boolean}
         */
        this.isPlaying = false

        /**
         * @type {boolean}
         */
        this.isReady = false

        /**
         * @type {HTMLCanvasElement} this.renderCanvas
         */
        this.renderCanvas = document.querySelector(renderCanvasSelector)

        /**
         * @type {CanvasRenderingContext2D} this.renderCanvasCtx
         */
        this.renderCanvasCtx = this.renderCanvas.getContext("2d")

        /**
         * @type {number}
         */
        this.requestAnimationFrame = -1

        /**
         * @type {boolean}
         */
        this.newUpdateFrame = false

        /**
         * @type {boolean}
         */
        this.horizontal = false

        /**
         * @type {boolean}
         */
        this.vertical = false

        const updateEvent = new CustomEvent("update", {
            /**
             * @type {CameraUpdateEvent}
             */
            detail: {
                renderCanvas: self.renderCanvas,
                renderCanvasCtx: self.renderCanvasCtx,
                isReady: self.isReady,
                isPlaying: self.isPlaying,
                newUpdateFrame: self.newUpdateFrame,
            },
            bubbles: true,
            cancelable: false,
        })

        function updateCanvas() {
            if (!self.frameRate.elapsed) return
            self.renderCanvas.width = self.camera.videoWidth
            self.renderCanvas.height = self.camera.videoHeight
            if (self.camera.videoWidth === 0 || self.camera.videoHeight === 0) {
                self.requestAnimationFrame = requestAnimationFrame(updateCanvas)
                return
            }
            self.renderCanvasCtx.translate(
                self.horizontal ? self.renderCanvas.width : 0,
                self.vertical ? self.renderCanvas.height : 0
            )
            self.renderCanvasCtx.scale(
                self.horizontal ? -1 : 1,
                self.vertical ? -1 : 1
            )
            self.renderCanvasCtx.drawImage(
                self.camera,
                0,
                0,
                self.camera.videoWidth,
                self.camera.videoHeight
            )
            self.newUpdateFrame = self.updateFrameRate.elapsed
            self.dispatchEvent(updateEvent)
            self.requestAnimationFrame = requestAnimationFrame(updateCanvas)
        }

        this.camera.onloadedmetadata = function (e) {
            self.isReady = true
        }

        this.camera.onplaying = function (e) {
            requestAnimationFrame(updateCanvas)
        }

        this.camera.srcObject = this.cameraStream
    }

    get frame() {
        return this.renderCanvas.toDataURL("image/png")
    }

    start() {
        const self = this
        const i = setInterval(function () {
            if (self.isReady) {
                self.isPlaying = true
                self.camera.play()
                clearInterval(i)
            }
        }, 500)
    }

    resume() {
        this.camera.play()
    }

    stop() {
        this.isPlaying = false
        this.camera.pause()
    }
}

async function getCamera() {
    const mediaDevices = navigator.mediaDevices
    if (mediaDevices === undefined)
        throw "Unable to load navigator MediaDevices API."

    try {
        return await mediaDevices.getUserMedia({
            video: true,
        })
    } catch (error) {
        throw error
    }
}

// Use Case :
// window.onload = async function (e) {
//     const cameraStream = await getCamera()
//     const camera = new Camera(cameraStream, "canvas#cam-rendering")

//     camera.addEventListener("update", function (e) {
//         /**
//          * @type {CameraUpdateEvent}
//          */
//         const detail = e.detail

//         console.log(detail.renderCanvasCtx)
//     })

//     camera.start()
// }
