from PIL import Image


def prepare_refinement_image(
    image: Image.Image
) -> Image.Image:

    if image is None:
        raise ValueError(
            "Image is required for refinement"
        )

    return image.convert("RGB").resize(
        (512, 512)
    )