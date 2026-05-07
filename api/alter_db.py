import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "radio_inventory.db")
conn = sqlite3.connect(db_path)
cur = conn.cursor()

try:
    cur.execute("ALTER TABLE components ADD COLUMN description VARCHAR;")
    print("Added description to components")
except Exception as e:
    print("Error adding description:", e)

try:
    cur.execute("ALTER TABLE components ADD COLUMN manufacturer VARCHAR;")
    print("Added manufacturer to components")
except Exception as e:
    print("Error adding manufacturer:", e)
    
try:
    cur.execute("ALTER TABLE batches ADD COLUMN packaging_type VARCHAR;")
    print("Added packaging_type to batches")
except Exception as e:
    print("Error adding packaging_type:", e)

try:
    cur.execute("ALTER TABLE batches ADD COLUMN lot_code VARCHAR;")
    print("Added lot_code to batches")
except Exception as e:
    print("Error adding lot_code:", e)

conn.commit()
conn.close()
