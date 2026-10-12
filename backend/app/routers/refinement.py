from fastapi import (
    APIRouter,
    HTTPException,
    UploadFile,
    File,
    Form,
    Depends
)

from typing import Annotated

import io
import uuid
import base64

from PIL import Image

from backend.app.core.security import get_current_user_id
from backend.app.database.connection import get_connection

from backend.app.services.refinement_service import (
    prepare_refinement_image
)

from backend.app.services.prompt_service import (
    enhance_prompt
)

from backend.app.services.image_generator import (
    generate_image
)

from backend.app.services.evaluation_service import (
    evaluate_image
)

from backend.app.services.storage_service import (
    save_generated_image
)

from backend.app.schemas.refinement import (
    RefinementResponse
)


router = APIRouter(
    prefix="/refinement",
    tags=["Refinement"]
)


@router.post(
    "/refine",
    response_model=RefinementResponse
)
async def refine_image(
    current_user_id: int = Depends(
        get_current_user_id
    ),

    prompt: str = Form(...),

    strength: int = Form(50),

    image: Annotated[
        UploadFile,
        File(...)
    ] = None
):

    prompt = prompt.strip()

    if not prompt:
        raise HTTPException(
            status_code=400,
            detail="Refinement prompt cannot be empty"
        )

    if not 0 <= strength <= 100:
        raise HTTPException(
            status_code=400,
            detail="Refinement strength must be between 0 and 100"
        )

    if not image:
        raise HTTPException(
            status_code=400,
            detail="Image is required for refinement"
        )

    try:

        image_bytes = await image.read()

        original_image = Image.open(
            io.BytesIO(image_bytes)
        )

        reference_image = prepare_refinement_image(
            original_image
        )

        final_prompt = enhance_prompt(
            prompt,
            "photorealistic"
        )

        image_data = generate_image(
            prompt=final_prompt,
            size="512x512",
            quality="medium",
            reference_image=reference_image,
            reference_strength=strength
        )

        generated_image = Image.open(
            io.BytesIO(
                base64.b64decode(
                    image_data
                )
            )
        ).convert("RGB")

        # ==============================
        # EVALUATE REFINED IMAGE
        # ==============================

        evaluation = evaluate_image(
            generated_image
        )

        filename = (
            f"refined_{uuid.uuid4().hex}.png"
        )

        save_generated_image(
            image_data,
            filename
        )

        # ==============================
        # SAVE HISTORY
        # ==============================

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
                VALUES (
                    %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s
                )
                """,
                (
                    current_user_id,
                    prompt,
                    "refinement",
                    strength,
                    "512x512",
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

        # ==============================
        # RESPONSE
        # ==============================

        return {
            "message":
                "Image refined successfully",

            "status":
                "completed",

            "image_url":
                f"/generated_images/{filename}",

            "evaluation":
                evaluation
        }


    except HTTPException:
        raise

    except Exception as e:

        print(
            "Image refinement error:",
            e
        )

        raise HTTPException(
            status_code=500,
            detail=f"Image refinement failed: {str(e)}"
        )