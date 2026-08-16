# Punto de Entrada Principal (FastAPI App Server) con Arquitectura Hexagonal
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.adapters.api.router import router

app = FastAPI(
    title="Mototaxi Huarmey API",
    description="API REST de la plataforma Mototaxi Huarmey en Arquitectura Hexagonal",
    version="2.0.0"
)

# Configuración de CORS para permitir solicitudes desde el frontend web
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusión del enrutador de adaptadores API HTTP
app.include_router(router)


@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Mototaxi Huarmey API",
        "architecture": "Hexagonal Architecture (Ports & Adapters)",
        "version": "2.0.0"
    }
