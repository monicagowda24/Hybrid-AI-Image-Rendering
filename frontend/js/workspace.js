console.log("WORKSPACE JS LOADED", Date.now());

document.addEventListener("DOMContentLoaded", function () {

    // ==============================
    // AUTH
    // ==============================

    const token = localStorage.getItem("access_token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
        window.location.href = "pages/login.html";
        return;
    }

    try {
        const user = JSON.parse(userData);

        document.getElementById("userName").textContent =
            user.name || "User";

    } catch {
        document.getElementById("userName").textContent = "User";
    }


    // ==============================
    // LOGOUT
    // ==============================

    document.getElementById("logoutBtn").addEventListener(
        "click",
        function () {

            localStorage.removeItem("access_token");
            localStorage.removeItem("user");
            localStorage.removeItem("lastGeneration");

            window.location.href = "pages/login.html";
        }
    );


    // ==============================
    // ELEMENTS
    // ==============================

    const promptInput =
        document.getElementById("promptInput");

    const promptCounter =
        document.getElementById("promptCounter");

    const referenceImage =
        document.getElementById("referenceImage");

    const imagePreview =
        document.getElementById("imagePreview");

    const imagePreviewContainer =
        document.getElementById("imagePreviewContainer");

    const uploadArea =
        document.getElementById("uploadArea");

    const removeImage =
        document.getElementById("removeImage");

    const referenceStrength =
        document.getElementById("referenceStrength");

    const strengthValue =
        document.getElementById("strengthValue");

    const generateBtn =
        document.getElementById("generateBtn");

    const outputPlaceholder =
        document.getElementById("outputPlaceholder");

    const generationLoading =
        document.getElementById("generationLoading");

    const generationError =
        document.getElementById("generationError");

    const errorMessage =
        document.getElementById("errorMessage");

    const generationResult =
        document.getElementById("generationResult");

    const generatedImage =
        document.getElementById("generatedImage");

    const resultPrompt =
        document.getElementById("resultPrompt");

    const resultStyle =
        document.getElementById("resultStyle");

    const resultResolution =
        document.getElementById("resultResolution");


    // ==============================
    // IMAGE EVALUATION
    // ==============================

    let evaluationBox =
        document.getElementById("imageEvaluation");

    if (!evaluationBox) {

        evaluationBox =
            document.createElement("div");

        evaluationBox.id =
            "imageEvaluation";

        evaluationBox.className =
            "image-evaluation";

        generationResult.appendChild(
            evaluationBox
        );
    }


    function displayEvaluation(evaluation) {

        if (!evaluation) {
            evaluationBox.hidden = true;
            return;
        }

        evaluationBox.innerHTML = `
            <h3>Image Evaluation</h3>

            <div class="evaluation-grid">

                <div class="evaluation-item">
                    <span>Resolution</span>
                    <strong>
                        ${evaluation.resolution}
                    </strong>
                </div>

                <div class="evaluation-item">
                    <span>Brightness</span>
                    <strong>
                        ${Number(
                            evaluation.brightness
                        ).toFixed(2)}
                    </strong>
                </div>

                <div class="evaluation-item">
                    <span>Contrast</span>
                    <strong>
                        ${Number(
                            evaluation.contrast
                        ).toFixed(2)}
                    </strong>
                </div>

                <div class="evaluation-item">
                    <span>Sharpness</span>
                    <strong>
                        ${Number(
                            evaluation.sharpness
                        ).toFixed(2)}
                    </strong>
                </div>

                <div class="evaluation-item">
                    <span>Quality</span>
                    <strong>
                        ${evaluation.quality}
                    </strong>
                </div>

            </div>
        `;

        evaluationBox.hidden = false;
    }


    // ==============================
    // INITIAL STATE
    // ==============================

    outputPlaceholder.hidden = false;
    generationLoading.hidden = true;
    generationError.hidden = true;
    generationResult.hidden = true;
    evaluationBox.hidden = true;


    // ==============================
    // RESTORE LAST GENERATION
    // ==============================

    const savedGeneration =
        localStorage.getItem("lastGeneration");

    if (savedGeneration) {

        try {

            const generation =
                JSON.parse(savedGeneration);

            promptInput.value =
                generation.prompt || "";

            promptCounter.textContent =
                promptInput.value.length + " / 1000";

            resultPrompt.textContent =
                generation.prompt || "";

            resultStyle.textContent =
                generation.rendering_style || "";

            resultResolution.textContent =
                generation.resolution || "";

            displayEvaluation(
                generation.evaluation
            );

            generatedImage.onload = function () {

                outputPlaceholder.hidden = true;
                generationLoading.hidden = true;
                generationError.hidden = true;
                generationResult.hidden = false;

            };

            generatedImage.onerror = function () {

                localStorage.removeItem(
                    "lastGeneration"
                );

                generationResult.hidden = true;
                outputPlaceholder.hidden = false;
            };

            generatedImage.src =
                generation.image_url +
                "?t=" +
                Date.now();

        } catch (error) {

            console.error(
                "Could not restore previous generation:",
                error
            );

            localStorage.removeItem(
                "lastGeneration"
            );
        }
    }


    // ==============================
    // PROMPT COUNTER
    // ==============================

    promptInput.addEventListener(
        "input",
        function () {

            promptCounter.textContent =
                promptInput.value.length +
                " / 1000";
        }
    );


    // ==============================
    // REFERENCE IMAGE
    // ==============================

    referenceImage.addEventListener(
        "change",
        function () {

            const file =
                referenceImage.files[0];

            if (!file) return;

            const allowed = [
                "image/png",
                "image/jpeg",
                "image/jpg"
            ];

            if (!allowed.includes(file.type)) {

                alert(
                    "Please upload PNG, JPG or JPEG."
                );

                referenceImage.value = "";

                return;
            }

            if (file.size > 10 * 1024 * 1024) {

                alert(
                    "Image size must be less than 10 MB."
                );

                referenceImage.value = "";

                return;
            }

            const reader =
                new FileReader();

            reader.onload =
                function (event) {

                    imagePreview.src =
                        event.target.result;

                    imagePreviewContainer.hidden =
                        false;

                    uploadArea.style.display =
                        "none";
                };

            reader.readAsDataURL(file);
        }
    );


    // ==============================
    // REMOVE REFERENCE
    // ==============================

    removeImage.addEventListener(
        "click",
        function () {

            referenceImage.value = "";

            imagePreview.src = "";

            imagePreviewContainer.hidden =
                true;

            uploadArea.style.display = "";
        }
    );


    // ==============================
    // REFERENCE STRENGTH
    // ==============================

    referenceStrength.addEventListener(
        "input",
        function () {

            strengthValue.textContent =
                referenceStrength.value +
                "%";
        }
    );


    // ==============================
    // GENERATE IMAGE
    // ==============================

    generateBtn.addEventListener(
        "click",
        async function (event) {

            event.preventDefault();

            console.log(
                "GENERATE CLICKED",
                Date.now()
            );

            const prompt =
                promptInput.value.trim();

            if (!prompt) {

                alert(
                    "Please enter a description for the image."
                );

                promptInput.focus();

                return;
            }


            // ------------------------------
            // SHOW LOADING
            // ------------------------------

            outputPlaceholder.hidden = true;
            generationError.hidden = true;
            generationResult.hidden = true;
            generationLoading.hidden = false;

            generateBtn.disabled = true;
            generateBtn.textContent =
                "Generating...";


            // ------------------------------
            // FORM DATA
            // ------------------------------

            const formData =
                new FormData();

            formData.append(
                "prompt",
                prompt
            );

            formData.append(
                "rendering_style",
                document.getElementById(
                    "renderingStyle"
                ).value
            );

            formData.append(
                "reference_strength",
                referenceStrength.value
            );

            formData.append(
                "resolution",
                document.getElementById(
                    "resolution"
                ).value
            );

            if (
                referenceImage.files.length > 0
            ) {

                formData.append(
                    "reference_image",
                    referenceImage.files[0]
                );
            }


            try {

                // ------------------------------
                // API REQUEST
                // ------------------------------

                const response =
                    await fetch(
                        "http://127.0.0.1:8000/generate",
                        {
                            method: "POST",

                            headers: {
                                "Authorization":
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


                console.log(
                    "Generation successful:",
                    data
                );


                // ------------------------------
                // IMAGE URL
                // ------------------------------

                const imageUrl =
                    "http://127.0.0.1:8000" +
                    data.image_url;


                // ------------------------------
                // SAVE LAST GENERATION
                // ------------------------------

                localStorage.setItem(
                    "lastGeneration",
                    JSON.stringify({

                        image_url:
                            imageUrl,

                        prompt:
                            data.generation.prompt,

                        rendering_style:
                            data.generation.rendering_style,

                        resolution:
                            data.generation.resolution,

                        evaluation:
                            data.evaluation
                    })
                );


                // ------------------------------
                // RESULT DETAILS
                // ------------------------------

                resultPrompt.textContent =
                    data.generation.prompt;

                resultStyle.textContent =
                    data.generation.rendering_style;

                resultResolution.textContent =
                    data.generation.resolution;


                // ------------------------------
                // DISPLAY EVALUATION
                // ------------------------------

                displayEvaluation(
                    data.evaluation
                );


                // ------------------------------
                // LOAD IMAGE
                // ------------------------------

                generatedImage.onload =
                    function () {

                        generationLoading.hidden =
                            true;

                        generationError.hidden =
                            true;

                        outputPlaceholder.hidden =
                            true;

                        generationResult.hidden =
                            false;

                        console.log(
                            "GENERATED IMAGE LOADED"
                        );
                    };


                generatedImage.onerror =
                    function () {

                        generationLoading.hidden =
                            true;

                        generationResult.hidden =
                            true;

                        generationError.hidden =
                            false;

                        errorMessage.textContent =
                            "The image was generated but could not be displayed.";
                    };


                generatedImage.src =
                    imageUrl +
                    "?t=" +
                    Date.now();


                console.log(
                    "IMAGE URL:",
                    imageUrl
                );


            } catch (error) {

                console.error(
                    "Generation error:",
                    error
                );

                generationLoading.hidden =
                    true;

                generationResult.hidden =
                    true;

                generationError.hidden =
                    false;

                errorMessage.textContent =
                    error.message ||
                    "Something went wrong.";
            }


            // ------------------------------
            // RESET BUTTON
            // ------------------------------

            generateBtn.disabled = false;

            generateBtn.textContent =
                "✨ Generate Image";

        }
    );

});