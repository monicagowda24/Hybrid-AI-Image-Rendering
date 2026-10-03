from PIL import Image
from controlnet_aux import LineartDetector


ANNOTATOR_ID = "lllyasviel/Annotators"
IMAGE_SIZE = (512, 512)


print("Loading local line-art processor...")

lineart_detector = LineartDetector.from_pretrained(
    ANNOTATOR_ID,
    local_files_only=True
)


def process_sketch(
    reference_image: Image.Image
) -> Image.Image:

    if reference_image is None:
        raise ValueError(
            "Reference image is required"
        )

    reference_image = reference_image.convert("RGB")

    reference_image = reference_image.resize(
        IMAGE_SIZE
    )

    return lineart_detector(
        reference_image
    )