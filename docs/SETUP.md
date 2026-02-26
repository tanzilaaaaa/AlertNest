# AlertNest Setup Guide

## Prerequisites

- Python 3.9 or higher
- Node.js 16 or higher
- PostgreSQL 13 or higher
- Git

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/tanzilaaaaa/AlertNest.git
cd AlertNest
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Create database
createdb alertnest

# Run the application
python run.py
```

Backend will be available at: http://localhost:5000

Test the health endpoint: http://localhost:5000/health

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API URL

# Run the application
npm start
```

Frontend will be available at: http://localhost:3000

## Verification

### Backend Health Check

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "AlertNest API",
  "timestamp": "2024-01-01T00:00:00.000000",
  "version": "1.0.0"
}
```

### Frontend

Open http://localhost:3000 in your browser. You should see the AlertNest welcome page.

## Next Steps

- Configure database models
- Set up API keys for Twilio, SendGrid, and Firebase
- Implement authentication
- Build core features

## Troubleshooting

### Database Connection Issues

Make sure PostgreSQL is running:
```bash
# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql
```

### Port Already in Use

If port 5000 or 3000 is already in use, you can change it:

Backend: Edit `run.py` and change the port number
Frontend: Set `PORT=3001` in your `.env` file
