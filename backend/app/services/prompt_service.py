# =====================================================
# PROMPT PROCESSING SERVICE
# =====================================================

STYLE_PRESETS = {
    "photorealistic":
        "photorealistic, realistic lighting, natural details",

    "cinematic":
        "cinematic composition, dramatic lighting, detailed",

    "artistic":
        "artistic style, creative composition, rich details",

    "anime":
        "anime style, clean lines, vibrant colors",

    "digital art":
        "high quality digital art, detailed composition"
}


def enhance_prompt(
    prompt: str,
    rendering_style: str = "photorealistic"
) -> str:

    prompt = prompt.strip()

    if not prompt:
        raise ValueError("Prompt cannot be empty")

    style_prompt = STYLE_PRESETS.get(
        rendering_style.lower(),
        rendering_style
    )

    return (
        f"{prompt}. "
        f"Style: {style_prompt}. "
        f"High quality, detailed image."
    )