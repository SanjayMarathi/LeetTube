@echo off
title LeetTube Java Backend
echo ================================================
echo   LeetTube Java Backend
echo ================================================
echo.

SET JAVA_EXE=C:\Program Files\Java\jdk-26.0.2\bin\java.exe
SET JAR_FILE=E:\LeetTube\backend\target\leettube-backend-1.0.0.jar

IF NOT EXIST "%JAVA_EXE%" (
    echo ERROR: Java not found at %JAVA_EXE%
    echo Please install Java from https://adoptium.net
    pause
    exit /b 1
)

IF NOT EXIST "%JAR_FILE%" (
    echo ERROR: Server JAR not found.
    echo Please build first: run build.bat
    pause
    exit /b 1
)

echo Starting server... (takes ~3 seconds)
echo.
echo  Health check:  http://localhost:8080/api/health
echo  Diagnostics:   http://localhost:8080/api/diagnostics
echo.
echo Press Ctrl+C to stop the server.
echo ================================================
echo.

"%JAVA_EXE%" -jar "%JAR_FILE%"

pause
