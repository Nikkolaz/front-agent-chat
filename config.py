# backend/app/core/config.py
import os
from typing import List
from dotenv import load_dotenv
from .path_helper import get_db_path

# Cargar variables de entorno desde el archivo .env si existe
load_dotenv()

class Settings:
    PROJECT_NAME: str = "Cerebro de IA – Auditoría Financiera CCF"
    VERSION: str = "0.2.0"
    DESCRIPTION: str = (
        "API que recibe reportes financieros (XML/CSV/Excel) de las Cajas de "
        "Compensación Familiar y devuelve informes de cumplimiento conforme "
        "al Artículo 43 de la Ley 21 de 1982. Soporta procesamiento batch "
        "de hasta 5 archivos simultáneos con análisis comparativo."
    )
    
    # Configuración de base de datos
    # Usa path_helper para que funcione tanto en desarrollo como empaquetado (.exe)
    DB_PATH: str = get_db_path()
    SQLALCHEMY_DATABASE_URL: str = f"sqlite:///{DB_PATH}"

    # Configuraciones de Gemini
    GEMINI_API_KEY: str = os.environ.get("GEMINI_API_KEY", "")
    DEFAULT_MODEL: str = "gemini-flash-lite-latest"

    # Configuraciones de Auditoría por defecto
    ADMIN_MAX: float = 0.08   # 8 %
    CUOTA_MIN: float = 0.55   # 55 %
    MAX_FILES_PER_SESSION: int = 5

    # CORS
    CORS_ORIGINS: List[str] = ["*"]
    
    # Seguridad / JWT
    # IMPORTANTE: En producción, SECRET_KEY debe generarse con `openssl rand -hex 32` y leerse desde .env
    SECRET_KEY: str = os.environ.get("SECRET_KEY", "b3d4f8e5c6a1b2d3f4e5a6b7c8d9e0f1")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 1 Semana de duración simulada

settings = Settings()
