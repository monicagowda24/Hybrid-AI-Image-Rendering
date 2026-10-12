console.log("WORKSPACE JS LOADED");

document.addEventListener("DOMContentLoaded", function () {

    // AUTH
    const token = localStorage.getItem("access_token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
        window.location.href = "pages/login.html";
        return;
    }

    const user = JSON.parse(userData);

    const userName = document.getElementById("userName");
    const logoutBtn = document.getElementById("logoutBtn");

    if (userName) {
        userName.textContent = user.name || "User";
    }

    logoutBtn.onclick = function () {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        localStorage.removeItem("lastGeneration");
        window.location.href = "pages/login.html";
    };


    // ELEMENT HELPER

    const $ = function (id) {
        return document.getElementById(id);
    };


    // ELEMENTS

    const prompt = $("promptInput");
    const counter = $("promptCounter");

    const reference = $("referenceImage");
    const preview = $("imagePreview");
    const previewBox = $("imagePreviewContainer");
    const uploadArea = $("uploadArea");

    const strength = $("referenceStrength");
    const strengthValue = $("strengthValue");

    const generateBtn = $("generateBtn");

    const placeholder = $("outputPlaceholder");
    const loading = $("generationLoading");
    const errorBox = $("generationError");
    const errorMessage = $("errorMessage");

    const result = $("generationResult");
    const generatedImage = $("generatedImage");

    const resultPrompt = $("resultPrompt");
    const resultStyle = $("resultStyle");
    const resultResolution = $("resultResolution");

    const evaluationBox = $("imageEvaluation");

    // COMPARISON

    const comparisonSection = $("comparisonSection");
    const originalSharpness = $("originalSharpness");
    const refinedSharpness = $("refinedSharpness");
    const originalContrast = $("originalContrast");
    const refinedContrast = $("refinedContrast");
    const originalQuality = $("originalQuality");
    const refinedQuality = $("refinedQuality");
    const comparisonSummary = $("comparisonSummary");


    // REFINEMENT

    const refinementPrompt = $("refinementPrompt");
    const refinementStrength = $("refinementStrength");
    const refinementStrengthValue =
        $("refinementStrengthValue");

    const refineBtn = $("refineBtn");
    const refinementLoading = $("refinementLoading");
    const refinementError = $("refinementError");


    // HELPERS

    function show(element, visible) {

        if (element) {
            element.hidden = !visible;
        }
    }


    function format(value) {

        if (value === null || value === undefined) {
            return "N/A";
        }

        const number = Number(value);

        return isNaN(number)
            ? "N/A"
            : number.toFixed(2);
    }


    function displayEvaluation(data) {

        if (!data) {
            show(evaluationBox, false);
            return;
        }

        evaluationBox.innerHTML =
            "<h3>Image Evaluation</h3>" +
            "<div class='evaluation-grid'>" +

            "<div class='evaluation-item'>" +
            "<span>Resolution</span>" +
            "<strong>" +
            (data.resolution || "N/A") +
            "</strong>" +
            "</div>" +

            "<div class='evaluation-item'>" +
            "<span>Brightness</span>" +
            "<strong>" +
            format(data.brightness) +
            "</strong>" +
            "</div>" +

            "<div class='evaluation-item'>" +
            "<span>Contrast</span>" +
            "<strong>" +
            format(data.contrast) +
            "</strong>" +
            "</div>" +

            "<div class='evaluation-item'>" +
            "<span>Sharpness</span>" +
            "<strong>" +
            format(data.sharpness) +
            "</strong>" +
            "</div>" +

            "<div class='evaluation-item'>" +
            "<span>Quality</span>" +
            "<strong>" +
            (data.quality || "N/A") +
            "</strong>" +
            "</div>" +

            "</div>";

        show(evaluationBox, true);
    }


    function saveGeneration(
        imageUrl,
        promptText,
        style,
        evaluation,
        originalEvaluation
    ) {

        localStorage.setItem(
            "lastGeneration",
            JSON.stringify({

                image_url: imageUrl,

                prompt: promptText,

                rendering_style: style,

                resolution: evaluation.resolution,

                evaluation: evaluation,

                original_evaluation:
                    originalEvaluation || evaluation

            })
        );
    }


    function displayComparison(
        originalEvaluation,
        refinedEvaluation
    ) {

        if (
            !originalEvaluation ||
            !refinedEvaluation
        ) {
            show(comparisonSection, false);
            return;
        }

        originalSharpness.textContent =
            format(originalEvaluation.sharpness);

        refinedSharpness.textContent =
            format(refinedEvaluation.sharpness);

        originalContrast.textContent =
            format(originalEvaluation.contrast);

        refinedContrast.textContent =
            format(refinedEvaluation.contrast);

        originalQuality.textContent =
            originalEvaluation.quality || "N/A";

        refinedQuality.textContent =
            refinedEvaluation.quality || "N/A";


        const sharpnessDifference =
            Number(refinedEvaluation.sharpness || 0) -
            Number(originalEvaluation.sharpness || 0);


        if (sharpnessDifference > 0) {

            comparisonSummary.textContent =
                "Refinement improved image sharpness by " +
                sharpnessDifference.toFixed(2) +
                " points.";

        } else if (sharpnessDifference < 0) {

            comparisonSummary.textContent =
                "Refinement changed the image, but sharpness " +
                "decreased by " +
                Math.abs(sharpnessDifference).toFixed(2) +
                " points.";

        } else {

            comparisonSummary.textContent =
                "Refinement produced the same sharpness score.";
        }

        show(comparisonSection, true);
    }


    // INITIAL UI

    show(placeholder, true);
    show(loading, false);
    show(errorBox, false);
    show(result, false);
    show(evaluationBox, false);
    show(comparisonSection, false);
    show(refinementLoading, false);
    show(refinementError, false);


    // RESTORE LAST IMAGE

    const saved =
        localStorage.getItem("lastGeneration");

    if (saved) {

        try {

            const data = JSON.parse(saved);

            prompt.value =
                data.prompt || "";

            counter.textContent =
                prompt.value.length +
                " / 1000";

            resultPrompt.textContent =
                data.prompt || "";

            resultStyle.textContent =
                data.rendering_style || "";

            resultResolution.textContent =
                data.resolution || "";

            displayEvaluation(
                data.evaluation
            );


            // Restore comparison if available

            if (
                data.original_evaluation &&
                data.evaluation &&
                data.rendering_style === "refinement"
            ) {

                displayComparison(
                    data.original_evaluation,
                    data.evaluation
                );
            }


            generatedImage.onload =
                function () {

                    show(
                        placeholder,
                        false
                    );

                    show(
                        result,
                        true
                    );
                };


            generatedImage.onerror =
                function () {

                    localStorage.removeItem(
                        "lastGeneration"
                    );
                };


            generatedImage.src =
                data.image_url +
                "?t=" +
                Date.now();


        } catch (error) {

            console.error(
                "Restore error:",
                error
            );

            localStorage.removeItem(
                "lastGeneration"
            );
        }
    }


    // PROMPT COUNTER

    prompt.oninput = function () {

        counter.textContent =
            prompt.value.length +
            " / 1000";
    };


    // REFERENCE IMAGE

    reference.onchange = function () {

        const file =
            reference.files[0];

        if (!file) {
            return;
        }


        const allowedTypes = [
            "image/png",
            "image/jpeg",
            "image/jpg"
        ];


        if (!allowedTypes.includes(file.type)) {

            alert(
                "Please upload PNG, JPG or JPEG."
            );

            reference.value = "";

            return;
        }


        if (file.size > 10 * 1024 * 1024) {

            alert(
                "Image size must be less than 10 MB."
            );

            reference.value = "";

            return;
        }


        const reader =
            new FileReader();


        reader.onload =
            function (event) {

                preview.src =
                    event.target.result;

                show(
                    previewBox,
                    true
                );

                uploadArea.style.display =
                    "none";
            };


        reader.readAsDataURL(file);
    };


    // REMOVE IMAGE

    $("removeImage").onclick =
        function () {

            reference.value = "";

            preview.src = "";

            show(
                previewBox,
                false
            );

            uploadArea.style.display =
                "";
        };


    // REFERENCE STRENGTH

    strength.oninput =
        function () {

            strengthValue.textContent =
                strength.value +
                "%";
        };


    // REFINEMENT STRENGTH

    if (refinementStrength) {

        refinementStrength.oninput =
            function () {

                refinementStrengthValue.textContent =
                    refinementStrength.value +
                    "%";
            };
    }


    // GENERATE IMAGE

    generateBtn.onclick =
        async function () {

            const promptText =
                prompt.value.trim();


            // Allow generation without a text prompt
// when a reference image or sketch is available.

const hasReferenceImage =
    reference.files.length > 0;

let hasSketch = false;

if (window.getSketchBlob) {
    const sketchBlob =
        await window.getSketchBlob();

    hasSketch = !!sketchBlob;
}

if (!promptText && !hasReferenceImage && !hasSketch) {

    alert(
        "Please enter a prompt or provide a reference image/sketch."
    );

    prompt.focus();

    return;
}


            show(
                placeholder,
                false
            );

            show(
                errorBox,
                false
            );

            show(
                result,
                false
            );

            show(
                comparisonSection,
                false
            );

            show(
                loading,
                true
            );


            generateBtn.disabled =
                true;

            generateBtn.textContent =
                "Generating...";


            const formData =
                new FormData();


            formData.append(
                "prompt",
                promptText || "Create a detailed image based on the visual reference."
            );


            formData.append(
                "rendering_style",
                $("renderingStyle").value
            );


            formData.append(
                "reference_strength",
                strength.value
            );


            formData.append(
                "resolution",
                $("resolution").value
            );


            if (
                reference.files.length > 0
            ) {

                formData.append(
                    "reference_image",
                    reference.files[0]
                );

            } else if (
                window.getSketchBlob
            ) {

                const sketchBlob =
                    await window.getSketchBlob();


                if (sketchBlob) {

                    formData.append(
                        "reference_image",
                        sketchBlob,
                        "sketch.png"
                    );
                }
            }


            try {

                const response =
                    await fetch(
                        "/generate",
                        {
                            method: "POST",

                            headers: {
                                Authorization:
                                    "Bearer " +
                                    token
                            },

                            body: formData
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.detail ||
                        "Image generation failed."
                    );
                }


                const imageUrl =
                    window.location.origin +
                    data.image_url;


                resultPrompt.textContent =
                    data.generation.prompt;


                resultStyle.textContent =
                    data.generation.rendering_style;


                resultResolution.textContent =
                    data.generation.resolution;


                displayEvaluation(
                    data.evaluation
                );


                // New generation becomes
                // the original version.

                saveGeneration(
                    imageUrl,
                    data.generation.prompt,
                    data.generation.rendering_style,
                    data.evaluation,
                    data.evaluation
                );


                generatedImage.onload =
                    function () {

                        show(
                            loading,
                            false
                        );

                        show(
                            result,
                            true
                        );
                    };


                generatedImage.src =
                    imageUrl +
                    "?t=" +
                    Date.now();


            } catch (error) {

                console.error(
                    "Generation error:",
                    error
                );


                show(
                    loading,
                    false
                );


                show(
                    errorBox,
                    true
                );


                errorMessage.textContent =
                    error.message ||
                    "Something went wrong.";


            } finally {

                generateBtn.disabled =
                    false;


                generateBtn.textContent =
                    "✨ Generate Image";
            }
        };


    // REFINE IMAGE

    if (refineBtn) {

        refineBtn.onclick =
            async function () {

                const promptText =
                    refinementPrompt.value.trim();


                if (!promptText) {

                    alert(
                        "Please describe how you want to refine the image."
                    );

                    refinementPrompt.focus();

                    return;
                }


                if (!generatedImage.src) {

                    alert(
                        "Please generate an image first."
                    );

                    return;
                }


                show(
                    refinementError,
                    false
                );


                show(
                    refinementLoading,
                    true
                );


                refineBtn.disabled =
                    true;


                refineBtn.textContent =
                    "Refining...";


                try {

                    // Save the current evaluation
                    // before refinement.

                    const savedBeforeRefinement =
                        localStorage.getItem(
                            "lastGeneration"
                        );


                    let originalEvaluation =
                        null;


                    if (
                        savedBeforeRefinement
                    ) {

                        try {

                            const savedData =
                                JSON.parse(
                                    savedBeforeRefinement
                                );


                            originalEvaluation =
                                savedData.original_evaluation ||
                                savedData.evaluation ||
                                null;

                        } catch (error) {

                            console.error(
                                "Evaluation restore error:",
                                error
                            );
                        }
                    }


                    const imageResponse =
                        await fetch(
                            generatedImage.src
                        );


                    if (!imageResponse.ok) {

                        throw new Error(
                            "Unable to access the current image."
                        );
                    }


                    const imageBlob =
                        await imageResponse.blob();


                    const formData =
                        new FormData();


                    formData.append(
                        "prompt",
                        promptText
                    );


                    formData.append(
                        "strength",
                        refinementStrength.value
                    );


                    formData.append(
                        "image",
                        imageBlob,
                        "generated.png"
                    );


                    const response =
                        await fetch(
                            "/refinement/refine",
                            {
                                method: "POST",

                                headers: {
                                    Authorization:
                                        "Bearer " +
                                        token
                                },

                                body: formData
                            }
                        );


                    const data =
                        await response.json();


                    if (!response.ok) {

                        throw new Error(
                            data.detail ||
                            "Image refinement failed."
                        );
                    }


                    const imageUrl =
                        window.location.origin +
                        data.image_url;


                    generatedImage.src =
                        imageUrl +
                        "?t=" +
                        Date.now();


                    displayEvaluation(
                        data.evaluation
                    );


                    // DISPLAY COMPARISON

                    displayComparison(
                        originalEvaluation,
                        data.evaluation
                    );


                    resultPrompt.textContent =promptText;


                    resultStyle.textContent =
                        "refinement";


                    resultResolution.textContent =
                        data.evaluation.resolution;


                    // SAVE REFINED IMAGE
                    // while preserving
                    // original evaluation.

                    saveGeneration(
                        imageUrl,
                        promptText,
                        "refinement",
                        data.evaluation,
                        originalEvaluation
                    );


                    refinementPrompt.value =
                        "";


                } catch (error) {

                    console.error(
                        "Refinement error:",
                        error
                    );


                    show(
                        refinementError,
                        true
                    );


                    refinementError.textContent =
                        error.message ||
                        "Image refinement failed.";


                } finally {

                    show(
                        refinementLoading,
                        false
                    );


                    refineBtn.disabled =
                        false;


                    refineBtn.textContent =
                        "✦ Refine Image";
                }
            };
    }

});