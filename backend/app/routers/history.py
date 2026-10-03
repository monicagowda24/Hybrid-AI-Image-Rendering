from fastapi import APIRouter, HTTPException, Depends

import os

from backend.app.core.security import get_current_user_id
from backend.app.database.connection import get_connection
from backend.app.schemas.history import HistoryResponse


router = APIRouter(
    prefix="/history",
    tags=["History"]
)


@router.get("", response_model=HistoryResponse)
def get_history(
    current_user_id: int = Depends(get_current_user_id)
):

    connection = get_connection()
    cursor = connection.cursor()

    try:

        cursor.execute(
            """
            SELECT
                id,
                prompt,
                rendering_style,
                reference_strength,
                resolution,
                image_filename,
                created_at,
                brightness,
                contrast,
                sharpness,
                quality
            FROM generation_history
            WHERE user_id = %s
            ORDER BY created_at DESC
            """,
            (current_user_id,)
        )

        records = cursor.fetchall()

        history = []

        for record in records:

            history.append({

                "id": record[0],

                "prompt": record[1],

                "rendering_style": record[2],

                "reference_strength": record[3],

                "resolution": record[4],

                "image_filename": record[5],

                "image_url":
                    f"/generated_images/{record[5]}",

                "created_at":
                    record[6].isoformat(),

                "brightness": record[7],

                "contrast": record[8],

                "sharpness": record[9],

                "quality": record[10]
            })

        return {

            "status": "success",

            "count": len(history),

            "history": history
        }

    finally:

        cursor.close()
        connection.close()


@router.delete("/{history_id}")
def delete_history(
    history_id: int,
    current_user_id: int = Depends(
        get_current_user_id
    )
):

    connection = get_connection()
    cursor = connection.cursor()

    try:

        cursor.execute(
            """
            SELECT image_filename
            FROM generation_history
            WHERE id = %s
            AND user_id = %s
            """,
            (
                history_id,
                current_user_id
            )
        )

        record = cursor.fetchone()

        if not record:

            raise HTTPException(
                status_code=404,
                detail="History record not found"
            )

        image_filename = record[0]

        cursor.execute(
            """
            DELETE FROM generation_history
            WHERE id = %s
            AND user_id = %s
            """,
            (
                history_id,
                current_user_id
            )
        )

        connection.commit()

        image_path = os.path.join(
            "backend",
            "generated_images",
            image_filename
        )

        if os.path.exists(image_path):
            os.remove(image_path)

        return {

            "status": "success",

            "message":
                "History deleted successfully"
        }

    except HTTPException:

        connection.rollback()
        raise

    except Exception:

        connection.rollback()

        raise HTTPException(
            status_code=500,
            detail="Unable to delete history"
        )

    finally:

        cursor.close()
        connection.close()