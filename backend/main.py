from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import connect_db, close_db
from app.routes.auth import router as auth_router
from app.routes.incidents import router as incidents_router
from app.routes.dashboard import router as dashboard_router

app = FastAPI(title="AlertNest API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    connect_db()

@app.on_event("shutdown")
async def shutdown():
    close_db()

app.include_router(auth_router)
app.include_router(incidents_router)
app.include_router(dashboard_router)

@app.get("/api/ping")
async def ping():
    return {"message": "pong"}
