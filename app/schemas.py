from pydantic import BaseModel
from typing import List, Optional

# --- TASKS ---

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    completed: bool = False
    priority: Optional[str] = "Low"
    category_id: Optional[int] = None

class TaskCreate(TaskBase):

    pass

class Task(TaskBase):
    id: int
    owner_id: int

    class Config:
        orm_mode = True

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    completed: Optional[bool] = None
    priority: Optional[str] = None
    category_id: Optional[int] = None

# --- USERS ---

class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    tasks: List[Task] = []

    model_config = {"from_attributes": True}


# --- CATEGORIES ---

class CategoryBase(BaseModel):
    name: str

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: int
    owner_id: int

    model_config = {"from_attributes": True}


