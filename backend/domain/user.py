# Se implementaron las entidades del dominio de usuario con validación de teléfono (9 dígitos) y contraseña (máx 12 caracteres)
from typing import Optional
from pydantic import BaseModel, Field


# Entidad para la solicitud de inicio de sesión
class LoginRequest(BaseModel):
    phone: str = Field(..., description="Teléfono celular de 9 dígitos numéricos")
    password: str = Field(..., min_length=6, max_length=12, description="Contraseña de máximo 12 caracteres")


# Entidad para la solicitud de registro
class SignupRequest(BaseModel):
    phone: str = Field(..., description="Teléfono celular de 9 dígitos numéricos")
    password: str = Field(..., min_length=6, max_length=12, description="Contraseña de 6 a 12 caracteres")
    fullName: str
    dni: str
    zone: str
    role: str = Field("pasajero", description="pasajero o mototaxista")
    startPoint: Optional[str] = None
    plateNumber: Optional[str] = None
    license: Optional[str] = None
    model: Optional[str] = None
    email: Optional[str] = None


# Entidad del modelo de perfil relacional en el dominio
class ProfileModel(BaseModel):
    id: Optional[str] = Field(None, description="UUID correspondiente a auth.users.id o PK de perfil")
    phone: str = Field(..., description="Teléfono celular de 9 dígitos numéricos")
    full_name: str
    dni: Optional[str] = None
    zone: Optional[str] = "Centro de Huarmey"
    role: str = Field("pasajero", description="pasajero o mototaxista")
    plate_number: Optional[str] = None
    license: Optional[str] = None
    model: Optional[str] = None
    created_at: Optional[str] = None
