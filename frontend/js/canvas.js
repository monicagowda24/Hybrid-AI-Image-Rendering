document.addEventListener("DOMContentLoaded", function () {

    const canvas = document.getElementById("sketchCanvas");
    const brushSize = document.getElementById("brushSize");
    const brushSizeValue = document.getElementById("brushSizeValue");
    const clearButton = document.getElementById("clearCanvas");
    const useSketchButton = document.getElementById("useSketch");
    const status = document.getElementById("sketchStatus");

    if (!canvas) {
        return;
    }

    const ctx = canvas.getContext("2d");

    let drawing = false;
    let sketchReady = false;

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "black";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    function getPosition(event) {

        const rect = canvas.getBoundingClientRect();

        return {
            x:
                (event.clientX - rect.left) *
                (canvas.width / rect.width),

            y:
                (event.clientY - rect.top) *
                (canvas.height / rect.height)
        };
    }

    canvas.addEventListener("pointerdown", function (event) {

        event.preventDefault();

        drawing = true;
        sketchReady = false;

        canvas.setPointerCapture(event.pointerId);

        const position = getPosition(event);

        ctx.beginPath();
        ctx.moveTo(position.x, position.y);
    });

    canvas.addEventListener("pointermove", function (event) {

        if (!drawing) {
            return;
        }

        event.preventDefault();

        const position = getPosition(event);

        ctx.lineWidth = Number(brushSize.value);

        ctx.lineTo(position.x, position.y);
        ctx.stroke();
    });

    canvas.addEventListener("pointerup", function () {

        drawing = false;
        ctx.closePath();
    });

    canvas.addEventListener("pointercancel", function () {

        drawing = false;
        ctx.closePath();
    });

    brushSize.addEventListener("input", function () {

        brushSizeValue.textContent =
            brushSize.value + "px";
    });

    clearButton.addEventListener("click", function () {

        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        ctx.fillStyle = "white";
        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        sketchReady = false;

        status.textContent = "Sketch cleared.";
    });

    useSketchButton.addEventListener("click", function () {

        sketchReady = true;

        status.textContent =
            "Sketch ready for AI generation.";
    });

    // Make sketch available to workspace.js
    window.getSketchBlob = function () {

        return new Promise(function (resolve) {

            if (!sketchReady) {
                resolve(null);
                return;
            }

            canvas.toBlob(
                function (blob) {
                    resolve(blob);
                },
                "image/png"
            );
        });
    };
});