@echo off
REM Shipment Tracking - Android APK Build Script (Windows)
REM This script automates the process of building the Android APK

setlocal enabledelayedexpansion

echo ========================================
echo Shipment Tracking Android APK Builder
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 16+ first.
    pause
    exit /b 1
)
echo [OK] Node.js found
node -v

REM Check if npm is installed
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed.
    pause
    exit /b 1
)
echo [OK] npm found
npm -v

REM Check for ANDROID_HOME
if not defined ANDROID_HOME (
    echo [WARNING] ANDROID_HOME not set. You may need to build using Android Studio.
    echo           See ANDROID_APK_GUIDE.md for setup instructions.
) else (
    echo [OK] ANDROID_HOME found: %ANDROID_HOME%
)

echo.
echo ========================================
echo Step 1/6: Installing dependencies...
echo ========================================
call npm install
if %ERRORLEVEL% NEQ 0 goto :error

echo.
echo ========================================
echo Step 2/6: Installing Capacitor...
echo ========================================
call npm install @capacitor/core @capacitor/cli @capacitor/android
if %ERRORLEVEL% NEQ 0 goto :error

echo.
echo ========================================
echo Step 3/6: Building web application...
echo ========================================
call npm run build
if %ERRORLEVEL% NEQ 0 goto :error

echo.
echo ========================================
echo Step 4/6: Initializing Capacitor...
echo ========================================
if not exist "capacitor.config.ts" (
    call npx cap init "Shipment Tracking" "com.shipment.tracking" --web-dir=dist
    if %ERRORLEVEL% NEQ 0 goto :error
) else (
    echo [OK] Capacitor already initialized
)

echo.
echo ========================================
echo Step 5/6: Adding Android platform...
echo ========================================
if not exist "android" (
    call npx cap add android
    if %ERRORLEVEL% NEQ 0 goto :error
) else (
    echo [OK] Android platform already exists, syncing...
    call npx cap sync android
    if %ERRORLEVEL% NEQ 0 goto :error
)

echo.
echo ========================================
echo Step 6/6: Building Android APK...
echo ========================================

if not defined ANDROID_HOME (
    echo [WARNING] ANDROID_HOME not set. Opening Android Studio...
    echo           Please build the APK from Android Studio:
    echo           Build -^> Build Bundle^(s^) / APK^(s^) -^> Build APK^(s^)
    call npx cap open android
    pause
    exit /b 0
) else (
    echo Building APK using Gradle...
    cd android
    
    call gradlew.bat assembleDebug
    if %ERRORLEVEL% NEQ 0 (
        cd ..
        goto :error
    )
    
    cd ..
    
    if exist "android\app\build\outputs\apk\debug\app-debug.apk" (
        echo.
        echo ========================================
        echo SUCCESS! APK BUILT SUCCESSFULLY!
        echo ========================================
        echo.
        echo APK Location:
        echo    android\app\build\outputs\apk\debug\app-debug.apk
        echo.
        echo Next Steps:
        echo    1. Transfer APK to your Android device
        echo    2. Enable 'Install from Unknown Sources'
        echo    3. Install and test the app
        echo.
        echo For production build, see: ANDROID_APK_GUIDE.md
        echo.
    ) else (
        echo [ERROR] APK build failed. Check error messages above.
        goto :error
    )
)

echo Build process complete!
pause
exit /b 0

:error
echo.
echo [ERROR] Build failed! Please check the error messages above.
echo         For troubleshooting, see: ANDROID_APK_GUIDE.md
pause
exit /b 1
