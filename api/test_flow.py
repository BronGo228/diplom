import urllib.request
import json

BASE_URL = "http://localhost:8000"

def post(endpoint, data):
    req = urllib.request.Request(f"{BASE_URL}{endpoint}", method="POST", headers={"Content-Type": "application/json"})
    try:
        resp = urllib.request.urlopen(req, data=json.dumps(data).encode("utf-8"))
        return json.loads(resp.read().decode())
    except Exception as e:
        print(f"Error POST {endpoint}: {e.read().decode() if hasattr(e, 'read') else e}")
        return None

def get(endpoint):
    req = urllib.request.Request(f"{BASE_URL}{endpoint}", method="GET")
    try:
        resp = urllib.request.urlopen(req)
        return json.loads(resp.read().decode())
    except Exception as e:
        print(f"Error GET {endpoint}: {e.read().decode() if hasattr(e, 'read') else e}")
        return None

print("--- STARTING END-TO-END TEST ---")

# 1. Create Component
print("1. Creating Component...")
comp = post("/components/", {
    "name": "Integration Test Resistor",
    "part_number": "ITR-10K",
    "description": "Created by automated test",
    "category_id": 1,
    "manufacturer": "TestCorp"
})
assert comp and comp["id"], "Failed to create component"
print("   OK - Component ID:", comp["id"])

# 2. Create Location
print("2. Creating Location...")
loc = post("/locations/", {
    "zone": "Test Zone",
    "cell": "Test Cell",
    "barcode": "LOC-TEST-123"
})
# Might fail if LOC-TEST-123 exists, but since we recreate it, it's fine. If it fails, we fetch existing.
if not loc:
    locations = get("/locations/")
    loc = locations[-1]
print("   OK - Location ID:", loc["id"])

# 3. Create Batch (Inbound)
print("3. Creating Batch & Transaction (Inbound)...")
import time
barcode = f"BCH-TEST-{int(time.time())}"
batch = post("/batches/", {
    "component_id": comp["id"],
    "location_id": loc["id"],
    "quantity": 0,
    "packaging_type": "Reel",
    "barcode": barcode
})
assert batch and batch["id"], "Failed to create batch"
tx = post("/transactions/", {
    "batch_id": batch["id"],
    "user_id": 1,
    "transaction_type": "IN",
    "quantity": 500,
    "notes": "Test Inbound"
})
assert tx and tx["id"], "Failed to create transaction"
print("   OK - Batch ID:", batch["id"], "Qty:", tx["quantity"])

# 4. Create Request & Fulfill
print("4. Creating Request (BOM)...")
request = post("/requests/", {
    "user_id": 1,
    "status": "PENDING",
    "items": [
        {"component_id": comp["id"], "requested_quantity": 200}
    ]
})
assert request and request["id"], "Failed to create request"
print("   OK - Request ID:", request["id"])

print("5. Fulfilling Request...")
fulfilled = post(f"/requests/{request['id']}/fulfill", {})
assert fulfilled and fulfilled["status"] == "FULFILLED", "Failed to fulfill request"
print("   OK - Request Fulfilled")

# 6. Check Batch Quantity
batch_check = get(f"/batches/barcode/{barcode}")
assert batch_check["quantity"] == 300, f"Expected 300, got {batch_check['quantity']}"
print("   OK - Fast verification: Batch quantity deducted correctly (300)")

# 7. Audit
print("8. Creating Audit Cycle...")
audit = post("/audits/", {
    "name": "E2E Test Audit",
    "auditor_id": 1
})
assert audit and audit["id"], "Failed to create audit"

print("9. Scanning Audit Item (Actual=290, expected 300)...")
res = post(f"/audits/{audit['id']}/scan", {
    "batch_barcode": barcode,
    "actual_quantity": 290,
    "user_id": 1
})
assert res and res["status"] == "Missing" and res["expected_quantity"] == 300, "Audit scan failed"

batch_final = get(f"/batches/barcode/{barcode}")
assert batch_final["quantity"] == 290, "Audit did not adjust quantity!"
print("   OK - Audit adjusted quantity to 290")

print("--- ALL TESTS PASSED SUCCESSFULLY! ---")
