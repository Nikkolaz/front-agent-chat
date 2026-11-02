@echo off
echo ========================================================
echo   CamarasBot - Empaquetador de Ejecutable
echo ========================================================
echo.

:: 1. Validar que el frontend compilado exista
if not exist "..\front-agent-chat\dist\index.html" (
    echo [ERROR] No se encontro el frontend compilado en ..\front-agent-chat\dist\
    echo Primero ejecute 'npm run build' en la carpeta front-agent-chat.
    pause
    exit /b 1
)

:: 2. Activar el entorno virtual
if not exist ".venv\Scripts\activate.bat" (
    echo [INFO] Creando entorno virtual...
    python -m venv .venv
)
call .venv\Scripts\activate.bat

:: 3. Instalar dependencias
echo.
echo [INFO] Instalando dependencias...
pip install -r requirements.txt --quiet

:: 4. Limpiar builds anteriores
echo.
echo [INFO] Limpiando builds anteriores...
if exist "build\CamarasBot" rmdir /s /q "build\CamarasBot"
if exist "dist\CamarasBot.exe" del /q "dist\CamarasBot.exe"

:: 5. Ejecutar PyInstaller con el spec
echo.
echo ========================================================
echo [INFO] Empaquetando con PyInstaller...
echo ========================================================
pyinstaller CamarasBot.spec --clean --noconfirm

:: 6. Verificar que el .exe se creo
echo.
if exist "dist\CamarasBot.exe" (
    echo ========================================================
    echo [OK] Ejecutable creado exitosamente en: dist\CamarasBot.exe
    echo ========================================================
    echo.
    
    :: 7. Crear carpeta de distribucion
    if not exist "dist\distribuir" mkdir "dist\distribuir"
    copy "dist\CamarasBot.exe" "dist\distribuir\" >nul
    
    copy ".env" "dist\distribuir\.env" >nul
    
    echo.
    echo Para distribuir, copie la carpeta "dist\distribuir\" al otro PC.
    echo El usuario debe editar el archivo .env con sus API keys.
) else (
    echo ========================================================
    echo [ERROR] No se pudo crear el ejecutable.
    echo Revise los errores de PyInstaller arriba.
    echo ========================================================
)

echo.
pause
