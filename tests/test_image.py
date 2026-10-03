import os
import base64
from dotenv import load_dotenv
from google import genai

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

print("API key loaded:", bool(api_key))

client = genai.Client(api_key=api_key)

interaction = client.interactions.create(
    model="gemini-3.1-flash-image",
    input="Create a realistic image of a beautiful futuristic city at sunset."
)

if interaction.output_image:
    with open("frontend/generated_images/test.png", "wb") as f:
        f.write(base64.b64decode(interaction.output_image.data))

    print("IMAGE GENERATED SUCCESSFULLY!")
else:
    print("No image returned.")