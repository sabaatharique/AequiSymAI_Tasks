# Patient Management System

A full-stack healthcare web application for managing patients and clinical visits, built with **Django REST Framework**, **PostgreSQL**, and **React (Vite)**.

---

## 🚀 Quick Setup & Run (For Reviewers)

Follow these steps to get the backend, database import, and frontend running locally in minutes.

### 1. Prerequisites
- **Python**: 3.12+
- **PostgreSQL**: 14+ (running locally)
- **Node.js**: 20.19+ or 22+ (and npm)
- **Git**

---

### 2. Backend Setup

```bash
# 1. From repository root, create and activate a virtual environment
python -m venv venv
venv\Scripts\activate          # Windows (Command Prompt)
# or: venv\Scripts\Activate.ps1 # Windows (PowerShell)
# or: source venv/bin/activate  # macOS / Linux

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Create the PostgreSQL database (run in psql)
# CREATE DATABASE patient_db;
# CREATE USER patient_user WITH PASSWORD 'your_password';
# GRANT ALL PRIVILEGES ON DATABASE patient_db TO patient_user;
# \c patient_db
# GRANT ALL ON SCHEMA public TO patient_user;
# ALTER DATABASE patient_db OWNER TO patient_user;

# 4. Navigate into the backend directory
cd backend

# 5. Create .env from template
copy .env.example .env         # Windows
# or: cp .env.example .env     # macOS / Linux
```

Update `backend/.env` with your PostgreSQL database credentials and an import password:
```env
DB_NAME=patient_db
DB_USER=patient_user
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DEFAULT_PATIENT_PASSWORD=StrongPass!123
```

```bash
# 6. Apply database migrations
python manage.py migrate

# 7. Create a staff/superuser account (used to review the staff portal)
python manage.py createsuperuser
# Prompts: Mobile (11 digits, e.g. 01700000000), First name, Age, Gender (MALE/FEMALE), Blood group (e.g. A+), Password

# 8. Start the Django backend server
python manage.py runserver
```
Backend API will be running at **`http://127.0.0.1:8000/api/`**.

---

### 3. Import Sample Patients (Task 2)

In a terminal inside `backend/` with your virtual environment active, run the idempotent import command:
```bash
python manage.py import_patients data/DemoPatientList_csv.xlsx
```
*Creates 10 patients with phone numbers, demographics, and initial passwords. Re-running is completely safe and creates no duplicates.*

---

### 4. Frontend Setup (Task 3)

Open a second terminal window at the repository root:
```bash
# 1. Navigate to frontend folder
cd frontend

# 2. Install dependencies
npm install

# 3. Configure environment variable
copy .env.example .env         # Windows
# or: cp .env.example .env     # macOS / Linux

# 4. Start the Vite development server
npm run dev
```
Open your browser at **`http://localhost:5173`**.

---

## 🧑‍⚕️ Reviewer Testing Guide

| Account Type | Credentials | Portal Experience |
|---|---|---|
| **Staff / Admin** | Superuser mobile & password | Displays **Staff Portal** badge. Full table of all patients, pagination, **▼ Add New Patient** dropdown, update/delete actions, and visit logging for any patient. |
| **Patient** | Any imported patient mobile (e.g. `01677307926`) + `DEFAULT_PATIENT_PASSWORD` | Displays **Patient Portal** badge. Views only their own record, **Add New Patient** form is hidden, pagination is hidden, and can log clinical visits for themselves. |

### Key Interactive Features to Test:
1. **Dropdown / Collapsible Forms:** Click **▼ Add New Patient** or **▼ Log Patient Visit** in the toolbar to toggle forms smoothly without cluttering the page.
2. **Patient History on Row Click:** Click on any patient row in the table (indicated by a chevron `▶` / `▼`) to reveal their clinical visit history, medical notes, attending doctors, and timestamps.
3. **Log Patient Visit (`POST /api/visits/`):** Click **Log Visit** on any row or open the form. The visit date is validated to prevent future dates. Saving automatically increments `total_visits` and updates `last_visit_date`.
4. **Update Details:** Click **Update** on any row. The form expands pre-filled. `Last Name` can be left blank per specifications, and password can be left blank to preserve current credentials.

---

## 🏛️ Crucial Architecture & Design Decisions

### Backend & API
- **Custom User Model:** `Patient` extends `AbstractUser`, with `mobile` (11-digit validated number) as `USERNAME_FIELD` and a custom manager. Defined before the first migration as required by Django.
- **JWT Authentication:** Login uses mobile and password (`POST /api/token/`). Registration and login endpoints are open; all other endpoints require authentication (`IsAuthenticated` is the global default).
- **Per-User Access Control:** Staff members can see and manage all patients. Non-staff patients can only view, edit, or delete their own record, and can only add visits for themselves (`validate_patient`), preventing cross-patient data exposure.
- **Password Safety:** Passwords are write-only in the API (never serialized or returned), checked against Django's password validators, and hashed with `set_password`.
- **Atomic Visit Counters & Future Date Validation:** Creating a `PatientVisit` and updating `total_visits` and `last_visit_date` occur in a single database transaction (`@transaction.atomic`). Counter increments use an `F()` expression to avoid race conditions. `last_visit_date` uses `Greatest()`, ensuring backdated visits never regress the date. Both backend serializer and frontend inputs restrict visit dates from being set in the future.
- **Pagination:** DRF `CustomPagination` provides page-number pagination with stable `id` ordering and a configurable `page_size`.
- **Optional Last Name:** Following specifications, `last_name` is optional (`blank=True`), requiring no mandatory browser validation prompts.
- **Idempotent Data Import (Task 2):** Matches rows by mobile using `update_or_create`. Safe to re-run indefinitely without duplicating rows. Refreshes demographics while preserving existing visit counters and custom passwords. Restores lost Excel leading zeros on phone numbers, logs row warnings, and executes in a single transaction.
- **Default Import Password:** Configured via `DEFAULT_PATIENT_PASSWORD` in `.env`, validated against password policies, and applied exclusively to new imports (not existing users).

### Frontend (Task 3)
- **Lightweight & High-Performance:** Built with React 19 and Vite using vanilla CSS (no heavy third-party UI framework dependencies).
- **Centralized Axios & Token Refresh Interceptor:** Central Axios client in `src/api/client.js` automatically attaches Bearer tokens and silently refreshes expired access tokens via `/api/token/refresh/` using a single queued refresh promise.
- **Role Awareness:** Automatically adapts views, banners, pills, and permissions between Staff and Patient accounts.
- **Compact UX:** Collapsible dropdown form controls prevent long, overwhelming pages.
- **Interactive Medical History:** Clicking patient rows triggers accordion views of historical visits.

---

## 📡 API Endpoints Summary

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/token/` | No | Log in with mobile + password; returns JWT access, refresh & role |
| `POST` | `/api/token/refresh/` | No | Refresh expired access token |
| `GET` | `/api/patients/?page=1&page_size=10` | Yes | List patients (paginated, staff sees all, patient sees self) |
| `POST` | `/api/patients/` | No/Yes | Register / add a patient |
| `GET` | `/api/patients/<id>/` | Yes | Retrieve patient details and nested visit history |
| `PATCH`| `/api/patients/<id>/` | Yes | Partially update patient details |
| `DELETE`| `/api/patients/<id>/` | Yes | Delete patient record (staff only) |
| `GET` | `/api/visits/?patient=<id>` | Yes | Retrieve visit records |
| `POST` | `/api/visits/` | Yes | Log clinical visit; atomically updates patient counters |

---

## 🛠️ Troubleshooting

| Issue | Solution |
|---|---|
| **CORS error in browser console** | `CORS_ALLOWED_ORIGINS` in `tasks/settings.py` includes `http://localhost:5173` and `http://127.0.0.1:5173`. Make sure the frontend runs on port 5173. |
| **Cannot reach server** | Ensure Django backend is running at `http://127.0.0.1:8000`. |
| **PostgreSQL schema permission error** | Run `GRANT ALL ON SCHEMA public TO patient_user;` and `ALTER DATABASE patient_db OWNER TO patient_user;` in `psql`. |
| **Token expired** | The frontend refreshes access tokens silently. If the refresh token expires, the app gracefully returns to the login screen. |
| **Patient table shows only 1 row** | You are logged in with a patient account. Log in with a staff/superuser account to view all patients. |