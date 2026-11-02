import os
import sys
import time
import threading
import multiprocessing
import uvicorn
import webview
import http.server
import socketserver
from dotenv import load_dotenv

def get_executable_dir():
    """Retorna la ruta externa donde está el .exe o el script"""
    if getattr(sys, 'frozen', False):
        return os.path.dirname(sys.executable)
    return os.path.dirname(os.path.abspath(__file__))

def get_internal_dir():
    """Retorna la ruta interna de archivos embebidos de PyInstaller (_MEIPASS)"""
    if getattr(sys, 'frozen', False):
        return sys._MEIPASS
    return os.path.dirname(os.path.abspath(__file__))

# 1. Cargar las variables de entorno DESDE AFUERA del ejecutable
env_path = os.path.join(get_executable_dir(), ".env")
load_dotenv(dotenv_path=env_path)

# Inyectar la ruta del ejecutable en el entorno para que path_helper la pueda usar
os.environ["CAMARASBOT_EXE_DIR"] = get_executable_dir()

# Configurar el working directory al directorio del ejecutable
# Esto es importante para que las rutas relativas funcionen
os.chdir(get_executable_dir())

# Es importante cargar main *después* de setear el .env para que config lea la API KEY
from backend.app.main import app
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi import Request
from fastapi.responses import JSONResponse

import socket

def get_free_port():
    """Encuentra un puerto libre en el sistema para evitar conflictos con Docker u otras apps."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("", 0))
        s.listen(1)
        port = s.getsockname()[1]
    return port

# Obtenemos un puerto libre antes de iniciar nada
API_PORT = get_free_port()

def run_api(port):
    """Inicia el servidor backend (FastAPI) en un hilo secundario."""
    try:
        uvicorn.run(app, host="127.0.0.1", port=port, log_level="info")
    except Exception as e:
        print(f"[ERROR] No se pudo iniciar el servidor API: {e}")

if __name__ == "__main__":
    multiprocessing.freeze_support()
    
    print("=" * 60)
    print("  CamarasBot - Cerebro de IA - Auditoría Financiera CCF")
    print("=" * 60)
    print(f"  Directorio: {get_executable_dir()}")
    print(f"  .env cargado: {os.path.exists(env_path)}")
    print(f"  GROQ_API_KEY: {'Configurada' if os.environ.get('GROQ_API_KEY') else 'NO CONFIGURADA'}")
    print(f"  GEMINI_API_KEY: {'Configurada' if os.environ.get('GEMINI_API_KEY') else 'NO CONFIGURADA'}")
    print("=" * 60)
    
    # 2. Configurar FastAPI para servir el Frontend
    if getattr(sys, 'frozen', False):
        frontend_dir = os.path.join(get_internal_dir(), "frontend_dist")
    else:
        frontend_dir = os.path.join(get_executable_dir(), "..", "front-agent-chat", "dist")

    if not os.path.exists(frontend_dir):
        print(f"[ADVERTENCIA] No se encontró el frontend en: {frontend_dir}")
        print("  El dashboard web no estará disponible.")
    else:
        print(f"  Frontend: {frontend_dir}")
        
        # Montar carpeta de assets (JS, CSS)
        assets_dir = os.path.join(frontend_dir, "assets")
        if os.path.exists(assets_dir):
            app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
            
        @app.get("/")
        def read_root():
            return FileResponse(os.path.join(frontend_dir, "index.html"))
            
        @app.get("/favicon.svg")
        def read_favicon():
            path = os.path.join(frontend_dir, "favicon.svg")
            return FileResponse(path) if os.path.exists(path) else JSONResponse(status_code=404, content={})
            
        @app.get("/icons.svg")
        def read_icons():
            path = os.path.join(frontend_dir, "icons.svg")
            return FileResponse(path) if os.path.exists(path) else JSONResponse(status_code=404, content={})

        # Catch-all para React Router (SPA Fallback)
        @app.exception_handler(404)
        async def spa_fallback(request: Request, exc):
            path = request.url.path
            # Si la ruta es para la API, devolver 404 normal en JSON
            if path.startswith("/api/") or path == "/login" or path == "/docs" or path == "/openapi.json":
                return JSONResponse({"detail": "Not found"}, status_code=404)
            # Para cualquier otra ruta, devolver index.html para que React Router decida
            return FileResponse(os.path.join(frontend_dir, "index.html"))

    # 3. Lanzamos la API (que ahora también sirve el frontend) en el puerto dinámico
    api_thread = threading.Thread(target=run_api, args=(API_PORT,), daemon=True)
    api_thread.start()
    
    # Damos 2 segundos para que el servidor inicie
    time.sleep(2)
    
    print("\n  Iniciando ventana del dashboard...")
    print(f"  Servidor corriendo en: http://127.0.0.1:{API_PORT}")
    print("  (Cierre esta ventana para detener el servidor)\n")
    
    # 4. Lanzamos la ventana apuntando al puerto dinámico
    webview.create_window('Cámaras Bot - Dashboard', f'http://127.0.0.1:{API_PORT}/', width=1280, height=800)
    webview.start()
    
    # 5. Cuando el usuario cierra la ventana, pywebview termina. Apagamos todo.
    os._exit(0)
