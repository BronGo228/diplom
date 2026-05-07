import asyncio
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
from crud import create_user
import schemas

# Create tables if not exist
models.Base.metadata.create_all(bind=engine)

def init_db():
    db = SessionLocal()
    try:
        # 1. Delete all existing users (safely reset for RBAC)
        db.query(models.User).delete()
        db.commit()
        
        roles_to_create = [
            {"username": "admin", "password": "admin", "role": "admin"},
            {"username": "buyer", "password": "buyer", "role": "buyer"},
            {"username": "storekeeper", "password": "storekeeper", "role": "storekeeper"},
            {"username": "seller", "password": "seller", "role": "seller"},
            {"username": "auditor", "password": "auditor", "role": "auditor"},
            {"username": "director", "password": "director", "role": "director"}
        ]
        
        for u in roles_to_create:
            # We use fake hashing for simplicity right now as requested
            db_user = models.User(
                username=u["username"], 
                hashed_password=u["password"], 
                role=u["role"]
            )
            db.add(db_user)
            
        db.commit()
        print(f"Successfully created {len(roles_to_create)} role-based users.")
    except Exception as e:
        print(f"Error seeding DB: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
