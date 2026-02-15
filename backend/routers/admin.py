from fastapi import APIRouter, HTTPException, Header
import os
from backend.storage.json_store import get_store

router = APIRouter()

def _check_admin(x_admin_key: str | None):
    admin_key = os.getenv("ADMIN_KEY", "changeme")
    if x_admin_key != admin_key:
        raise HTTPException(status_code=403, detail="Not authorized")

@router.get("/db/status")
def db_status():
    store = get_store()
    return {
        "initialized": store.is_initialized(),
        "missing": store.get_missing()
    }

@router.post("/db/init")
def db_init(x_admin_key: str | None = Header(default=None)):
    _check_admin(x_admin_key)
    store = get_store()
    store.init_database()
    return {"ok": True, "initialized": store.is_initialized()}

