from fastapi import APIRouter, HTTPException

from backend.app.schemas.auth import UserRegister, UserLogin

import bcrypt
from jose import jwt
from datetime import datetime, timedelta

from backend.app.database.connection import get_connection
from backend.app.core.config import settings


router = APIRouter(
    tags=["Authentication"]
)


@router.post("/register")
def register_user(user: UserRegister):

    connection = get_connection()
    cursor = connection.cursor()

    try:

        cursor.execute(
            "SELECT id FROM users WHERE email = %s",
            (user.email,)
        )

        if cursor.fetchone():

            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )

        password_hash = bcrypt.hashpw(
            user.password.encode(),
            bcrypt.gensalt()
        ).decode()

        cursor.execute(
            """
            INSERT INTO users (name, email, password_hash)
            VALUES (%s, %s, %s)
            RETURNING id, name, email
            """,
            (
                user.name,
                user.email,
                password_hash
            )
        )

        new_user = cursor.fetchone()

        connection.commit()

        return {
            "message": "Registration successful",
            "user": {
                "id": new_user[0],
                "name": new_user[1],
                "email": new_user[2]
            }
        }

    except HTTPException:

        connection.rollback()
        raise

    except Exception:

        connection.rollback()

        raise HTTPException(
            status_code=500,
            detail="Registration failed"
        )

    finally:

        cursor.close()
        connection.close()


@router.post("/login")
def login_user(user: UserLogin):

    connection = get_connection()
    cursor = connection.cursor()

    try:

        cursor.execute(
            """
            SELECT id, name, email, password_hash
            FROM users
            WHERE email = %s
            """,
            (user.email,)
        )

        existing_user = cursor.fetchone()

        if not existing_user:

            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )

        user_id, name, email, password_hash = existing_user

        if not bcrypt.checkpw(
            user.password.encode(),
            password_hash.encode()
        ):

            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )

        expire = datetime.utcnow() + timedelta(
            minutes=settings.TOKEN_EXPIRE_MINUTES
        )

        token = jwt.encode(
            {
                "sub": str(user_id),
                "email": email,
                "exp": expire
            },
            settings.SECRET_KEY,
            algorithm=settings.ALGORITHM
        )

        return {
            "message": "Login successful",
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user_id,
                "name": name,
                "email": email
            }
        }

    except HTTPException:

        raise

    except Exception:

        raise HTTPException(
            status_code=500,
            detail="Login failed"
        )

    finally:

        cursor.close()
        connection.close()