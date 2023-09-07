# JS Cam

This project aims to make Camera device programming easier.

# How to use ?

The `js-cam.js` file contains all the code needed to help you implement a camera device easily. To use it follow the following steps :

-   download the `js-cam.js` file inside your JavaScript assets folder,
-   copy this inside your `<head>` HTML section :

```html
<script src="js-cam.js" async defer></script>
```

-   make sure you have a canvas inwhich you want to render the camera :

```html
<canvas id="cam-rendering"></canvas>
```

-   add another script line below :

```html
<script>
    // Makes sure the canvas has been added to the DOM before trying to
    // access it.
    window.onload = async function (winEvent) {
        const camera = await newCamera("canvas#cam-rendering")

        camera.addEventListener("update", function (camEvent) {
            /**
             * @type {CameraUpdateEvent}
             */
            const detail = camEvent.detail

            console.log(detail.renderCanvasCtx)
        })

        camera.start()
    }
</script>
```

-   go to your web page and click "Accept" to the web browser camera device prompt.

# Warnings
As you might not be aware, I prefer to warn you that [Camera device can only be used in a secured context](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia). You need to either :
-   run your server locally with `localhost`,
-   run your server with an SSL certificate so you can use `HTTPS`,
-   run the webpage using the `file:///` schema.
