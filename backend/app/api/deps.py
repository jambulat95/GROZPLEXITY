from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from typing import Optional
from jose import JWTError, jwt
from sqlmodel import Session, select
from app.core.config import settings
from app.core.db import get_session
from app.models import UserProfile

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: Session = Depends(get_session)
) -> UserProfile:
    """Get current authenticated user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = session.exec(select(UserProfile).where(UserProfile.username == username)).first()
    if user is None:
        raise credentials_exception
    
    return user

async def get_current_user_optional(
    request: Request,
    session: Session = Depends(get_session)
) -> Optional[UserProfile]:
    """Get current authenticated user from JWT token, returns None if not authenticated."""
    authorization = request.headers.get("Authorization")
    if not authorization:
        return None
    
    # Extract token from "Bearer <token>"
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            return None
    except ValueError:
        return None
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
    except JWTError:
        return None
    
    user = session.exec(select(UserProfile).where(UserProfile.username == username)).first()
    return user

