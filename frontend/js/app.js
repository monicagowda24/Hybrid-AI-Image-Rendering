const promptBox = document.getElementById("prompt");
const charCount = document.getElementById("charCount");
const imageInput = document.getElementById("imageInput");
const preview = document.getElementById("imagePreview");
const previewImage = document.getElementById("previewImage");

promptBox.addEventListener("input", function () {
    charCount.textContent = promptBox.value.length + " / 1000";
});

function clearPrompt() {
    promptBox.value = "";
    charCount.textContent = "0 / 1000";
}

imageInput.addEventListener("change", function () {
    const file = imageInput.files[0];

    if (!file) return;

    previewImage.src = URL.createObjectURL(file);
    preview.classList.remove("hidden");
});

function removeImage(event) {
    event.stopPropagation();
    imageInput.value = "";
    preview.classList.add("hidden");
}

function generateImage() {
    const prompt = promptBox.value.trim();
    const status = document.getElementById("generationStatus");

    if (!prompt) {
        alert("Please enter a prompt first.");
        return;
    }

    status.textContent = "Processing...";

    alert("AI generation will be connected to the backend next.");
}