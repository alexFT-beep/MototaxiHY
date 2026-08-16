# Se definió el Puerto / Interfaz abstracta del repositorio de datos en la Arquitectura Hexagonal
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional


class IDatabaseDAO(ABC):
    """Interfaz de Puerto para persistencia y autenticación."""

    @abstractmethod
    def sign_in(self, phone: str, password: str) -> Dict[str, Any]:
        pass

    @abstractmethod
    def sign_up(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    def create_package(self, pkg: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    def get_package(self, package_id: Any) -> Dict[str, Any]:
        pass

    @abstractmethod
    def get_package_by_code(self, tracking_code: str) -> Dict[str, Any]:
        pass

    @abstractmethod
    def list_packages(self, passenger_phone: Optional[str] = None, status: Optional[str] = None) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def update_package_status(self, package_id: Any, status: str, extra: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        pass
