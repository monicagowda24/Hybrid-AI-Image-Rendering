from fastapi import (
    FastAPI,
    HTTPException,
    UploadFile,
    File,
    Form,
    Depends
)

from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from backend.app.database.connection import get_connection
from backend.app.routers.history import router as history_router
from backend.app.routers.auth import router as auth_router
from backend.app.routers.generation import router as generation_router
from backend.app.routers.refinement import router as refinement_router
from backend.app.database.connection import get_connection
from backend.app.database.models import create_tables
from backend.app.core.logging import setup_logging

from pydantic import BaseModel, EmailStr
from typing import Optional, Annotated


import bcrypt
from jose import jwt
from datetime import datetime, timedelta

import os
import uuid
import io
from pathlib import Path
from fastapi.staticfiles import StaticFiles

from PIL import Image

from backend.app.services.image_generator import (
    generate_image,
    save_image
)

setup_logging()

# =====================================================
# APP
# =====================================================

app = FastAPI(
    title="Hybrid AI Image Rendering API",
    description="Text and sketch conditioned image rendering system",
    version="1.0.0"
)




@app.on_event("startup")
def initialize_database():
    connection = get_connection()

    try:
        create_tables(connection)
    finally:
        connection.close()

app.include_router(auth_router)
app.include_router(history_router)
app.include_router(generation_router)
app.include_router(refinement_router)

# =====================================================
# GENERATED IMAGES
# =====================================================

GENERATED_DIR = (
    Path(__file__).resolve().parents[2]
    / "backend"
    / "generated_images"
)

GENERATED_DIR.mkdir(
    parents=True,
    exist_ok=True
)

app.mount(
    "/generated_images",
    StaticFiles(directory="backend/generated_images"),
    name="generated_images"
)


# =====================================================
# CORS
# =====================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =====================================================
# JWT
# =====================================================

SECRET_KEY = "hybrid-ai-secret-key-change-later"
ALGORITHM = "HS256"
TOKEN_EXPIRE_MINUTES = 60

security = HTTPBearer()


# =====================================================
# DATABASE
# =====================================================




# =====================================================
# CURRENT USER
# =====================================================

def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):

    try:

        payload = jwt.decode(
            credentials.credentials,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("sub")

        if not user_id:

            raise HTTPException(
                status_code=401,
                detail="Invalid authentication token"
            )

        return int(user_id)

    except Exception:

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )







# =====================================================
# HOME
# =====================================================

@app.get("/")
def home():

    return {
        "message": "Hybrid AI Image Rendering API is running"
    }


# =====================================================
# HEALTH
# =====================================================

@app.get("/health")
def health_check():

    return {
        "status": "healthy"
    }


# =====================================================
# FRONTEND
# =====================================================
app.mount(
    "/generated_images",
    StaticFiles(directory="backend/generated_images"),
    name="generated_images"
)

app.mount(
    "/",
    StaticFiles(
        directory="frontend",
        html=True
    ),
    name="frontend"
)