# Se implementó la entidad del dominio para trazabilidad de ubicaciones GPS
from typing import Optional
from pydantic import BaseModel, Field


# Entidad de dominio TripLocationModel
class TripLocationModel(BaseModel):
    id: Optional[str] = Field(None, description="UUID primario del registro GPS")
    trip_id: str = Field(..., description="FK relacional a public.packages.id")
    driver_id: Optional[str] = Field(None, description="FK relacional a public.profiles.id del mototaxista")
    latitude: float
    longitude: float
    recorded_at: Optional[str] = None
