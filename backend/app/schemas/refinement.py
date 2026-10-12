from pydantic import BaseModel, Field


class RefinementRequest(BaseModel):
    prompt: str = Field(..., min_length=1)
    strength: int = Field(
        50,
        ge=0,
        le=100
    )

class RefinmentEvaluation(BaseModel):
    resolution: str
    brightness: float
    contrast: float
    sharpness: float
    quality: str

class RefinementResponse(BaseModel):
    message: str
    status: str
    image_url: str
    evaluation: RefinmentEvaluation