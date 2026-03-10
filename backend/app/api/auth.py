"""
Auth routes: Register and Login.
"""
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, HTTPException

from ..core.database import get_db
from ..core.security import hash_password, verify_password, create_access_token
from ..models.schemas import RegisterRequest, LoginRequest, TokenResponse

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register")
async def register(req: RegisterRequest):
    db = get_db()
    existing = await db.users.find_one({"email": req.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_doc = {
        "full_name": req.full_name,
        "email": req.email,
        "password": hash_password(req.password),
        "role": req.role,
        "approved": req.role == "admin",  # first admin auto-approved
        "phone_number": req.phone_number,
        "address": req.address,
        "organization": req.organization,
        "employee_id": req.employee_id,
        "certification_id": req.certification_id,
        "assigned_vehicles": [],
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.users.insert_one(user_doc)
    return {
        "message": "Registration successful. Await admin approval."
        if req.role != "admin"
        else "Admin registered and approved.",
        "user_id": str(result.inserted_id),
    }


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest):
    db = get_db()
    user = await db.users.find_one({"email": req.email})
    if not user or not verify_password(req.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.get("approved"):
        raise HTTPException(status_code=403, detail="Account not yet approved by admin")

    token = create_access_token(
        data={"sub": str(user["_id"]), "role": user["role"]}
    )
    return TokenResponse(
        access_token=token,
        role=user["role"],
        full_name=user["full_name"],
    )
