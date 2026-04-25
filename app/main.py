from fastapi import FastAPI, Depends, HTTPException
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from . import models, schemas, database
from typing import List, Optional
from .auth import get_password_hash, create_access_token, verify_password, SECRET_KEY, ALGORITHM
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware

models.Base.metadata.create_all(bind=database.engine)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

app = FastAPI()
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=401, detail="Email already registered")
    real_hashed_password = get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=real_hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.get("/users/", response_model=List[schemas.User])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users 

@app.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}    

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code = 401,
        detail= "Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        email: Optional[str] = payload.get("sub")

        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

@app.get("/users/me/")
def read_user_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.post("/tasks/", response_model=schemas.Task)
def create_task_for_user(
    task: schemas.TaskCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user) 
):
    if task.category_id is not None:
        db_category = db.query(models.Category).filter(models.Category.id == task.category_id).first()
        if db_category is None or db_category.owner_id != current_user.id:
            raise HTTPException(
                status_code = 403,
                detail="You don't have permission to use this category"
            )

    db_task = models.Task(**task.model_dump(), owner_id=current_user.id)
    
    db.add(db_task)
    db.commit()
    db.refresh(db_task)

    return db_task


@app.delete("/tasks/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()

    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if db_task.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this task")
    
    db.delete(db_task)
    db.commit()

    return {"message": "Task deleted successfully"}

@app.post("/categories/", response_model=schemas.Category)
def create_category(
    category: schemas.CategoryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_category = models.Category(**category.model_dump(), owner_id=current_user.id)

    db.add(db_category)
    db.commit()
    db.refresh(db_category)

    return db_category

@app.delete("/categories/{category_id}")
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_category = db.query(models.Category).filter(models.Category.id == category_id).first()

    if db_category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    
    if db_category.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this category")
    
    db.delete(db_category)
    db.commit()

    return {"message": "Category deleted successfully"}

@app.get("/tasks/", response_model=List[schemas.Task])
def read_own_tasks(
    completed: Optional[bool] = None,
    priority: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Task).filter(models.Task.owner_id == current_user.id)

    if completed is not None:
        query = query.filter(models.Task.completed == completed)

    if priority: 
        query = query.filter(models.Task.priority == priority)
    
    return query.all()

@app.get("/tasks/{task_id}", response_model=schemas.Task)
def read_task(task_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    task = db.query(models.Task).filter(models.Task.id == task_id, models.Task.owner_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found or not yours")
    return task

@app.get("/categories/", response_model=List[schemas.Category])
def read_own_categories(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    categories = db.query(models.Category).filter(models.Category.owner_id == current_user.id).offset(skip).limit(limit).all()
    return categories


@app.put("/tasks/{task_id}", response_model=schemas.Task) # Am pus schemas. aici
def update_task(
    task_id: int, 
    task_update: schemas.TaskCreate, # Adăugat "schemas."
    db: Session = Depends(get_db), 
    current_user: schemas.User = Depends(get_current_user) # Adăugat "schemas."
):
    # Restul codului rămâne la fel...
    # 1. Căutăm task-ul în baza de date
    db_task = db.query(models.Task).filter(
        models.Task.id == task_id, 
        models.Task.owner_id == current_user.id
    ).first()
    
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found or not yours")

    # 2. Actualizăm valorile cu ce am primit din Frontend
    db_task.title = task_update.title
    db_task.description = task_update.description if task_update.description is not None else ""
    db_task.priority = task_update.priority if task_update.priority is not None else "Low"
    db_task.completed = task_update.completed

    db.commit()
    db.refresh(db_task)
    return db_task
