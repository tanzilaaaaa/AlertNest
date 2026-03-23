from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import connect_db, close_db
from app.routes.auth import router as auth_router
from app.routes.google_auth import router as google_auth_router

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
    await connect_db()

@app.on_event("shutdown")
async def shutdown():
    await close_db()

app.include_router(auth_router)
app.include_router(google_auth_router)

@app.get("/api/ping")
async def ping():
    return {"message": "pong"}
