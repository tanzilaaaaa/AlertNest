# AlertNest 🚨

A real-time disaster alert and emergency notification system designed to provide timely warnings and safety information during natural disasters and emergencies.

## 📋 Project Overview

AlertNest is a comprehensive disaster management platform that delivers:
- Real-time disaster alerts and notifications
- Location-based emergency information
- Multi-channel communication (SMS, email, push notifications)
- Emergency resource mapping
- Community safety updates

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
- [ ] Basic component structure (in progress)

## 🛠️ Tech Stack

### Backend
- **Framework**: Flask (Python)
- **Database**: PostgreSQL
- **ORM**: SQLAlchemy
- **API**: RESTful

### Frontend
- **Framework**: React
- **State Management**: Context API / Redux (TBD)
- **Styling**: CSS / Tailwind CSS (TBD)
- **HTTP Client**: Axios

## 📁 Project Structure

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

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Node.js 16+
- PostgreSQL 12+

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create `.env` file:
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. Run the application:
```bash
python run.py
```

Backend will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm start
```

Frontend will be available at `http://localhost:3000`

## 🔍 API Endpoints

### Health Check
- `GET /health` - Check if backend is running
- `GET /api/ping` - Ping endpoint for connectivity test

## 📅 Development Timeline

- **Week 1-2**: Planning and PRD finalization
- **Week 3**: Repository setup and basic scaffolding ✅
- **Week 4-6**: Core feature development
- **Week 7-9**: Integration and testing
- **Week 10-11**: Refinement and optimization
- **Week 12**: Final testing and deployment

## 👥 Team

- **Developer**: Tanzila Tahreem
- **Mentor**: [Mentor Name]

## 📝 License

This project is part of an academic/training program.

## 🤝 Contributing

This is a learning project. Contributions and suggestions are welcome!

---

**Status**: Week-3 Setup Complete ✅
