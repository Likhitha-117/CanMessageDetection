"""
FastAPI dependencies for authentication and role-based access control.
"""
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from ..core.security import decode_access_token
from ..core.database import get_db

security_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
):
    """Decode JWT and return the user document from MongoDB."""
    token = credentials.credentials
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    db = get_db()
    from bson import ObjectId

    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if not user.get("approved"):
        raise HTTPException(status_code=403, detail="Account not yet approved by admin")

    user["_id"] = str(user["_id"])
    return user


def require_role(*roles: str):
    """Return a dependency that checks the user has one of the given roles."""

    async def role_checker(user=Depends(get_current_user)):
        if user.get("role") not in roles:
            raise HTTPException(
                status_code=403,
                detail=f"Access denied. Required role(s): {', '.join(roles)}",
            )
        return user

    return role_checker


async def get_vehicle_by_api_key(
    authorization: str = Header(..., alias="X-Vehicle-API-Key"),
):
    """Verify the vehicle API key sent in the header for log ingestion."""
    from ..core.security import verify_api_key
    db = get_db()
    
    # Iterate through vehicles to verify hashed key
    # (Scale optimization: search by partial key or add X-Vehicle-ID in future)
    cursor = db.vehicles.find({"status": "active"})
    async for vehicle in cursor:
        if verify_api_key(authorization, vehicle.get("vehicle_api_key", "")):
            vehicle["_id"] = str(vehicle["_id"])
            return vehicle
            
    raise HTTPException(status_code=401, detail="Invalid vehicle API key")
