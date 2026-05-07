from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Table, Float
from sqlalchemy.orm import relationship
import datetime

from database import Base

# Many-to-Many relationship for Component substitutes (Analogs)
component_substitutes = Table(
    'component_substitutes',
    Base.metadata,
    Column('component_id', Integer, ForeignKey('components.id'), primary_key=True),
    Column('substitute_id', Integer, ForeignKey('components.id'), primary_key=True)
)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String) # Manager, WarehouseWorker, Sysadmin, Salesperson, Auditor
    
    requests = relationship("Request", back_populates="user")
    audits = relationship("AuditCycle", back_populates="auditor")

class Location(Base):
    __tablename__ = "locations"
    id = Column(Integer, primary_key=True, index=True)
    zone = Column(String, index=True)
    row = Column(String, nullable=True)
    rack = Column(String, nullable=True)
    shelf = Column(String, nullable=True)
    cell = Column(String, nullable=True)
    barcode = Column(String, unique=True, index=True, nullable=True)

    batches = relationship("Batch", back_populates="location")

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    components = relationship("Component", back_populates="category")

class Component(Base):
    __tablename__ = "components"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    part_number = Column(String, index=True, nullable=True)
    description = Column(String, nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id"))
    manufacturer = Column(String, nullable=True)

    category = relationship("Category", back_populates="components")
    batches = relationship("Batch", back_populates="component")
    
    # Self-referential many-to-many relationship for analogs
    substitutes = relationship(
        "Component",
        secondary=component_substitutes,
        primaryjoin=id==component_substitutes.c.component_id,
        secondaryjoin=id==component_substitutes.c.substitute_id,
        backref="analog_of"
    )

class Batch(Base):
    __tablename__ = "batches"
    id = Column(Integer, primary_key=True, index=True)
    component_id = Column(Integer, ForeignKey("components.id"))
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    quantity = Column(Integer, default=0) # current quantity in this batch
    supplier = Column(String, nullable=True)
    date_code = Column(String, nullable=True)
    lot_code = Column(String, nullable=True)
    packaging_type = Column(String) # Reel, Tube, Tray, Loose
    barcode = Column(String, unique=True, index=True, nullable=True)
    rfid_tag = Column(String, unique=True, index=True, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    component = relationship("Component", back_populates="batches")
    location = relationship("Location", back_populates="batches")
    transactions = relationship("Transaction", back_populates="batch")

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    
    boms = relationship("BOM", back_populates="project")

class BOM(Base):
    __tablename__ = "boms"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    name = Column(String)
    
    project = relationship("Project", back_populates="boms")
    items = relationship("BOMItem", back_populates="bom")

class BOMItem(Base):
    __tablename__ = "bom_items"
    id = Column(Integer, primary_key=True, index=True)
    bom_id = Column(Integer, ForeignKey("boms.id"))
    component_id = Column(Integer, ForeignKey("components.id"))
    required_quantity = Column(Integer)
    
    bom = relationship("BOM", back_populates="items")
    component = relationship("Component")

class Request(Base):
    __tablename__ = "requests"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    bom_id = Column(Integer, ForeignKey("boms.id"), nullable=True)
    status = Column(String, default="Pending") # Pending, Approved, Issued, Returned
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="requests")
    bom = relationship("BOM")
    items = relationship("RequestItem", back_populates="request")
    transactions = relationship("Transaction", back_populates="request")

class RequestItem(Base):
    __tablename__ = "request_items"
    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("requests.id"))
    component_id = Column(Integer, ForeignKey("components.id"))
    requested_quantity = Column(Integer)
    issued_quantity = Column(Integer, default=0)
    
    request = relationship("Request", back_populates="items")
    component = relationship("Component")

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("batches.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    request_id = Column(Integer, ForeignKey("requests.id"), nullable=True)
    transaction_type = Column(String) # IN, OUT, RETURN, AUDIT_ADJUSTMENT
    quantity = Column(Integer)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    notes = Column(String, nullable=True)

    batch = relationship("Batch", back_populates="transactions")
    user = relationship("User")
    request = relationship("Request", back_populates="transactions")

class AuditCycle(Base):
    __tablename__ = "audit_cycles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    status = Column(String, default="In Progress") # In Progress, Completed
    auditor_id = Column(Integer, ForeignKey("users.id"))
    date_started = Column(DateTime, default=datetime.datetime.utcnow)
    date_ended = Column(DateTime, nullable=True)
    
    auditor = relationship("User", back_populates="audits")
    results = relationship("AuditResult", back_populates="audit")

class AuditResult(Base):
    __tablename__ = "audit_results"
    id = Column(Integer, primary_key=True, index=True)
    audit_id = Column(Integer, ForeignKey("audit_cycles.id"))
    location_id = Column(Integer, ForeignKey("locations.id"))
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=True)
    expected_quantity = Column(Integer)
    actual_quantity = Column(Integer)
    status = Column(String) # Match, Missing, Extra, Adjusted

    audit = relationship("AuditCycle", back_populates="results")
    location = relationship("Location")
    batch = relationship("Batch")

class StockReceipt(Base):
    __tablename__ = "stock_receipts"
    id = Column(Integer, primary_key=True, index=True)
    number = Column(String, index=True, unique=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String, default="Draft") # Draft, Posted
    warehouse_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    organization = Column(String, nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    comment = Column(String, nullable=True)
    total_amount = Column(Float, default=0.0) 
    user_id = Column(Integer, ForeignKey("users.id")) # Author

    items = relationship("StockReceiptItem", back_populates="receipt", cascade="all, delete-orphan")
    warehouse = relationship("Location")
    project = relationship("Project")
    creator = relationship("User")

class StockReceiptItem(Base):
    __tablename__ = "stock_receipt_items"
    id = Column(Integer, primary_key=True, index=True)
    receipt_id = Column(Integer, ForeignKey("stock_receipts.id"))
    component_id = Column(Integer, ForeignKey("components.id"))
    quantity = Column(Integer, default=0)
    price = Column(Float, default=0.0)
    reason = Column(String, nullable=True)

    receipt = relationship("StockReceipt", back_populates="items")
    component = relationship("Component")

class StockWriteOff(Base):
    __tablename__ = "stock_write_offs"
    id = Column(Integer, primary_key=True, index=True)
    number = Column(String, index=True, unique=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String, default="Draft") # Draft, Posted
    warehouse_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    organization = Column(String, nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    expense_item = Column(String, default="Списания", nullable=True)
    comment = Column(String, nullable=True)
    total_amount = Column(Float, default=0.0) 
    user_id = Column(Integer, ForeignKey("users.id")) # Author

    items = relationship("StockWriteOffItem", back_populates="write_off", cascade="all, delete-orphan")
    warehouse = relationship("Location")
    project = relationship("Project")
    creator = relationship("User")

class StockWriteOffItem(Base):
    __tablename__ = "stock_write_off_items"
    id = Column(Integer, primary_key=True, index=True)
    write_off_id = Column(Integer, ForeignKey("stock_write_offs.id"))
    component_id = Column(Integer, ForeignKey("components.id"))
    quantity = Column(Integer, default=0)
    price = Column(Float, default=0.0)
    reason = Column(String, nullable=True)

    write_off = relationship("StockWriteOff", back_populates="items")
    component = relationship("Component")

class StockTransfer(Base):
    __tablename__ = "stock_transfers"
    id = Column(Integer, primary_key=True, index=True)
    number = Column(String, index=True, unique=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String, default="Draft") # Draft, Posted
    from_warehouse_id = Column(Integer, ForeignKey("locations.id"))
    to_warehouse_id = Column(Integer, ForeignKey("locations.id"))
    organization = Column(String, nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    comment = Column(String, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id")) # Author
    total_amount = Column(Float, default=0.0)

    items = relationship("StockTransferItem", back_populates="transfer", cascade="all, delete-orphan")
    from_warehouse = relationship("Location", foreign_keys=[from_warehouse_id])
    to_warehouse = relationship("Location", foreign_keys=[to_warehouse_id])
    project = relationship("Project")
    creator = relationship("User")

class StockTransferItem(Base):
    __tablename__ = "stock_transfer_items"
    id = Column(Integer, primary_key=True, index=True)
    transfer_id = Column(Integer, ForeignKey("stock_transfers.id"))
    component_id = Column(Integer, ForeignKey("components.id"))
    quantity = Column(Integer, default=0)
    price = Column(Float, default=0.0)

    transfer = relationship("StockTransfer", back_populates="items")
    component = relationship("Component")

