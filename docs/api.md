# AI Invoice Analyzer — REST API Specification

Base URL: `/api`

All protected endpoints require the following header:
```http
Authorization: Bearer <access_token>
```

---

## 1. Authentication Endpoints

### `POST /api/auth/register`
Creates a new user account.

**Request Body:**
```json
{
  "email": "analyst@company.ma",
  "password": "Password123!",
  "full_name": "Yassine El Amrani"
}
```

**Response (201 Created):**
```json
{
  "access_token": "eyJhbGciOi...",
  "token_type": "bearer",
  "user": {
    "id": "c7a8...",
    "email": "analyst@company.ma",
    "full_name": "Yassine El Amrani",
    "created_at": "2026-09-21T04:45:00Z"
  }
}
```

### `POST /api/auth/login`
Authenticates credentials and returns a JWT bearer token.

**Request Body:**
```json
{
  "email": "analyst@company.ma",
  "password": "Password123!"
}
```

---

## 2. Invoice Endpoints

### `POST /api/invoices/upload`
Uploads and executes the OCR + AI extraction pipeline.

- **Content-Type:** `multipart/form-data`
- **Body:** `file`: binary (`.pdf`, `.png`, `.jpg`, `.jpeg` max 10MB)

**Response (201 Created):**
```json
{
  "id": "inv_88291a...",
  "status": "PROCESSED",
  "invoice_number": "FAC-2026-00125",
  "invoice_date": "2026-09-18",
  "due_date": "2026-10-18",
  "supplier_name": "ABC TECHNOLOGIES SARL",
  "supplier_tax_id": "001234567890012",
  "supplier_address": "142 Boulevard d'Anfa, Casablanca, Maroc",
  "customer_name": "XYZ SOLUTIONS SARL",
  "customer_tax_id": "009876543210098",
  "currency": "MAD",
  "subtotal": 10000.0,
  "tax_amount": 2000.0,
  "total_amount": 12000.0,
  "payment_status": "UNPAID",
  "confidence_score": 95.0,
  "processing_time_ms": 1420,
  "provider_used": "llm",
  "items": [
    {
      "id": "item_1",
      "description": "Prestation développement logiciel cloud ERP",
      "quantity": 1.0,
      "unit_price": 10000.0,
      "tax_rate": 20.0,
      "total": 12000.0
    }
  ]
}
```

### `GET /api/invoices`
Paginated search and filter endpoint.

**Query Parameters:**
- `search` (string, optional): Search term for invoice #, supplier, customer.
- `status` (string, optional): `ALL`, `PROCESSED`, `PROCESSING`, `FAILED`.
- `payment_status` (string, optional): `ALL`, `PAID`, `UNPAID`, `OVERDUE`.
- `sort_by` (string, optional, default: `created_at`): `created_at`, `total_amount`, `invoice_date`.
- `sort_order` (string, optional, default: `desc`): `asc`, `desc`.
- `page` (int, default: 1)
- `limit` (int, default: 20)

### `GET /api/invoices/{id}`
Retrieves single invoice with line items, document path, confidence breakdown, and raw text.

### `PUT /api/invoices/{id}`
Human-in-the-loop manual field and line item editing.

### `DELETE /api/invoices/{id}`
Removes an invoice and its associated file (204 No Content).

### `POST /api/invoices/{id}/reprocess`
Re-runs OCR and AI extraction pipeline on original document.

### `GET /api/invoices/{id}/export?format=csv|json`
Exports formatted CSV or JSON file attachment.

---

## 3. Dashboard Endpoints

### `GET /api/dashboard/stats`
Returns aggregated analytics:
- `total_invoices`, `processed_invoices`, `pending_invoices`, `failed_invoices`
- `total_amount`, `unpaid_amount`, `overdue_amount`
- `monthly_volume`: `[{ "month": "Sep 2026", "count": 12 }]`
- `monthly_amount`: `[{ "month": "Sep 2026", "amount": 144000.0 }]`
- `payment_distribution`: `[{ "status": "PAID", "count": 8 }, { "status": "UNPAID", "count": 4 }]`

---

## 4. Health Check

### `GET /api/health`
Returns 200 OK with active provider configurations.
