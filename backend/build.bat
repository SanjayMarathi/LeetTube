@echo off
title LeetTube - Build
echo ================================================
echo   LeetTube Java Backend - Building...
echo ================================================
echo.

SET JAVA_HOME=C:\Program Files\Java\jdk-26.0.2
SET MVN_CMD=C:\maven\apache-maven-3.9.8\bin\mvn.cmd

echo Stopping any running server...
taskkill /F /IM java.exe /T >nul 2>&1
timeout /t 2 /nobreak >nul

echo Building JAR (may take 30-60s first time)...
"%MVN_CMD%" package -DskipTests -q

if %ERRORLEVEL% EQU 0 (
    echo.
    echo BUILD SUCCESS!
    echo Now run start-backend.bat to launch the server.
) else (
    echo.
    echo BUILD FAILED - check error output above.
)

echo.
pause
