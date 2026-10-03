import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_NAME = os.getenv("DB_NAME", "hybrid_ai_rendering")
    DB_USER = os.getenv("DB_USER", "postgres")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "")
    DB_PORT = os.getenv("DB_PORT", "5432")

    SECRET_KEY = os.getenv(
        "SECRET_KEY",
        "hybrid-ai-secret-key-change-later"
    )

    ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
    TOKEN_EXPIRE_MINUTES = int(
        os.getenv("TOKEN_EXPIRE_MINUTES", "60")
    )


settings = Settings()