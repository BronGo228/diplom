from sqlalchemy.orm import Session
import models, schemas
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# User CRUD
def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = pwd_context.hash(user.password)
    db_user = models.User(username=user.username, role=user.role, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

def update_user_role(db: Session, user_id: int, role: str):
    user = get_user(db, user_id)
    if user:
        user.role = role
        db.commit()
        db.refresh(user)
    return user

# Category CRUD
def get_categories(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Category).offset(skip).limit(limit).all()

def create_category(db: Session, category: schemas.CategoryCreate):
    db_category = models.Category(name=category.name)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

# Component CRUD
def get_components(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Component).offset(skip).limit(limit).all()

def get_component(db: Session, component_id: int):
    return db.query(models.Component).filter(models.Component.id == component_id).first()

def create_component(db: Session, component: schemas.ComponentCreate):
    db_component = models.Component(**component.model_dump())
    db.add(db_component)
    db.commit()
    db.refresh(db_component)
    return db_component

def get_components_stock(db: Session):
    components = db.query(models.Component).all()
    res = []
    for c in components:
        # We need to manually calculate the total, or use SQLAlchemy func.sum
        stock = db.query(models.Batch).filter(models.Batch.component_id == c.id).all()
        total = sum(b.quantity for b in stock)
        res.append({"component": c, "total_quantity": total})
    return res

# Location CRUD
def create_location(db: Session, location: schemas.LocationCreate):
    db_location = models.Location(**location.model_dump())
    db.add(db_location)
    db.commit()
    db.refresh(db_location)
    return db_location

def get_locations(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Location).offset(skip).limit(limit).all()

# Batch CRUD
def create_batch(db: Session, batch: schemas.BatchCreate):
    db_batch = models.Batch(**batch.model_dump())
    db.add(db_batch)
    db.commit()
    db.refresh(db_batch)
    return db_batch

def get_batches(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Batch).offset(skip).limit(limit).all()

def get_batch(db: Session, batch_id: int):
    return db.query(models.Batch).filter(models.Batch.id == batch_id).first()

def get_batch_by_barcode(db: Session, barcode: str):
    return db.query(models.Batch).filter(models.Batch.barcode == barcode).first()

# Transaction CRUD
def create_transaction(db: Session, transaction: schemas.TransactionCreate):
    db_transaction = models.Transaction(**transaction.model_dump())
    batch = get_batch(db, transaction.batch_id)
    if batch:
        if transaction.transaction_type == "IN":
            batch.quantity += transaction.quantity
        elif transaction.transaction_type == "OUT":
            batch.quantity -= transaction.quantity
            if batch.quantity < 0:
                 batch.quantity = 0 # Prevent negative stock
        elif transaction.transaction_type == "AUDIT_ADJUSTMENT":
            batch.quantity = transaction.quantity
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

def get_transactions(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Transaction).order_by(models.Transaction.timestamp.desc()).offset(skip).limit(limit).all()

# --- REQUESTS / BOM CRUD ---
def get_requests(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Request).order_by(models.Request.id.desc()).offset(skip).limit(limit).all()

def fulfill_request(db: Session, request_id: int):
    req = db.query(models.Request).filter(models.Request.id == request_id).first()
    if not req:
        return None
    if req.status == "FULFILLED":
        return req
        
    for item in req.items:
        needed = item.requested_quantity - item.issued_quantity
        if needed <= 0:
            continue
            
        batches = db.query(models.Batch).filter(
            models.Batch.component_id == item.component_id,
            models.Batch.quantity > 0
        ).order_by(models.Batch.created_at).all()
        
        for b in batches:
            if needed <= 0:
                break
            take = min(b.quantity, needed)
            b.quantity -= take
            item.issued_quantity += take
            needed -= take
            
            # create transaction
            tx = models.Transaction(
                batch_id=b.id,
                user_id=req.user_id,
                request_id=req.id,
                transaction_type="OUT",
                quantity=take,
                notes=f"Fulfillment for Request #{req.id}"
            )
            db.add(tx)
            
    # Check if completely fulfilled
    all_fulfilled = all(i.requested_quantity <= i.issued_quantity for i in req.items)
    if all_fulfilled:
        req.status = "FULFILLED"
    else:
        req.status = "PARTIAL"
        
    db.commit()
    db.refresh(req)
    return req

# --- AUDIT CRUD ---
def get_audits(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.AuditCycle).order_by(models.AuditCycle.date_started.desc()).offset(skip).limit(limit).all()

def get_audit(db: Session, audit_id: int):
    return db.query(models.AuditCycle).filter(models.AuditCycle.id == audit_id).first()

def submit_audit_result(db: Session, audit_id: int, user_id: int, batch_barcode: str, actual_quantity: int):
    b = db.query(models.Batch).filter(models.Batch.barcode == batch_barcode).first()
    if not b: return None
        
    expected = b.quantity
    
    # Check if already scanned
    res = db.query(models.AuditResult).filter(
        models.AuditResult.audit_id == audit_id,
        models.AuditResult.batch_id == b.id
    ).first()
    
    if expected == actual_quantity: status = "Match"
    elif expected < actual_quantity: status = "Extra"
    else: status = "Missing"
        
    if not res:
        res = models.AuditResult(
            audit_id=audit_id, location_id=b.location_id, batch_id=b.id,
            expected_quantity=expected, actual_quantity=actual_quantity, status=status
        )
        db.add(res)
    else:
        res.actual_quantity = actual_quantity
        res.status = status
        
    diff = actual_quantity - expected
    if diff != 0:
        b.quantity = actual_quantity
        tx = models.Transaction(
            batch_id=b.id, user_id=user_id, transaction_type="AUDIT_ADJUSTMENT",
            quantity=abs(diff), notes=f"Audit adjustment '{status}': diff {diff}"
        )
        db.add(tx)
        
    db.commit()
    db.refresh(res)
    return res

# --- STOCK RECEIPTS ---
def create_stock_receipt(db: Session, receipt: schemas.StockReceiptCreate):
    db_receipt = models.StockReceipt(
        number=receipt.number, status=receipt.status, warehouse_id=receipt.warehouse_id,
        organization=receipt.organization, project_id=receipt.project_id,
        comment=receipt.comment, total_amount=receipt.total_amount, user_id=receipt.user_id
    )
    db.add(db_receipt)
    db.commit()
    db.refresh(db_receipt)
    
    for item in receipt.items:
        db_item = models.StockReceiptItem(
            receipt_id=db_receipt.id, component_id=item.component_id,
            quantity=item.quantity, price=item.price, reason=item.reason
        )
        db.add(db_item)
    db.commit()
    db.refresh(db_receipt)
    return db_receipt

def get_stock_receipts(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.StockReceipt).order_by(models.StockReceipt.created_at.desc()).offset(skip).limit(limit).all()

def get_stock_receipt(db: Session, receipt_id: int):
    return db.query(models.StockReceipt).filter(models.StockReceipt.id == receipt_id).first()

def post_stock_receipt(db: Session, receipt_id: int, user_id: int):
    receipt = get_stock_receipt(db, receipt_id)
    if not receipt or receipt.status == "Posted":
        return None
        
    for item in receipt.items:
        # Create a new batch for this receipt to inject stock
        batch = models.Batch(
            component_id=item.component_id,
            location_id=receipt.warehouse_id,
            quantity=item.quantity,
            packaging_type="Loose", # default for receipts usually
            supplier=receipt.organization
        )
        db.add(batch)
        db.flush() # get batch id
        
        # Log transaction
        tx = models.Transaction(
            batch_id=batch.id,
            user_id=user_id,
            transaction_type="RECEIPT",
            quantity=item.quantity,
            notes=f"Оприходование №{receipt.number}. Причина: {item.reason or '-'}"
        )
        db.add(tx)
        
    db.commit()
    db.refresh(receipt)
    return receipt

# --- STOCK WRITE-OFFS ---
def create_stock_write_off(db: Session, write_off: schemas.StockWriteOffCreate):
    db_writeoff = models.StockWriteOff(
        number=write_off.number, status=write_off.status, warehouse_id=write_off.warehouse_id,
        organization=write_off.organization, project_id=write_off.project_id,
        expense_item=write_off.expense_item, comment=write_off.comment, 
        total_amount=write_off.total_amount, user_id=write_off.user_id
    )
    db.add(db_writeoff)
    db.commit()
    db.refresh(db_writeoff)
    
    for item in write_off.items:
        db_item = models.StockWriteOffItem(
            write_off_id=db_writeoff.id, component_id=item.component_id,
            quantity=item.quantity, price=item.price, reason=item.reason
        )
        db.add(db_item)
    db.commit()
    db.refresh(db_writeoff)
    return db_writeoff

def get_stock_write_offs(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.StockWriteOff).order_by(models.StockWriteOff.created_at.desc()).offset(skip).limit(limit).all()

def get_stock_write_off(db: Session, write_off_id: int):
    return db.query(models.StockWriteOff).filter(models.StockWriteOff.id == write_off_id).first()

def post_stock_write_off(db: Session, write_off_id: int, user_id: int):
    writeoff = get_stock_write_off(db, write_off_id)
    if not writeoff or writeoff.status == "Posted":
        return None
        
    # Write off from batches in the selected warehouse.
    for item in writeoff.items:
        batches = db.query(models.Batch).filter(
            models.Batch.component_id == item.component_id,
            models.Batch.location_id == writeoff.warehouse_id,
            models.Batch.quantity > 0
        ).order_by(models.Batch.created_at).all()
        
        needed = item.quantity
        total_available = sum(b.quantity for b in batches)
        
        if total_available < needed:
            raise ValueError(f"Недостаточно остатков для компонента ID {item.component_id} на выбранном складе. Нужно: {needed}, Доступно: {total_available}")
            
        for b in batches:
            if needed <= 0:
                break
            take = min(b.quantity, needed)
            b.quantity -= take
            needed -= take
            
            # Log transaction
            tx = models.Transaction(
                batch_id=b.id,
                user_id=user_id,
                transaction_type="WRITE_OFF",
                quantity=take, # positive amount represents absolute value of transaction
                notes=f"Списание №{writeoff.number}. Статья: {writeoff.expense_item}. Причина: {item.reason or '-'}"
            )
            db.add(tx)
            
    writeoff.status = "Posted"
    db.commit()
    db.refresh(writeoff)
    return writeoff

# --- STOCK TRANSFERS ---
def create_stock_transfer(db: Session, transfer: schemas.StockTransferCreate):
    db_transfer = models.StockTransfer(
        number=transfer.number, status=transfer.status, 
        from_warehouse_id=transfer.from_warehouse_id, to_warehouse_id=transfer.to_warehouse_id,
        organization=transfer.organization, project_id=transfer.project_id,
        comment=transfer.comment, user_id=transfer.user_id,
        total_amount=transfer.total_amount
    )
    db.add(db_transfer)
    db.commit()
    db.refresh(db_transfer)
    
    for item in transfer.items:
        db_item = models.StockTransferItem(
            transfer_id=db_transfer.id, component_id=item.component_id,
            quantity=item.quantity, price=item.price
        )
        db.add(db_item)
    db.commit()
    db.refresh(db_transfer)
    return db_transfer

def get_stock_transfers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.StockTransfer).order_by(models.StockTransfer.created_at.desc()).offset(skip).limit(limit).all()

def get_stock_transfer(db: Session, transfer_id: int):
    return db.query(models.StockTransfer).filter(models.StockTransfer.id == transfer_id).first()

def post_stock_transfer(db: Session, transfer_id: int, user_id: int):
    transfer = get_stock_transfer(db, transfer_id)
    if not transfer or transfer.status == "Posted":
        return None
        
    for item in transfer.items:
        # Step 1: Write-off from from_warehouse_id
        batches = db.query(models.Batch).filter(
            models.Batch.component_id == item.component_id,
            models.Batch.location_id == transfer.from_warehouse_id,
            models.Batch.quantity > 0
        ).order_by(models.Batch.created_at).all()
        
        needed = item.quantity
        total_available = sum(b.quantity for b in batches)
        
        if total_available < needed:
            raise ValueError(f"Недостаточно остатков (ID {item.component_id}) на складе-источнике. Нужно: {needed}, Доступно: {total_available}")
            
        for b in batches:
            if needed <= 0:
                break
            take = min(b.quantity, needed)
            b.quantity -= take
            needed -= take
            
            tx_out = models.Transaction(
                batch_id=b.id,
                user_id=user_id,
                transaction_type="TRANSFER_OUT",
                quantity=take,
                notes=f"Списание по перемещению №{transfer.number}."
            )
            db.add(tx_out)
            
        # Step 2: Receive into to_warehouse_id
        # We create a new batch for the destination warehouse
        new_batch = models.Batch(
            component_id=item.component_id,
            location_id=transfer.to_warehouse_id,
            quantity=item.quantity,
            packaging_type="Loose", # default
            supplier=transfer.organization
        )
        db.add(new_batch)
        db.flush()
        
        tx_in = models.Transaction(
            batch_id=new_batch.id,
            user_id=user_id,
            transaction_type="TRANSFER_IN",
            quantity=item.quantity,
            notes=f"Зачисление по перемещению №{transfer.number}."
        )
        db.add(tx_in)
            
    transfer.status = "Posted"
    db.commit()
    db.refresh(transfer)
    return transfer

