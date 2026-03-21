# Week 4 Progress Update

## Deliverables Status

| Deliverable | Status |
|---|---|
| GitHub repository organized | ✅ Done |
| FastAPI backend running | ✅ Done |
| React frontend initialized | ✅ Done |
| MongoDB connected | ✅ Done |
| Register API working | ✅ Done |
| Login API returning JWT | ✅ Done |
| React login page integrated with backend | ✅ Done |

---

## What Was Done

### 1. Migrated Backend from Flask to FastAPI + MongoDB

The original Flask + SQLAlchemy + SQLite backend was fully removed and rebuilt from scratch using FastAPI and MongoDB (Motor async driver), as required by the PRD.

Files created:
- `backend/main.py` — FastAPI app entry point with CORS, startup/shutdown MongoDB lifecycle
- `backend/app/config.py` — env-based config (MongoDB URL, JWT secret, algorithm, expiry)
- `backend/app/database.py` — Motor async MongoDB client with connect/close/get_db
- `backend/app/models/user.py` — Pydantic v2 models: `UserRegister`, `UserLogin`, `UserOut`, `Role` enum
- `backend/app/utils/auth.py` — bcrypt password hashing, JWT create/decode, `get_current_user` dependency
- `backend/app/routes/auth.py` — Register and Login endpoints

Files removed (Flask era):
- `backend/app/__init__.py`
- `backend/app/models/incident.py`
- `backend/app/routes/__init__.py`, `dashboard.py`, `incidents.py`
- `backend/migrations/` (all Alembic migration files)
- `backend/run.py`

### 2. Authentication API

**Register** — `POST /api/auth/register`
- Accepts: `name`, `email`, `password`, `role`
- Checks for duplicate email
- Hashes password with bcrypt
- Stores user in MongoDB `users` collection
- Returns user object

**Login** — `POST /api/auth/login`
- Accepts: `email`, `password`
- Verifies password against bcrypt hash
- Returns JWT token + user object

**Ping** — `GET /api/ping`
- Returns `{ "message": "pong" }` for health checks

### 3. Dependencies

Updated `backend/requirements.txt` to match actually installed versions (Python 3.14 on Apple Silicon required latest unpinned versions):

```
fastapi==0.135.1
uvicorn==0.42.0
motor==3.7.1
pymongo==4.16.0
python-dotenv==1.0.0
passlib[bcrypt]==1.7.4
python-jose[cryptography]==3.5.0
pydantic[email]==2.12.5
```

### 4. React Frontend

- `frontend/src/services/api.js` — axios instance pointing to `http://localhost:8000`, JWT interceptor, auth + incident + dashboard service calls
- `frontend/src/context/AuthContext.js` — login/logout state, token stored in localStorage, auto-restores session on reload
- `frontend/src/pages/Login.js` — login form wired to AuthContext
- `frontend/src/App.js` — landing page with project name, subtitle, and live backend status indicator (green = healthy, red = unreachable)
- `frontend/src/App.css` — clean minimal styling for landing page

### 5. GitHub

- All changes committed and pushed to `https://github.com/tanzilaaaaa/AlertNest` on `main`
- `.gitignore` covers: `venv/`, `__pycache__/`, `.env`, `*.db`, `node_modules/`, `dist/`, `.DS_Store`
- No sensitive or generated files in the repo

---

## How to Run

**Backend**
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

**Frontend**
```bash
cd frontend
npm install   # first time only
npm start
```

Open `http://localhost:3000` in the browser. Backend runs on `http://localhost:8000`.

> Make sure `backend/.env` exists with a valid `MONGODB_URL` before starting the backend. Copy from `backend/.env.example`.
