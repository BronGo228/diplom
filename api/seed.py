import sys
import os
import random

# Ensure we can import from the current directory
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
import models
import schemas
import crud

def seed():
    suffix = str(random.randint(1000, 9999))
    db = SessionLocal()
    
    # 1. Create a Category
    cat_schema = schemas.CategoryCreate(name=f"Resistors {suffix}")
    db_cat = crud.create_category(db, cat_schema)
    
    # 2. Create a Component
    comp_schema = schemas.ComponentCreate(
        name=f"Resistor 10k Ohm 1% {suffix}",
        part_number=f"RC0402FR-0710KL-{suffix}",
        description="SMD Resistor 0402",
        category_id=db_cat.id,
        manufacturer="Yageo"
    )
    db_comp = crud.create_component(db, comp_schema)
    

    # 3. Create Locations
    locs = [
        schemas.LocationCreate(zone="Зона А", row="Ряд 1", rack="Стеллаж 1", shelf="Полка 1", cell=f"Ячейка {suffix}_1", barcode=f"LOC-A1-1-{suffix}"),
        schemas.LocationCreate(zone="Зона А", row="Ряд 1", rack="Стеллаж 1", shelf="Полка 1", cell=f"Ячейка {suffix}_2", barcode=f"LOC-A1-2-{suffix}"),
        schemas.LocationCreate(zone="Зона Б", row="Ряд 2", rack="Стеллаж 5", shelf="Полка 3", cell=f"Ячейка {suffix}_15", barcode=f"LOC-B2-15-{suffix}")
    ]
    db_locs = []
    for loc in locs:
        db_locs.append(crud.create_location(db, loc))
        
    # 4. Create Batches in Locations
    batch1 = schemas.BatchCreate(
        component_id=db_comp.id,
        location_id=db_locs[0].id,
        quantity=5000,
        supplier="DigiKey",
        lot_code=f"LOT{suffix}A",
        packaging_type="Катушка (Reel)",
        barcode=f"BCH-1001-{suffix}"
    )
    crud.create_batch(db, batch1)
    
    batch2 = schemas.BatchCreate(
        component_id=db_comp.id,
        location_id=db_locs[1].id,
        quantity=1500,
        supplier="Mouser",
        lot_code=f"LOT{suffix}B",
        packaging_type="Лента (Cut Tape)",
        barcode=f"BCH-1002-{suffix}"
    )
    crud.create_batch(db, batch2)

    db.close()
    print("Seeding complete!")

if __name__ == "__main__":
    seed()
