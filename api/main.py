from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

import models, schemas, crud
from database import SessionLocal, engine, get_db

# Create DB tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Radio Inventory API")

# Setup CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to Radio Inventory API"}

# --- AUTH ---
from pydantic import BaseModel
class UserLogin(BaseModel):
    username: str
    password: str

@app.post("/login/", response_model=schemas.User)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == login_data.username).first()
    if not db_user or db_user.hashed_password != login_data.password:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    return db_user

# --- USERS ---
@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    return crud.create_user(db=db, user=user)

@app.get("/users/", response_model=List[schemas.User])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_users(db, skip=skip, limit=limit)

@app.put("/users/{user_id}/role", response_model=schemas.User)
def update_user_role(user_id: int, role_update: schemas.UserUpdateRole, db: Session = Depends(get_db)):
    user = crud.update_user_role(db, user_id=user_id, role=role_update.role)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# --- CATEGORIES ---
@app.post("/categories/", response_model=schemas.Category)
def create_category(category: schemas.CategoryCreate, db: Session = Depends(get_db)):
    return crud.create_category(db=db, category=category)

@app.get("/categories/", response_model=List[schemas.Category])
def read_categories(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_categories(db, skip=skip, limit=limit)

# --- COMPONENTS ---
@app.post("/components/", response_model=schemas.Component)
def create_component(component: schemas.ComponentCreate, db: Session = Depends(get_db)):
    return crud.create_component(db=db, component=component)

@app.get("/components/", response_model=List[schemas.Component])
def read_components(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_components(db, skip=skip, limit=limit)

@app.get("/components/stock", response_model=List[schemas.ComponentWithStock])
def read_components_stock(db: Session = Depends(get_db)):
    return crud.get_components_stock(db)

@app.get("/components/{component_id}", response_model=schemas.Component)
def read_component(component_id: int, db: Session = Depends(get_db)):
    db_component = crud.get_component(db, component_id=component_id)
    if db_component is None:
        raise HTTPException(status_code=404, detail="Component not found")
    return db_component

# --- LOCATIONS ---
@app.post("/locations/", response_model=schemas.Location)
def create_location(location: schemas.LocationCreate, db: Session = Depends(get_db)):
    return crud.create_location(db=db, location=location)

@app.get("/locations/", response_model=List[schemas.Location])
def read_locations(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_locations(db, skip=skip, limit=limit)

# --- BATCHES ---
@app.post("/batches/", response_model=schemas.Batch)
def create_batch(batch: schemas.BatchCreate, db: Session = Depends(get_db)):
    return crud.create_batch(db=db, batch=batch)

@app.get("/batches/", response_model=List[schemas.Batch])
def read_batches(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_batches(db, skip=skip, limit=limit)

@app.get("/batches/barcode/{barcode}", response_model=schemas.Batch)
def read_batch_by_barcode(barcode: str, db: Session = Depends(get_db)):
    db_batch = crud.get_batch_by_barcode(db, barcode=barcode)
    if db_batch is None:
        raise HTTPException(status_code=404, detail="Batch with this barcode not found")
    return db_batch

# --- TRANSACTIONS ---
@app.post("/transactions/", response_model=schemas.Transaction)
def create_transaction(transaction: schemas.TransactionCreate, db: Session = Depends(get_db)):
    db_batch = crud.get_batch(db, batch_id=transaction.batch_id)
    if db_batch is None:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    if transaction.transaction_type == "OUT" and db_batch.quantity < transaction.quantity:
        raise HTTPException(status_code=400, detail="Not enough stock in batch to perform OUT transaction")
        
    return crud.create_transaction(db=db, transaction=transaction)

@app.get("/transactions/", response_model=List[schemas.Transaction])
def read_transactions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_transactions(db, skip=skip, limit=limit)

# --- PROJECTS & BOMS ---
@app.post("/projects/", response_model=schemas.Project)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db)):
    db_project = models.Project(**project.model_dump())
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

@app.post("/boms/", response_model=schemas.BOM)
def create_bom(bom: schemas.BOMCreate, db: Session = Depends(get_db)):
    db_bom = models.BOM(**bom.model_dump())
    db.add(db_bom)
    db.commit()
    db.refresh(db_bom)
    return db_bom

# --- REQUESTS / ORDERS ---
@app.post("/requests/", response_model=schemas.RequestSchema)
def create_request(req: schemas.RequestCreate, db: Session = Depends(get_db)):
    db_req = models.Request(user_id=req.user_id, bom_id=req.bom_id, status=req.status)
    db.add(db_req)
    db.commit()
    db.refresh(db_req)
    for item in req.items:
        db_item = models.RequestItem(
            request_id=db_req.id, 
            component_id=item.component_id, 
            requested_quantity=item.requested_quantity,
            issued_quantity=0
        )
        db.add(db_item)
    db.commit()
    db.refresh(db_req)
    return db_req

@app.get("/requests/", response_model=List[schemas.RequestSchema])
def read_requests(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_requests(db, skip=skip, limit=limit)

@app.post("/requests/{request_id}/fulfill", response_model=schemas.RequestSchema)
def fulfill_request(request_id: int, db: Session = Depends(get_db)):
    req = crud.fulfill_request(db, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    return req

# --- AUDIT CYCLES ---
@app.post("/audits/", response_model=schemas.AuditCycle)
def create_audit(audit: schemas.AuditCycleCreate, db: Session = Depends(get_db)):
    db_audit = models.AuditCycle(**audit.model_dump())
    db.add(db_audit)
    db.commit()
    db.refresh(db_audit)
    return db_audit

@app.get("/audits/", response_model=List[schemas.AuditCycle])
def read_audits(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_audits(db, skip=skip, limit=limit)

@app.get("/audits/{audit_id}", response_model=schemas.AuditCycle)
def read_audit(audit_id: int, db: Session = Depends(get_db)):
    db_audit = crud.get_audit(db, audit_id)
    if not db_audit: raise HTTPException(status_code=404, detail="Audit not found")
    return db_audit
    
@app.post("/audits/{audit_id}/scan", response_model=schemas.AuditResult)
def scan_audit_item(audit_id: int, req: schemas.AuditScanRequest, db: Session = Depends(get_db)):
    res = crud.submit_audit_result(db, audit_id, req.user_id, req.batch_barcode, req.actual_quantity)
    if not res:
        raise HTTPException(status_code=404, detail="Batch barcode not found in DB")
    return res

# --- STOCK RECEIPTS ---
@app.post("/receipts/", response_model=schemas.StockReceiptSchema)
def create_receipt(receipt: schemas.StockReceiptCreate, db: Session = Depends(get_db)):
    return crud.create_stock_receipt(db=db, receipt=receipt)

@app.get("/receipts/", response_model=List[schemas.StockReceiptSchema])
def read_receipts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_stock_receipts(db, skip=skip, limit=limit)

@app.get("/receipts/{receipt_id}", response_model=schemas.StockReceiptSchema)
def read_receipt(receipt_id: int, db: Session = Depends(get_db)):
    db_receipt = crud.get_stock_receipt(db, receipt_id=receipt_id)
    if db_receipt is None:
        raise HTTPException(status_code=404, detail="Stock receipt not found")
    return db_receipt

@app.post("/receipts/{receipt_id}/post", response_model=schemas.StockReceiptSchema)
def post_receipt(receipt_id: int, user_id: int, db: Session = Depends(get_db)):
    receipt = crud.post_stock_receipt(db, receipt_id, user_id=user_id)
    if not receipt:
        raise HTTPException(status_code=400, detail="Receipt not found or already posted")
    return receipt

# --- STOCK WRITE-OFFS ---
@app.post("/write-offs/", response_model=schemas.StockWriteOffSchema)
def create_write_off(write_off: schemas.StockWriteOffCreate, db: Session = Depends(get_db)):
    return crud.create_stock_write_off(db=db, write_off=write_off)

@app.get("/write-offs/", response_model=List[schemas.StockWriteOffSchema])
def read_write_offs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_stock_write_offs(db, skip=skip, limit=limit)

@app.get("/write-offs/{write_off_id}", response_model=schemas.StockWriteOffSchema)
def read_write_off(write_off_id: int, db: Session = Depends(get_db)):
    db_writeoff = crud.get_stock_write_off(db, write_off_id=write_off_id)
    if db_writeoff is None:
        raise HTTPException(status_code=404, detail="Stock write-off not found")
    return db_writeoff

@app.post("/write-offs/{write_off_id}/post", response_model=schemas.StockWriteOffSchema)
def post_write_off(write_off_id: int, user_id: int, db: Session = Depends(get_db)):
    try:
        writeoff = crud.post_stock_write_off(db, write_off_id, user_id=user_id)
        if not writeoff:
            raise HTTPException(status_code=400, detail="Write-off not found or already posted")
        return writeoff
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- STOCK TRANSFERS ---
@app.post("/transfers/", response_model=schemas.StockTransferSchema)
def create_transfer(transfer: schemas.StockTransferCreate, db: Session = Depends(get_db)):
    return crud.create_stock_transfer(db=db, transfer=transfer)

@app.get("/transfers/", response_model=List[schemas.StockTransferSchema])
def read_transfers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_stock_transfers(db, skip=skip, limit=limit)

@app.get("/transfers/{transfer_id}", response_model=schemas.StockTransferSchema)
def read_transfer(transfer_id: int, db: Session = Depends(get_db)):
    db_transfer = crud.get_stock_transfer(db, transfer_id=transfer_id)
    if db_transfer is None:
        raise HTTPException(status_code=404, detail="Stock transfer not found")
    return db_transfer

@app.post("/transfers/{transfer_id}/post", response_model=schemas.StockTransferSchema)
def post_transfer(transfer_id: int, user_id: int, db: Session = Depends(get_db)):
    try:
        transfer = crud.post_stock_transfer(db, transfer_id, user_id=user_id)
        if not transfer:
            raise HTTPException(status_code=400, detail="Transfer not found or already posted")
        return transfer
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
