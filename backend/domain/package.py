# Se implementaron las entidades del dominio de paquetes y viajes
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


# Entidad de dominio PackageModel para solicitudes de viajes/paquetes
class PackageModel(BaseModel):
    id: Optional[Any] = Field(None, description="UUID primario de la tabla public.packages")
    tracking_code: Optional[str] = Field(None, description="Código de seguimiento único PK-XXXXXXXX")
    passenger_id: Optional[str] = Field(None, description="FK a public.profiles.id del pasajero")
    driver_id: Optional[str] = Field(None, description="FK a public.profiles.id del mototaxista")
    passenger_name: Optional[str] = None
    passenger_phone: Optional[str] = None
    origin: str
    destination: str
    status: str = Field("Buscando Mototaxi", description="Buscando Mototaxi, Asignado, En Camino, En Viaje, Completado, Cancelado")
    location: Optional[str] = None
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    driver_plate: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


# Alias de compatibilidad
Package = PackageModel


# Entidad de actualización de viaje o paquete
class PackageUpdate(BaseModel):
    status: str
    location: Optional[str] = None
    driver_id: Optional[str] = None
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    driver_plate: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
