from PIL import Image, ImageEnhance, ImageFilter

from backend.app.services.image_generator import (
    lineart_detector
)


IMAGE_SIZE = (512, 512)


def process_sketch(
    reference_image: Image.Image
) -> Image.Image:

    if reference_image is None:
        raise ValueError(
            "Reference image is required"
        )

    # Convert to RGB
    image = reference_image.convert("RGB")

    # Resize while preserving good detail
    image = image.resize(
        IMAGE_SIZE,
        Image.Resampling.LANCZOS
    )

    # Improve contrast so the structure
    # is easier for ControlNet to understand.
    image = ImageEnhance.Contrast(
        image
    ).enhance(1.3)

    # Slightly sharpen the reference.
    image = image.filter(
        ImageFilter.SHARPEN
    )

    # Extract clean line structure.
    control_image = lineart_detector(
        image
    )

    return control_image.convert("RGB")