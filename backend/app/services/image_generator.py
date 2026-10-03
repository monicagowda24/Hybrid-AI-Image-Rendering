import base64
import io

import torch
from PIL import Image

from diffusers import (
    ControlNetModel,
    StableDiffusionControlNetPipeline
)

from backend.app.services.sketch_service import process_sketch

# =====================================================
# MODEL CONFIGURATION
# =====================================================

MODEL_ID = "stable-diffusion-v1-5/stable-diffusion-v1-5"
CONTROLNET_ID = "lllyasviel/control_v11p_sd15_lineart"

IMAGE_SIZE = (512, 512)
INFERENCE_STEPS = 10
GUIDANCE_SCALE = 7.0


# =====================================================
# LOAD CONTROLNET
# =====================================================

print("Loading local ControlNet...")

controlnet = ControlNetModel.from_pretrained(
    CONTROLNET_ID,
    torch_dtype=torch.float16,
    local_files_only=True
)


# =====================================================
# LOAD STABLE DIFFUSION
# =====================================================

print("Loading local Stable Diffusion pipeline...")

pipe = StableDiffusionControlNetPipeline.from_pretrained(
    MODEL_ID,
    controlnet=controlnet,
    torch_dtype=torch.float16,
    local_files_only=True
)

pipe.enable_model_cpu_offload()
pipe.enable_attention_slicing()

print("HYBRID AI PIPELINE READY")


# =====================================================
# IMAGE GENERATION
# =====================================================

def generate_image(
    prompt: str,
    size: str = "512x512",
    quality: str = "medium",
    reference_image: Image.Image = None,
    reference_strength: int = 50
):

    if not prompt or not prompt.strip():
        raise ValueError("Prompt cannot be empty")

    if size != "512x512":
        raise ValueError(
            "Only 512x512 resolution is supported"
        )

    if not 0 <= reference_strength <= 100:
        raise ValueError(
            "Reference strength must be between 0 and 100"
        )

    # -------------------------------------------------
    # TEXT ONLY
    # -------------------------------------------------

    if reference_image is None:

        control_image = Image.new(
            "RGB",
            IMAGE_SIZE,
            "white"
        )

        control_strength = 0.0

    # -------------------------------------------------
    # TEXT + SKETCH
    # -------------------------------------------------

    else:

        control_image = process_sketch(
            reference_image
        )

        control_strength = reference_strength / 100

    # -------------------------------------------------
    # GENERATE
    # -------------------------------------------------

    result = pipe(
        prompt=prompt.strip(),
        image=control_image,
        width=IMAGE_SIZE[0],
        height=IMAGE_SIZE[1],
        num_inference_steps=INFERENCE_STEPS,
        guidance_scale=GUIDANCE_SCALE,
        controlnet_conditioning_scale=control_strength
    )

    image = result.images[0]
    
    # -------------------------------------------------
    # BASE64
    # -------------------------------------------------

    buffer = io.BytesIO()

    image.save(
        buffer,
        format="PNG"
    )

    return base64.b64encode(
        buffer.getvalue()
    ).decode("utf-8")


# =====================================================
# SAVE IMAGE
# =====================================================

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