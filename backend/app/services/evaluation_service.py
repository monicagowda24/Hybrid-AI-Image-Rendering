from PIL import Image, ImageStat, ImageFilter


def evaluate_image(
    image: Image.Image
) -> dict:

    if image is None:
        raise ValueError("Image is required")

    image = image.convert("RGB")

    # ---------------------------------------------
    # BASIC IMAGE INFORMATION
    # ---------------------------------------------

    width, height = image.size

    # ---------------------------------------------
    # BRIGHTNESS
    # ---------------------------------------------

    grayscale = image.convert("L")

    brightness = ImageStat.Stat(
        grayscale
    ).mean[0]

    # ---------------------------------------------
    # CONTRAST
    # ---------------------------------------------

    contrast = ImageStat.Stat(
        grayscale
    ).stddev[0]

    # ---------------------------------------------
    # SHARPNESS
    # ---------------------------------------------

    edges = grayscale.filter(
        ImageFilter.FIND_EDGES
    )

    sharpness = ImageStat.Stat(
        edges
    ).mean[0]

    # ---------------------------------------------
    # QUALITY STATUS
    # ---------------------------------------------

    quality = "good"

    if sharpness < 5 or contrast < 10:
        quality = "needs_improvement"

    return {
        "resolution": f"{width}x{height}",
        "brightness": round(brightness, 2),
        "contrast": round(contrast, 2),
        "sharpness": round(sharpness, 2),
        "quality": quality
    }