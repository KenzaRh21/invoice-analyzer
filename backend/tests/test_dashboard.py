import io

def test_dashboard_stats(client, auth_headers):
    # Upload an invoice to populate stats
    fake_pdf = io.BytesIO(b"%PDF-1.4 Atlas cloud sample INV-2026-0482 total 36000 MAD")
    client.post(
        "/api/invoices/upload",
        files={"file": ("invoice_multi.pdf", fake_pdf, "application/pdf")},
        headers=auth_headers
    )

    stats_res = client.get("/api/dashboard/stats", headers=auth_headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["total_invoices"] >= 1
    assert stats["processed_invoices"] >= 1
    assert stats["total_amount"] > 0
    assert len(stats["monthly_volume"]) >= 1
