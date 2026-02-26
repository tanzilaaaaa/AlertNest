# AlertNest
Backend-Centric Incident Reporting Platform for Universities & Large Campuses

AlertNest is a centralized, AI-enabled incident management platform designed to improve safety, accountability, and operational efficiency within universities and large institutional campuses.

It enables structured incident reporting, intelligent prioritization, real-time tracking, and role-based dashboard management through a scalable backend architecture.

Universities and large campuses handle daily incidents such as safety concerns, infrastructure faults, equipment failures, sanitation issues, and emergency situations. These issues are often reported through fragmented channels like phone calls, emails, or messaging groups, leading to delayed responses, lack of accountability, and poor coordination across departments.

AlertNest addresses this challenge by providing a centralized, backend-driven incident reporting system with AI-based severity classification and structured lifecycle management.



Key Features

	•	Structured Incident Reporting
	•	JWT-Based Authentication with Role-Based Access Control
	•	AI-Based Severity Classification (Low / Medium / High)
	•	Admin and Department Dashboards
	•	Incident Lifecycle Management (Reported → In Progress → Resolved)
	•	Audit Trail and Status Logs
	•	Analytics and Incident Insights
	•	Cloud Deployment Ready Architecture
	

System Architecture

```
React Frontend
      ↓
FastAPI Backend
      ↓
AI Severity Classification Module
      ↓
MongoDB Atlas
```

AlertNest follows a backend-centric REST architecture where validation, classification, lifecycle logic, and data management are handled in the backend layer.


Tech Stack

Frontend

	•	React.js
	•	Tailwind CSS

Backend

	•	Python
	•	FastAPI
	•	Uvicorn

Database

	•	MongoDB Atlas

Authentication

	•	JWT (JSON Web Tokens)
	•	python-jose
	•	passlib

Deployment

	•	Backend hosted on Render
	•	Frontend hosted on Vercel



How It Works

	1.	User logs in as Student, Staff, or Admin.
	2.	User submits an incident with category, description, and location.
	3.	Backend validates request and authenticates the user.
	4.	AI module classifies severity level.
	5.	Incident is stored in MongoDB.
	6.	Admin dashboard updates with the new incident.
	7.	Admin assigns the incident to the relevant department.
	8.	Department updates status until resolution.
	9.	Full audit trail is maintained throughout the lifecycle.



User Roles

Student / Staff

	•	Submit incidents
	•	View and track submitted incidents

Admin

	•	View all incidents
	•	Assign departments
	•	Update status
	•	Access analytics dashboard



API Overview

Authentication

	•	POST /api/register
	•	POST /api/login

Incident Management

	•	POST /api/incidents
	•	GET /api/incidents
	•	GET /api/incidents/{id}
	•	PUT /api/incidents/{id}/assign
	•	PUT /api/incidents/{id}/status

Dashboard

	•	GET /api/dashboard/summary
	•	GET /api/dashboard/analytics



Testing Strategy

	•	Manual functional testing of APIs
	•	Role-based access validation
	•	Incident lifecycle validation
	•	Concurrent API request handling tests
	•	Performance monitoring of dashboard endpoints



Target Market

AlertNest is designed for:

	•	Public and Private Universities
	•	Engineering and Medical Colleges
	•	Residential Campuses with Hostels
	•	Research Institutions
	•	Large Academic Campuses

---

## 🎯 Week-3 Setup Status

### Repository & CI
- [x] Git repository initialized
- [x] CI ignore configured (.gitignore)
- [x] Basic README added

### Backend Setup
- [x] Backend application initialized (Flask framework)
- [x] Environment and configuration wiring completed
- [x] Database connection wiring completed
- [x] Health / ping endpoint implemented

### Frontend Setup
- [x] Frontend application initialized (React framework)
- [x] Basic component structure

## 📁 Current Project Structure

```
AlertNest/
├── backend/              # Flask backend application
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   └── routes/
│   ├── requirements.txt
│   └── run.py
├── frontend/             # React frontend application
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── README.md
└── README.md
```

## 🚀 Quick Start (Week-3 Setup)

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python run.py
```

Backend will be available at `http://localhost:5000`

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend will be available at `http://localhost:3000`

---

**Status**: Week-3 Setup Complete ✅
