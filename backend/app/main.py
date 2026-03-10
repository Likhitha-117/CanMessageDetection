"""
FastAPI application entry point.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.database import connect_to_mongo, close_mongo_connection
from .ml import model_loader
from .services.prediction_service import detector

from .api.auth import router as auth_router
from .api.admin import router as admin_router
from .api.owner import router as owner_router
from .api.engineer import router as engineer_router
from .api.analysis import router as analysis_router
from .api.logs import router as logs_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ---------- Startup ----------
    await connect_to_mongo()
    # Load Real Model
    model_loader.load_all()
    yield
    # ---------- Shutdown ----------
    await close_mongo_connection()


app = FastAPI(
    title="CAN Intrusion Detection Platform",
    description="Sequence-Based Multi-Class CAN IDS using LSTM with RBAC",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(owner_router)
app.include_router(engineer_router)
app.include_router(analysis_router)
app.include_router(logs_router)


@app.get("/")
async def root():
    return {"message": "CAN IDS Platform API is running"}
