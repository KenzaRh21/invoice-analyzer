import io

def test_invoice_upload_and_lifecycle(client, auth_headers):
    # 1. Upload mock invoice
    fake_pdf = io.BytesIO(b"%PDF-1.4 Mock invoice stream with FAC-2026-00125 and ABC TECHNOLOGIES total 12000 MAD")
    upload_res = client.post(
        "/api/invoices/upload",
        files={"file": ("invoice_standard.pdf", fake_pdf, "application/pdf")},
        headers=auth_headers
    )
    assert upload_res.status_code == 201
    inv = upload_res.json()
    inv_id = inv["id"]
    assert inv["status"] == "PROCESSED"
    assert inv["invoice_number"] is not None
    assert inv["total_amount"] > 0

    # 2. Get invoice details
    detail_res = client.get(f"/api/invoices/{inv_id}", headers=auth_headers)
    assert detail_res.status_code == 200
    assert detail_res.json()["id"] == inv_id

    # 3. Manual Correction (Human in the loop)
    update_res = client.put(
        f"/api/invoices/{inv_id}",
        json={
            "invoice_number": "FAC-CORRECTED-999",
            "total_amount": 13500.0,
            "payment_status": "PAID"
        },
        headers=auth_headers
    )
    assert update_res.status_code == 200
    assert update_res.json()["invoice_number"] == "FAC-CORRECTED-999"
    assert update_res.json()["payment_status"] == "PAID"

    # 4. Search and List
    list_res = client.get("/api/invoices?search=CORRECTED", headers=auth_headers)
    assert list_res.status_code == 200
    assert list_res.json()["total"] >= 1

    # 5. Export JSON and CSV
    exp_json = client.get(f"/api/invoices/{inv_id}/export?format=json", headers=auth_headers)
    assert exp_json.status_code == 200
    assert "FAC-CORRECTED-999" in exp_json.text

    exp_csv = client.get(f"/api/invoices/{inv_id}/export?format=csv", headers=auth_headers)
    assert exp_csv.status_code == 200
    assert "invoice_number,supplier" in exp_csv.text

    # 6. Delete
    del_res = client.delete(f"/api/invoices/{inv_id}", headers=auth_headers)
    assert del_res.status_code == 204
