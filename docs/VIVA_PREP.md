# AlertNest — Viva Preparation Guide

---

## Project Overview

AlertNest is a centralized, AI-powered incident reporting and management system for university campuses. It allows students and staff to report incidents, and admins to track and resolve them.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js + Tailwind CSS |
| Backend | Python + FastAPI |
| Database | Firebase Firestore |
| Authentication | Firebase Authentication |
| Hosting (local) | Uvicorn (backend), React Dev Server (frontend) |

---

## Backend Setup — How It's Done

### Folder Structure
```
backend/
├── main.py                  # FastAPI app entry point
├── firebase-service-account.json  # Firebase credentials (not in GitHub)
├── requirements.txt         # Python dependencies
├── .env.example             # Environment variable template
└── app/
    ├── config.py            # Loads environment variables
    ├── database.py          # Connects to Firestore using firebase-admin
    ├── models/
    │   └── user.py          # Pydantic models (UserRegister, UserLogin, etc.)
    ├── utils/
    │   └── auth.py          # Password hashing, Firebase token verification
    └── routes/
        ├── auth.py          # /api/auth/sync, /api/auth/me
        ├── incidents.py     # CRUD for incidents
        └── dashboard.py     # Summary stats and recent incidents
```

### How the Backend Starts
1. `uvicorn main:app --reload --port 8000` starts the server
2. On startup, `connect_db()` initializes Firebase Admin SDK using the service account JSON
3. Firestore client is stored globally and accessed via `get_db()`
4. All routes are registered in `main.py` using `app.include_router()`

### CORS
CORS middleware is configured to allow requests from `http://localhost:3000` (the React frontend).

---

## Authentication — How It's Set Up

### Firebase Authentication (Frontend)
- Firebase Auth SDK is initialized in `frontend/src/firebase.js`
- Supports Email/Password and Google Sign-In
- `onAuthStateChanged` listener in `AuthContext.js` detects login/logout automatically
- Session persists until the user manually logs out — no token expiry

### Firebase Token Verification (Backend)
- Every API request from the frontend includes a Firebase ID token in the `Authorization: Bearer <token>` header
- The backend calls `firebase_auth.verify_id_token(token)` to verify it
- This is done in `backend/app/utils/auth.py` via the `get_current_user` dependency
- If the token is invalid or missing, the API returns 401 Unauthorized

### User Sync
- When a user logs in (email or Google), the frontend calls `POST /api/auth/sync`
- The backend checks if the user exists in Firestore `users` collection
- If not, it creates a new document with name, email, role (default: student)
- This ensures every Firebase Auth user has a corresponding Firestore profile

### Forgot Password
- Uses Firebase's built-in `sendPasswordResetEmail()` — sends a real reset email automatically
- No custom backend logic needed for this

---

## Database — Firestore

- Cloud NoSQL database by Google Firebase
- Data is stored in collections (like tables) and documents (like rows)
- Collections used:
  - `users` — stores user profiles (name, email, role, provider)
  - `incidents` — stores incident reports

### Why Firestore over MongoDB?
- Teacher requirement
- Integrates natively with Firebase Auth
- No separate database server needed — fully managed by Google

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/sync | Create/fetch user profile in Firestore |
| GET | /api/auth/me | Get current user info |

### Incidents
| Method | Endpoint | Description |
|---|---|---|
| POST | /api/incidents | Report a new incident |
| GET | /api/incidents | Get all incidents (admin) or own (student) |
| GET | /api/incidents/{id} | Get single incident |
| PUT | /api/incidents/{id}/assign | Assign incident (admin only) |
| PUT | /api/incidents/{id}/status | Update status (admin only) |

### Dashboard
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/dashboard/summary | Total, resolved, in-progress counts + severity breakdown |
| GET | /api/dashboard/recent | Last 5 incidents |

---

## AI Severity Classification

- Built into the backend in `incidents.py`
- Uses keyword matching on the incident description
- High: fire, flood, emergency, critical, danger, urgent, injury, attack
- Medium: broken, damaged, leak, fault, issue, problem, failure
- Low: everything else
- No external AI service needed for now — pure Python logic

---

## Frontend Setup

- React app created with Create React App
- Tailwind CSS for styling
- Key files:
  - `src/firebase.js` — Firebase config and initialization
  - `src/context/AuthContext.js` — Global auth state, login/logout/register functions
  - `src/services/api.js` — Axios instance, auto-attaches Firebase token to every request
  - `src/pages/Login.js` — Login form
  - `src/pages/Signup.js` — Registration form
  - `src/pages/Dashboard.js` — Main dashboard with sidebar, stats, incidents list
  - `src/components/SocialButtons.js` — Google sign-in button
  - `src/components/ForgotPassword.js` — Password reset modal

---

## Viva Q&A

**Q: What is FastAPI?**
A: FastAPI is a modern Python web framework for building APIs. It's fast, supports async, and auto-generates API documentation at /docs.

**Q: Why did you use FastAPI instead of Flask?**
A: FastAPI is faster, supports async operations natively, has built-in data validation using Pydantic, and auto-generates Swagger docs. It's better suited for production APIs.

**Q: What is Pydantic?**
A: Pydantic is a Python library for data validation. We use it to define request body models like `IncidentCreate` — FastAPI automatically validates incoming data against these models.

**Q: What is Firestore?**
A: Firestore is a cloud-hosted NoSQL database by Google Firebase. Data is stored as documents inside collections. It's real-time, scalable, and integrates natively with Firebase Auth.

**Q: How does authentication work in your project?**
A: We use Firebase Authentication. The user logs in on the frontend using email/password or Google. Firebase issues an ID token. Every API request sends this token in the Authorization header. The backend verifies it using the Firebase Admin SDK's `verify_id_token()` function.

**Q: What is JWT and did you use it?**
A: JWT (JSON Web Token) is a token format for authentication. We initially used it but replaced it with Firebase Auth tokens because Firebase handles session management natively and tokens don't expire until the user logs out.

**Q: How does role-based access work?**
A: Each user has a role (student, staff, admin) stored in Firestore. The backend checks `current_user["role"]` on protected routes. For example, only admins can assign incidents or update status.

**Q: What is CORS and why did you configure it?**
A: CORS (Cross-Origin Resource Sharing) is a browser security policy that blocks requests from different origins. Since our frontend runs on port 3000 and backend on port 8000, we configured CORS middleware in FastAPI to allow requests from localhost:3000.

**Q: How does the severity classification work?**
A: It's a Python function in `incidents.py` that checks the incident description for keywords. Words like "fire" or "emergency" → high severity. Words like "leak" or "broken" → medium. Everything else → low.

**Q: What is the difference between Firestore and MongoDB?**
A: Both are NoSQL databases. MongoDB stores data in BSON format and requires a separate server or Atlas cloud. Firestore is fully managed by Google, integrates with Firebase Auth, and has real-time sync capabilities.

**Q: How does the forgot password feature work?**
A: We use Firebase's built-in `sendPasswordResetEmail()` function. The user enters their email, Firebase sends a reset link directly to their inbox. No custom backend logic needed.

**Q: What is the firebase-service-account.json file?**
A: It's a private key file downloaded from Firebase console that allows the backend (Python) to authenticate with Firebase services like Firestore and verify user tokens. It's kept out of GitHub for security.

**Q: How do you protect API routes?**
A: Using FastAPI's dependency injection. Every protected route has `current_user: dict = Depends(get_current_user)`. The `get_current_user` function extracts and verifies the Firebase token from the request header.

**Q: What is uvicorn?**
A: Uvicorn is an ASGI server used to run FastAPI applications. We run it with `uvicorn main:app --reload --port 8000`.

**Q: What does the dashboard API return?**
A: The `/api/dashboard/summary` endpoint returns total incidents, counts by status (reported, in_progress, resolved), counts by severity (high, medium, low), and a resolution rate percentage.
