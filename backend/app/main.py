from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import habits, analytics
from app.core.config import settings

app = FastAPI(
    title="Modern Habit Tracker API",
    description="API for habit tracking with Excel integration",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(habits.router, prefix="/api/habits", tags=["habits"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])

@app.get("/")
def read_root():
    return {"message": "Modern Habit Tracker API", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}