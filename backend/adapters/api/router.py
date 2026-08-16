# Se implementó el Adaptador de Entrada API REST en la Arquitectura Hexagonal con FastAPI
import os
from typing import Optional
from fastapi import APIRouter, HTTPException

from backend.domain.user import LoginRequest, SignupRequest
from backend.domain.package import PackageModel, PackageUpdate
from backend.adapters.infrastructure.supabase_dao import SupabaseDAO

router = APIRouter()

# Instancia global del adaptador de persistencia Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://bmvhvysluevomiijncqq.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtdmh2eXNsdWV2b21paWpuY3FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4MDc2MzIsImV4cCI6MjEwMjM4MzYzMn0.hLtjoBA-rdimJeRU5_HY3gDDhywPf8NPpuPk2wCd6ew")

dao = SupabaseDAO(SUPABASE_URL, SUPABASE_KEY)


@router.post("/auth/login")
def login(req: LoginRequest):
    try:
        res = dao.sign_in(req.phone, req.password)
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/auth/signup")
def signup(req: SignupRequest):
    try:
        res = dao.sign_up(req.model_dump())
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/packages")
def create_package_endpoint(pkg: PackageModel):
    try:
        res = dao.create_package(pkg.model_dump(exclude_unset=True))
        if hasattr(res, "data") and res.data:
            return res.data[0] if isinstance(res.data, list) else res.data
        return pkg.model_dump()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/packages")
def list_packages_endpoint(status: Optional[str] = None, passenger_phone: Optional[str] = None):
    try:
        res = dao.list_packages(passenger_phone=passenger_phone, status=status)
        if hasattr(res, "data"):
            return res.data
        return []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/packages/track/{tracking_code}")
def track_package(tracking_code: str):
    try:
        res = dao.get_package_by_code(tracking_code)
        if hasattr(res, "data") and res.data:
            return res.data
        raise HTTPException(status_code=404, detail="Código de seguimiento no encontrado")
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/packages/{package_id}/status")
def update_status(package_id: str, body: PackageUpdate):
    try:
        res = dao.update_package_status(package_id, body.status, body.model_dump(exclude={"status"}, exclude_none=True))
        if hasattr(res, "data") and res.data:
            return res.data[0] if isinstance(res.data, list) else res.data
        return {"message": "Estado actualizado correctamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
