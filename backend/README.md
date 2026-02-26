# AlertNest Backend

Flask-based backend API for the AlertNest disaster alert system.

## Setup

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run the application:
```bash
python run.py
```

## API Endpoints

- `GET /health` - Health check endpoint
- `GET /ping` - Simple ping endpoint

## Database Setup

Make sure PostgreSQL is installed and running, then create the database:
```bash
createdb alertnest
```
