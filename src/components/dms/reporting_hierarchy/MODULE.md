# Standard Reporting Hierarchy

**Menu:** DMS Menu → Reporting Hierarchy  
**Routes:** `/dms/reporting-hierarchy` (+ organogram / import / people / assign / edges)  
**API:** `/reporting-hierarchy/*`  
**Permission:** `admin.reporting_hierarchy.*`  
**Tabs:** People · Employee Organogram · Import · Edges

## Scope of this module

Full CRUD UI + Nest APIs for a **standalone** `reporting_edges` table.

**Does not** (by design, for now):

- Change `users.manager_id` / `user_managers`
- Change `DataScopeService` / TeamFilter / PermissionsGuard for other modules
- Drive Tasking or Reconciliation access

Existing ERP behaviour stays as-is. This module is the future source of truth being filled in parallel.

## Data model

`reporting_edges`: user_id → manager_id, relationship (`primary` | `secondary`), department, notes, is_active.

## Key APIs

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/reporting-hierarchy/organogram` | Full reporting forest (`?department=&mode=primary|all`) |
| GET | `/reporting-hierarchy/import/template` | Download Excel template for departments |
| GET | `/reporting-hierarchy/import/format` | JSON column/rules spec |
| POST | `/reporting-hierarchy/import?dry_run=` | Upload `.xlsx`/`.csv` (multipart `file`) |
| GET | `/reporting-hierarchy/people` | Users + primary/secondary summary |
| GET/PUT | `/reporting-hierarchy/people/:userId` | View / replace managers |
| GET/POST | `/reporting-hierarchy/edges` | List / create edge |
| PATCH/DELETE | `/reporting-hierarchy/edges/:id` | Update / archive |

## Department import format

Excel sheet **Hierarchy** (or CSV) with columns:

| Column | Required | Notes |
|--------|----------|--------|
| `employee_email` | Yes | Must match ERP user email |
| `manager_email` | Yes | Must match ERP user email |
| `relationship` | No | `primary` (default) \| `secondary` |
| `department` | No | e.g. `hr`, `it` |
| `notes` | No | Free text |
| `employee_name` | No | Label only |
| `manager_name` | No | Label only |

## Safety

- No self-reporting
- Cycle detection on assign
- One active primary per user (module-local)
