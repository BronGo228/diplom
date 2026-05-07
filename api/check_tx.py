from sqlalchemy.orm import Session
from database import SessionLocal
import models, crud, schemas

db = SessionLocal()
try:
    print("Users:", db.query(models.User).all())
    tx = schemas.TransactionCreate(batch_id=7, user_id=1, transaction_type="IN", quantity=100, notes="Test")
    print("Payload:", tx)
    res = crud.create_transaction(db, tx)
    print("Created TX:", res.id)
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
