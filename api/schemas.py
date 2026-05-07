from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime

# USER
class UserBase(BaseModel):
    username: str
    role: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class UserUpdateRole(BaseModel):
    role: str

# LOCATION
class LocationBase(BaseModel):
    zone: str
    row: Optional[str] = None
    rack: Optional[str] = None
    shelf: Optional[str] = None
    cell: Optional[str] = None
    barcode: Optional[str] = None

class LocationCreate(LocationBase):
    pass

class Location(LocationBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# CATEGORY
class CategoryBase(BaseModel):
    name: str

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# COMPONENT
class ComponentBase(BaseModel):
    name: str
    part_number: Optional[str] = None
    description: Optional[str] = None
    category_id: int
    manufacturer: Optional[str] = None

class ComponentCreate(ComponentBase):
    pass

class Component(ComponentBase):
    id: int
    category: Optional[Category] = None
    model_config = ConfigDict(from_attributes=True)

class ComponentWithStock(BaseModel):
    component: Component
    total_quantity: int

# BATCH
class BatchBase(BaseModel):
    component_id: int
    location_id: Optional[int] = None
    quantity: int = 0
    supplier: Optional[str] = None
    date_code: Optional[str] = None
    lot_code: Optional[str] = None
    packaging_type: str
    barcode: Optional[str] = None
    rfid_tag: Optional[str] = None

class BatchCreate(BatchBase):
    pass

class Batch(BatchBase):
    id: int
    created_at: datetime
    component: Optional[Component] = None
    location: Optional[Location] = None
    model_config = ConfigDict(from_attributes=True)

# TRANSACTIONS
class TransactionBase(BaseModel):
    batch_id: int
    user_id: int
    request_id: Optional[int] = None
    transaction_type: str
    quantity: int
    notes: Optional[str] = None

class TransactionCreate(TransactionBase):
    pass

class Transaction(TransactionBase):
    id: int
    timestamp: datetime
    model_config = ConfigDict(from_attributes=True)

# REQUESTS (Internal Orders)
class RequestItemBase(BaseModel):
    component_id: int
    requested_quantity: int

class RequestItemCreate(RequestItemBase):
    pass

class RequestItem(RequestItemBase):
    id: int
    issued_quantity: int
    component: Optional[Component] = None
    model_config = ConfigDict(from_attributes=True)

class RequestBase(BaseModel):
    user_id: int
    bom_id: Optional[int] = None
    status: str = "Pending"

class RequestCreate(RequestBase):
    items: List[RequestItemCreate]

class RequestSchema(RequestBase):
    id: int
    created_at: datetime
    items: List[RequestItem] = []
    transactions: List[Transaction] = []
    model_config = ConfigDict(from_attributes=True)

# PROJECTS
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class Project(ProjectBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# BOMS
class BOMBase(BaseModel):
    project_id: int
    name: str

class BOMCreate(BOMBase):
    pass

class BOM(BOMBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# AUDITS
class AuditCycleBase(BaseModel):
    name: str
    status: str = "In Progress"
    auditor_id: int
    date_ended: Optional[datetime] = None

class AuditCycleCreate(AuditCycleBase):
    pass

class AuditResultBase(BaseModel):
    expected_quantity: int
    actual_quantity: int
    status: str
    location_id: Optional[int] = None
    batch_id: Optional[int] = None

class AuditResultCreate(AuditResultBase):
    pass

class AuditResult(AuditResultBase):
    id: int
    batch: Optional[Batch] = None
    location: Optional[Location] = None
    model_config = ConfigDict(from_attributes=True)

class AuditScanRequest(BaseModel):
    batch_barcode: str
    actual_quantity: int
    user_id: int

class AuditCycle(AuditCycleBase):
    id: int
    date_started: datetime
    model_config = ConfigDict(from_attributes=True)

# STOCK RECEIPTS
class StockReceiptItemBase(BaseModel):
    component_id: int
    quantity: int
    price: float = 0.0
    reason: Optional[str] = None

class StockReceiptItemCreate(StockReceiptItemBase):
    pass

class StockReceiptItem(StockReceiptItemBase):
    id: int
    component: Optional[Component] = None
    model_config = ConfigDict(from_attributes=True)

class StockReceiptBase(BaseModel):
    number: str
    status: str = "Draft"
    warehouse_id: Optional[int] = None
    organization: Optional[str] = None
    project_id: Optional[int] = None
    comment: Optional[str] = None
    total_amount: float = 0.0
    user_id: int

class StockReceiptCreate(StockReceiptBase):
    items: List[StockReceiptItemCreate]

class StockReceiptSchema(StockReceiptBase):
    id: int
    created_at: datetime
    items: List[StockReceiptItem] = []
    model_config = ConfigDict(from_attributes=True)

# STOCK WRITE-OFFS
class StockWriteOffItemBase(BaseModel):
    component_id: int
    quantity: int
    price: float = 0.0
    reason: Optional[str] = None

class StockWriteOffItemCreate(StockWriteOffItemBase):
    pass

class StockWriteOffItem(StockWriteOffItemBase):
    id: int
    component: Optional[Component] = None
    model_config = ConfigDict(from_attributes=True)

class StockWriteOffBase(BaseModel):
    number: str
    status: str = "Draft"
    warehouse_id: Optional[int] = None
    organization: Optional[str] = None
    project_id: Optional[int] = None
    expense_item: Optional[str] = "Списания"
    comment: Optional[str] = None
    total_amount: float = 0.0
    user_id: int

class StockWriteOffCreate(StockWriteOffBase):
    items: List[StockWriteOffItemCreate]

class StockWriteOffSchema(StockWriteOffBase):
    id: int
    created_at: datetime
    items: List[StockWriteOffItem] = []
    model_config = ConfigDict(from_attributes=True)

# STOCK TRANSFERS
class StockTransferItemBase(BaseModel):
    component_id: int
    quantity: int
    price: float = 0.0

class StockTransferItemCreate(StockTransferItemBase):
    pass

class StockTransferItem(StockTransferItemBase):
    id: int
    component: Optional[Component] = None
    model_config = ConfigDict(from_attributes=True)

class StockTransferBase(BaseModel):
    number: str
    status: str = "Draft"
    from_warehouse_id: int
    to_warehouse_id: int
    organization: Optional[str] = None
    project_id: Optional[int] = None
    comment: Optional[str] = None
    user_id: int
    total_amount: float = 0.0

class StockTransferCreate(StockTransferBase):
    items: List[StockTransferItemCreate]

class StockTransferSchema(StockTransferBase):
    id: int
    created_at: datetime
    items: List[StockTransferItem] = []
    model_config = ConfigDict(from_attributes=True)

