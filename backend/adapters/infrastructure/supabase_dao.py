# Se implementó el Adaptador de Infraestructura SupabaseDAO conectando con Supabase (Auth, user_credentials y packages)
import uuid
import datetime
import re
from typing import Any, Dict, List, Optional
from supabase import create_client, Client

from backend.ports.repository import IDatabaseDAO


class SupabaseDAO(IDatabaseDAO):
    """Adaptador de infraestructura concreto para operaciones en Supabase."""

    # Se inicializó el cliente de Supabase recibiendo la URL y la API Key del entorno
    def __init__(self, url: str, key: str):
        self.client: Client = create_client(url, key)

    # Se implementó el formateador de email sintético utilizando el número de teléfono de 9 dígitos
    def _format_phone_email(self, phone: str) -> str:
        clean_phone = re.sub(r"\D", "", phone or "")
        if len(clean_phone) != 9:
            raise ValueError("El número de teléfono debe contener exactamente 9 dígitos numéricos")
        return f"{clean_phone}@mototaxihuarmey.pe"

    # Se implementó el método sign_in para autenticar contra la tabla public.user_credentials mediante teléfono de 9 dígitos y contraseña (máx 12 chars)
    def sign_in(self, phone: str, password: str) -> Dict[str, Any]:
        clean_phone = re.sub(r"\D", "", phone or "")
        if len(clean_phone) != 9:
            raise ValueError("El número de teléfono debe contener exactamente 9 dígitos numéricos")

        if not password or len(password) > 12 or len(password) < 6:
            raise ValueError("La contraseña debe tener entre 6 y 12 caracteres")

        try:
            res = self.client.table("user_credentials").select("*").eq("phone", clean_phone).eq("password", password).execute()
            if hasattr(res, "data") and res.data and len(res.data) > 0:
                user = res.data[0]
                return {
                    "user": {
                        "id": user.get("id"),
                        "phone": user.get("phone"),
                        "user_metadata": {
                            "fullName": user.get("full_name"),
                            "dni": user.get("dni"),
                            "phone": user.get("phone"),
                            "role": user.get("role"),
                            "zone": user.get("zone"),
                            "plateNumber": user.get("plate_number"),
                            "license": user.get("license"),
                            "model": user.get("model")
                        }
                    }
                }
        except Exception as e:
            print("Error consultando user_credentials:", e)

        raise RuntimeError("Número de teléfono o contraseña incorrectos")

    # Se implementó el método sign_up para registrar usuarios en la tabla public.user_credentials
    def sign_up(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        phone = re.sub(r"\D", "", user_data.get("phone") or "")
        if len(phone) != 9:
            raise ValueError("El número de teléfono debe contener exactamente 9 dígitos numéricos")

        password = user_data.get("password")
        if not password or len(password) > 12 or len(password) < 6:
            raise ValueError("La contraseña debe tener entre 6 y 12 caracteres")

        credential_record = {
            "phone": phone,
            "password": password,
            "full_name": user_data.get("fullName"),
            "dni": user_data.get("dni"),
            "role": user_data.get("role", "pasajero"),
            "zone": user_data.get("zone", "Centro de Huarmey"),
            "plate_number": user_data.get("plateNumber"),
            "license": user_data.get("license"),
            "model": user_data.get("model")
        }

        res = self.client.table("user_credentials").upsert(credential_record).execute()
        return {"user": {"user_metadata": user_data}}

    # Se implementó la creación explícita de perfiles en la tabla public.profiles
    def create_profile(self, profile: Dict[str, Any]) -> Dict[str, Any]:
        if "created_at" not in profile:
            profile["created_at"] = datetime.datetime.utcnow().isoformat()
        return self.client.table("profiles").upsert(profile).execute()

    # Se implementó la búsqueda de perfiles por su ID único de usuario
    def get_profile_by_id(self, profile_id: str) -> Dict[str, Any]:
        return self.client.table("profiles").select("*").eq("id", profile_id).single().execute()

    # Se implementó la consulta de perfil por número telefónico de 9 dígitos
    def get_profile_by_phone(self, phone: str) -> Dict[str, Any]:
        return self.client.table("profiles").select("*").eq("phone", phone).single().execute()

    # Se implementó la creación de solicitudes de paquetes o viajes asignando un código único de seguimiento
    def create_package(self, pkg: Dict[str, Any]) -> Dict[str, Any]:
        if "tracking_code" not in pkg or not pkg["tracking_code"]:
            pkg["tracking_code"] = f"PK-{uuid.uuid4().hex[:8].upper()}"
        if "created_at" not in pkg:
            pkg["created_at"] = datetime.datetime.utcnow().isoformat()
        if "status" not in pkg:
            pkg["status"] = "Buscando Mototaxi"

        return self.client.table("packages").insert(pkg).execute()

    # Se implementó la creación relacional de paquetes asignando llaves foráneas passenger_id y driver_id
    def create_relational_package(self, pkg: Dict[str, Any]) -> Dict[str, Any]:
        return self.create_package(pkg)

    # Se implementó la obtención de un paquete por su ID primario
    def get_package(self, package_id: Any) -> Dict[str, Any]:
        return self.client.table("packages").select("*").eq("id", package_id).single().execute()

    # Se implementó la búsqueda de paquete o viaje mediante el código de seguimiento público
    def get_package_by_code(self, tracking_code: str) -> Dict[str, Any]:
        return self.client.table("packages").select("*").eq("tracking_code", tracking_code).single().execute()

    # Se implementó el listado de solicitudes abiertas para el dashboard del mototaxista
    def list_packages(self, passenger_phone: Optional[str] = None, status: Optional[str] = None) -> List[Dict[str, Any]]:
        query = self.client.table("packages").select("*")
        if passenger_phone:
            query = query.eq("passenger_phone", passenger_phone)
        if status:
            query = query.eq("status", status)
        return query.execute()

    # Se implementó la actualización de estado y ubicación GPS en tiempo real para el mototaxista
    def update_package_status(self, package_id: Any, status: str, extra: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        body = {
            "status": status,
            "updated_at": datetime.datetime.utcnow().isoformat()
        }
        if extra:
            body.update(extra)
        return self.client.table("packages").update(body).eq("id", package_id).execute()

    # Se implementó el guardado de trazabilidad de ubicación GPS en la tabla public.trip_locations
    def record_trip_location(self, trip_id: str, driver_id: Optional[str], latitude: float, longitude: float) -> Dict[str, Any]:
        record = {
            "trip_id": trip_id,
            "driver_id": driver_id,
            "latitude": latitude,
            "longitude": longitude,
            "recorded_at": datetime.datetime.utcnow().isoformat()
        }
        return self.client.table("trip_locations").insert(record).execute()
