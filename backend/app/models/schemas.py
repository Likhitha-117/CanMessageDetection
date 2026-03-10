"""
Pydantic schemas for Users, Vehicles, Logs, and Auth payloads.
"""
from datetime import datetime
from typing import List, Optional, Dict
from pydantic import BaseModel, EmailStr, Field


# ──────────────────── Auth ────────────────────
class RegisterRequest(BaseModel):
    full_name: str
    email: str
    password: str
    role: str = Field(..., pattern="^(admin|owner|engineer)$")
    phone_number: Optional[str] = None
    address: Optional[str] = None
    organization: Optional[str] = None
    employee_id: Optional[str] = None
    certification_id: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    full_name: str


# ──────────────────── User ────────────────────
class UserOut(BaseModel):
    id: str = Field(alias="_id")
    full_name: str
    email: str
    role: str
    approved: bool
    phone_number: Optional[str] = None
    address: Optional[str] = None
    organization: Optional[str] = None
    employee_id: Optional[str] = None
    certification_id: Optional[str] = None
    assigned_vehicles: List[str] = []
    created_at: Optional[datetime] = None

    class Config:
        populate_by_name = True


# ──────────────────── Vehicle ────────────────────
class CreateVehicleRequest(BaseModel):
    vehicle_id: str
    vin_number: str
    license_plate: str
    manufacturer: str
    model: str
    year: int
    ecu_count: int = 15


class OwnerRegisterVehicleRequest(BaseModel):
    vehicle_id: str
    vin_number: str
    license_plate: str
    manufacturer: str
    model: str
    year: int
    ecu_count: int = 15


class VehicleOut(BaseModel):
    id: str = Field(alias="_id")
    vehicle_id: str
    vin_number: str
    license_plate: str
    manufacturer: str
    model: str
    year: int
    ecu_count: int
    owner_id: str
    assigned_engineers: List[str] = []
    status: str = "active"
    created_at: Optional[datetime] = None

    class Config:
        populate_by_name = True


class VehicleAdminOut(VehicleOut):
    owner_name: str
    engineer_names: List[str] = []


class VehicleOwnerOut(VehicleOut):
    engineer_names: List[str] = []


class VehicleRegOut(VehicleOut):
    vehicle_api_key: str  # Plaintext key shown once


class VehicleRegenerationOut(BaseModel):
    vehicle_id: str
    vehicle_api_key: str  # Plaintext key shown once


class AssignEngineerRequest(BaseModel):
    vehicle_id: str
    engineer_id: str


# ──────────────────── Engineer ────────────────────
class EngineerOut(BaseModel):
    id: str = Field(alias="_id")
    full_name: str

    class Config:
        populate_by_name = True


# ──────────────────── Log Ingestion ────────────────────
class LogIngestRequest(BaseModel):
    timestamp: str
    can_id: int
    dlc: int
    data: List[int]


class LogOut(BaseModel):
    id: str = Field(alias="_id")
    vehicle_id: str
    timestamp: datetime
    can_id: int
    dlc: int
    data: List[int]
    payload: Optional[List[int]] = None
    extractedFeatures: Optional[List[float]] = None
    prediction: Optional[str] = None
    confidence: Optional[float] = None
    predictedLabel: Optional[int] = None
    labelName: Optional[str] = None
    confidenceScore: Optional[float] = None
    model_version: str = "LSTM_v1"
    created_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
