from pydantic import BaseModel, Field
from typing import Optional


class GenerationRequest(BaseModel):
    prompt: str = ""
    rendering_style: str = "photorealistic"
    reference_strength: int = Field(
        50,
        ge=0,
        le=100
    )
    resolution: str = "512x512"


class ReferenceImageResponse(BaseModel):
    uploaded: bool
    filename: Optional[str] = None


class GenerationDetails(BaseModel):
    prompt: str
    rendering_style: str
    reference_strength: int
    resolution: str


class ImageEvaluation(BaseModel):
    resolution: str
    brightness: float
    contrast: float
    sharpness: float
    quality: str


class GenerationResponse(BaseModel):
    message: str
    status: str
    image_url: str
    generation: GenerationDetails
    reference_image: ReferenceImageResponse
    evaluation: ImageEvaluation