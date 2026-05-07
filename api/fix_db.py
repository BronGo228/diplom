import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'radio_inventory.db')
conn = sqlite3.connect(db_path)
c = conn.cursor()

cols = [r[1] for r in c.execute("PRAGMA table_info(transactions)").fetchall()]
if 'batch_id' not in cols:
    c.execute('ALTER TABLE transactions ADD COLUMN batch_id INTEGER REFERENCES batches(id)')
    print("Added batch_id to transactions")
if 'request_id' not in cols:
    c.execute('ALTER TABLE transactions ADD COLUMN request_id INTEGER REFERENCES requests(id)')
    print("Added request_id to transactions")

conn.commit()
conn.close()
print("DB fix applied.")
