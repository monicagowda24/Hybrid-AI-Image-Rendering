import base64
import io

import torch
from PIL import Image, ImageEnhance

from diffusers import (
    ControlNetModel,
    StableDiffusionControlNetPipeline
)

from controlnet_aux import LineartDetector


# =========================
# LOCAL MODELS
# =========================

MODEL_ID = (
    "stable-diffusion-v1-5/"
    "stable-diffusion-v1-5"
)

CONTROLNET_ID = (
    "lllyasviel/"
    "control_v11p_sd15_lineart"
)

ANNOTATOR_ID = (
    "lllyasviel/"
    "Annotators"
)


# =========================
# LOAD CONTROLNET
# =========================

print("Loading local ControlNet...")

controlnet = ControlNetModel.from_pretrained(
    CONTROLNET_ID,
    torch_dtype=torch.float16,
    local_files_only=True
)


# =========================
# LOAD STABLE DIFFUSION
# =========================

print("Loading local Stable Diffusion pipeline...")

pipe = StableDiffusionControlNetPipeline.from_pretrained(
    MODEL_ID,
    controlnet=controlnet,
    torch_dtype=torch.float16,
    local_files_only=True
)


# =========================
# MEMORY OPTIMIZATION
# =========================

pipe.enable_model_cpu_offload()
pipe.enable_attention_slicing()


# =========================
# LOAD LINEART PROCESSOR
# =========================

print("Loading local line-art processor...")

lineart_detector = LineartDetector.from_pretrained(
    ANNOTATOR_ID,
    local_files_only=True
)

print("HYBRID AI PIPELINE READY")


# =========================
# IMAGE GENERATION
# =========================

def generate_image(
    prompt: str,
    size: str = "512x512",
    quality: str = "medium",
    reference_image: Image.Image = None,
    reference_strength: int = 50
):

    width, height = map(
        int,
        size.split("x")
    )

    # ---------------------------------
    # Prepare control image
    # ---------------------------------

    if reference_image is None:

        control_image = Image.new(
            "RGB",
            (512, 512),
            "white"
        )

        control_strength = 0.0

    else:

        reference_image = reference_image.convert(
            "RGB"
        )

        reference_image = reference_image.resize(
            (512, 512),
            Image.Resampling.LANCZOS
        )

        # Slightly improve the reference
        # before extracting line structure.

        reference_image = ImageEnhance.Contrast(
            reference_image
        ).enhance(1.25)

        control_image = lineart_detector(
            reference_image
        )

        control_image = control_image.convert(
            "RGB"
        )

        control_strength = (
            reference_strength / 100
        )

        # Prevent extremely weak or strong
        # ControlNet influence.

        control_strength = max(
            0.25,
            min(control_strength, 0.90)
        )


    # ---------------------------------
    # Improve prompt
    # ---------------------------------

    final_prompt = (
        prompt.strip()
        + ", high quality, detailed, "
        "sharp focus, realistic lighting, "
        "clean details, well defined image"
    )

    negative_prompt = (
        "blurry, low quality, distorted, "
        "deformed, bad anatomy, extra fingers, "
        "extra limbs, duplicate, cropped, "
        "text, watermark, logo, artifacts"
    )


    # ---------------------------------
    # Generation quality
    # ---------------------------------

    if quality == "high":

        steps = 20
        guidance = 7.5

    elif quality == "low":

        steps = 12
        guidance = 7.0

    else:

        steps = 16
        guidance = 7.5


    # ---------------------------------
    # Generate
    # ---------------------------------

    result = pipe(
        prompt=final_prompt,
        negative_prompt=negative_prompt,
        image=control_image,
        width=width,
        height=height,
        num_inference_steps=steps,
        guidance_scale=guidance,
        controlnet_conditioning_scale=control_strength,
        control_guidance_start=0.0,
        control_guidance_end=0.85
    )


    # ---------------------------------
    # Convert result to PNG
    # ---------------------------------

    image = result.images[0].convert(
        "RGB"
    )

    buffer = io.BytesIO()

    image.save(
        buffer,
        format="PNG"
    )

    return base64.b64encode(
        buffer.getvalue()
    ).decode("utf-8")


# =========================
# SAVE IMAGE
# =========================

def save_image(
    base64_data: str,
    output_path: str
):

    image_data = base64.b64decode(
        base64_data
    )

    with open(
        output_path,
        "wb"
    ) as file:

        file.write(image_data)