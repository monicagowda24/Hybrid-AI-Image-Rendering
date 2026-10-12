from fastapi import (
    APIRouter,
    HTTPException,
    UploadFile,
    File,
    Form,
    Depends
)

from typing import Optional, Annotated

import base64
import io
import uuid

from PIL import Image

from backend.app.database.connection import get_connection
from backend.app.core.security import get_current_user_id
from backend.app.schemas.generation import GenerationResponse

from backend.app.services.prompt_service import enhance_prompt
from backend.app.services.evaluation_service import evaluate_image

from backend.app.services.image_generator import (
    generate_image
)

from backend.app.services.storage_service import (
    save_generated_image
)


router = APIRouter(
    tags=["Generation"]
)


@router.post(
    "/generate",
    response_model=GenerationResponse
)
async def generate_image_api(

    current_user_id: int = Depends(
        get_current_user_id
    ),

    prompt: str = Form(""),

    rendering_style: str = Form(
        "photorealistic"
    ),

    reference_strength: int = Form(50),

    resolution: str = Form(
        "512x512"
    ),

    reference_image: Annotated[
        Optional[UploadFile],
        File()
    ] = None
):

    prompt = prompt.strip()


    # ---------------------------------------------
    # VISUAL INPUT VALIDATION
    # ---------------------------------------------

    if not prompt and reference_image is None:

        raise HTTPException(
            status_code=400,
            detail=(
                "Please provide a prompt or "
                "upload a reference image or sketch."
            )
        )


    # ---------------------------------------------
    # REFERENCE STRENGTH
    # ---------------------------------------------

    if not 0 <= reference_strength <= 100:

        raise HTTPException(
            status_code=400,
            detail=(
                "Reference strength must be "
                "between 0 and 100"
            )
        )


    # ---------------------------------------------
    # REFERENCE IMAGE VALIDATION
    # ---------------------------------------------

    if reference_image:

        allowed_types = {
            "image/png",
            "image/jpeg",
            "image/jpg"
        }

        if reference_image.content_type not in allowed_types:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Only PNG, JPG and JPEG "
                    "images are allowed"
                )
            )


    try:

        # ---------------------------------------------
        # REFERENCE IMAGE
        # ---------------------------------------------

        reference_pil = None

        if reference_image:

            image_bytes = await reference_image.read()

            reference_pil = Image.open(
                io.BytesIO(image_bytes)
            ).convert("RGB")


        # ---------------------------------------------
        # FALLBACK PROMPT
        # ---------------------------------------------

        if not prompt:

            prompt = (
                "Create a detailed, high quality "
                "image based on the provided "
                "visual reference."
            )


        # ---------------------------------------------
        # PROMPT PROCESSING
        # ---------------------------------------------

        final_prompt = enhance_prompt(
            prompt,
            rendering_style
        )


        # ---------------------------------------------
        # IMAGE GENERATION
        # ---------------------------------------------

        image_data = generate_image(
            prompt=final_prompt,
            size="512x512",
            quality="medium",
            reference_image=reference_pil,
            reference_strength=reference_strength
        )


        # ---------------------------------------------
        # IMAGE EVALUATION
        # ---------------------------------------------

        generated_image = Image.open(
            io.BytesIO(
                base64.b64decode(image_data)
            )
        ).convert("RGB")


        evaluation = evaluate_image(
            generated_image
        )


        print(
            "Image evaluation:",
            evaluation
        )


        # ---------------------------------------------
        # SAVE IMAGE
        # ---------------------------------------------

        filename = (
            f"generated_{uuid.uuid4().hex}.png"
        )


        save_generated_image(
            image_data,
            filename
        )


        # ---------------------------------------------
        # SAVE HISTORY
        # ---------------------------------------------

        connection = get_connection()
        cursor = connection.cursor()

        try:

            cursor.execute(
                """
                INSERT INTO generation_history
                (
                    user_id,
                    prompt,
                    rendering_style,
                    reference_strength,
                    resolution,
                    image_filename,
                    brightness,
                    contrast,
                    sharpness,
                    quality
                )
                VALUES
                (
                    %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s
                )
                """,
                (
                    current_user_id,
                    prompt,
                    rendering_style,
                    reference_strength,
                    resolution,
                    filename,
                    evaluation["brightness"],
                    evaluation["contrast"],
                    evaluation["sharpness"],
                    evaluation["quality"]
                )
            )

            connection.commit()

        finally:

            cursor.close()
            connection.close()


        # ---------------------------------------------
        # RESPONSE
        # ---------------------------------------------

        return {

            "message":
                "Image generated successfully",

            "status":
                "completed",

            "image_url":
                f"/generated_images/{filename}",

            "generation": {

                "prompt":
                    prompt,

                "rendering_style":
                    rendering_style,

                "reference_strength":
                    reference_strength,

                "resolution":
                    resolution
            },

            "reference_image": {

                "uploaded":
                    reference_image is not None,

                "filename":
                    (
                        reference_image.filename
                        if reference_image
                        else None
                    )
            },

            "evaluation":
                evaluation
        }


    except HTTPException:

        raise


    except Exception as e:

        print(
            "Image generation error:",
            e
        )

        raise HTTPException(
            status_code=500,
            detail=(
                f"Image generation failed: {str(e)}"
            )
        )