from pydantic import BaseModel
from typing import Optional


class HistoryItem(BaseModel):
    id: int
    prompt: str
    rendering_style: str
    reference_strength: int
    resolution: str
    image_filename: str
    created_at: str

    brightness: Optional[float] = None
    contrast: Optional[float] = None
    sharpness: Optional[float] = None
    quality: Optional[str] = None


class HistoryResponse(BaseModel):
    status: str
    count: int
    history: list[HistoryItem]