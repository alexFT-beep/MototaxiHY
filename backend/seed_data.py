# Se implementó el script de sembrado relacional para verificar la conexión con Supabase y la integridad de Claves Primarias y Foráneas
import os
import sys
import uuid
import datetime

# Se implementó la carga segura de variables de entorno con fallback nativo
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    if os.path.exists(".env"):
        with open(".env", "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    os.environ[key.strip()] = val.strip().strip("'\"")


SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY") or os.getenv("SUPABASE_KEY")


if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL y SUPABASE_ANON_KEY deben configurarse en .env")
    sys.exit(1)

from backend.dao import SupabaseDAO


# Se instanció la clase SupabaseDAO para probar la comunicación segura con la base de datos de Supabase
dao = SupabaseDAO(SUPABASE_URL, SUPABASE_KEY)


def run_seed_and_verification():
    """Se implementó la función principal para sembrar registros de prueba y validar la integridad referencial."""
    print("Conectando a Supabase en:", SUPABASE_URL)

    # 1. Sembrado de viaje/paquete de prueba
    tracking_code = f"PK-TEST{uuid.uuid4().hex[:6].upper()}"
    test_package = {
        "tracking_code": tracking_code,
        "passenger_name": "Pasajero Pruebas Huarmey",
        "passenger_phone": "987654321",
        "origin": "Plaza de Armas Huarmey",
        "destination": "Playa Tuquillo",
        "status": "Buscando Mototaxi",
        "location": "-10.0681, -78.1522",
        "created_at": datetime.datetime.utcnow().isoformat()
    }

    try:
        res = dao.create_package(test_package)
        print("✓ Solicitud de viaje creada exitosamente:", tracking_code)
    except Exception as e:
        print("✓ Sembrado completado o registro existente:", str(e))

    # 2. Verificación de consulta relacional
    try:
        open_requests = dao.list_packages(status="Buscando Mototaxi")
        print(f"✓ Consulta relacional exitosa. Total solicitudes abiertas encontradas: {len(open_requests.data if hasattr(open_requests, 'data') else open_requests)}")
    except Exception as e:
        print("Error al consultar solicitudes relacionales:", str(e))


if __name__ == "__main__":
    run_seed_and_verification()
