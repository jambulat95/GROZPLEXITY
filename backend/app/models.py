from typing import Optional, List, Dict
from datetime import datetime
from sqlmodel import Field, SQLModel, Relationship, Column, JSON
from sqlalchemy import Text

class UserProfile(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    master_profile: Dict = Field(default={}, sa_column=Column(JSON))
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    
    videos: List["VideoAnalysis"] = Relationship(back_populates="user")

class VideoAnalysis(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[int] = Field(default=None, foreign_key="userprofile.id")
    
    youtube_url: str
    title: str
    stats: Dict = Field(default={}, sa_column=Column(JSON))
    analysis_result: Dict = Field(default={}, sa_column=Column(JSON))
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    user: Optional[UserProfile] = Relationship(back_populates="videos")

