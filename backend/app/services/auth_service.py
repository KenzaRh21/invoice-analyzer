from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import UserRegister, UserLogin, Token, UserOut

class AuthService:
    def __init__(self, db: Session):
        self.repo = UserRepository(db)

    def register(self, payload: UserRegister) -> Token:
        existing = self.repo.get_by_email(payload.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email already exists."
            )

        hashed_pwd = get_password_hash(payload.password)
        user = User(
            email=payload.email.lower().strip(),
            password_hash=hashed_pwd,
            full_name=payload.full_name.strip()
        )
        created_user = self.repo.create(user)
        token = create_access_token(subject=created_user.id)
        return Token(access_token=token, user=UserOut.model_validate(created_user))

    def login(self, payload: UserLogin) -> Token:
        user = self.repo.get_by_email(payload.email)
        if not user or not verify_password(payload.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password."
            )
        token = create_access_token(subject=user.id)
        return Token(access_token=token, user=UserOut.model_validate(user))

    def get_current_user(self, user_id: str) -> User:
        user = self.repo.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or session expired."
            )
        return user
