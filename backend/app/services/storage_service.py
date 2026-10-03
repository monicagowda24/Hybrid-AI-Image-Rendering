import base64
import os


GENERATED_IMAGE_DIRECTORY = "backend/generated_images"


def save_generated_image(
    base64_data: str,
    filename: str
):
    os.makedirs(
        GENERATED_IMAGE_DIRECTORY,
        exist_ok=True
    )

    image_data = base64.b64decode(
        base64_data
    )

    output_path = os.path.join(
        GENERATED_IMAGE_DIRECTORY,
        filename
    )

    with open(
        output_path,
        "wb"
    ) as file:
        file.write(image_data)

    return output_path