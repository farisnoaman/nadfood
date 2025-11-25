# Complete Guide: Building Android APK for Shipment Tracking App

## Overview

This guide will help you convert the Shipment Tracking web application into a native Android APK using Capacitor. You have three options:

1. **Local Build** (Recommended for full control)
2. **EAS Build** (Easiest, cloud-based)
3. **GitHub Actions** (Automated CI/CD)

---

## Prerequisites

- Node.js 16+ installed
- Git installed
- For local builds: Android Studio or Android SDK
- For cloud builds: Internet connection only

---

## Option 1: Local Build (Full Control)

### Step 1: Install Android Studio

1. Download Android Studio from: https://developer.android.com/studio
2. Install Android Studio
3. During installation, ensure these components are selected:
   - Android SDK
   - Android SDK Platform
   - Android Virtual Device (optional, for testing)

4. Open Android Studio and complete the setup wizard
5. Go to: Tools → SDK Manager → SDK Tools
6. Install:
   - Android SDK Build-Tools
   - Android SDK Command-line Tools
   - Android Emulator (optional)

### Step 2: Set Environment Variables

**Windows:**
```powershell
# Add to System Environment Variables
ANDROID_HOME=C:\Users\[YourUsername]\AppData\Local\Android\Sdk
Path=%Path%;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools
```

**macOS/Linux:**
```bash
# Add to ~/.bashrc or ~/.zshrc
export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
export ANDROID_HOME=$HOME/Android/Sdk          # Linux
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
```

Restart your terminal after setting variables.

### Step 3: Install Capacitor and Setup

```bash
# Navigate to project directory
cd shipment_tracking-0.0.1

# Install Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android

# Initialize Capacitor
npx cap init "Shipment Tracking" "com.shipment.tracking" --web-dir=dist

# Build the web app
npm run build

# Add Android platform
npx cap add android

# Sync web assets to Android
npx cap sync android
```

### Step 4: Configure Android Project

Edit `android/app/build.gradle`:

```gradle
android {
    namespace "com.shipment.tracking"
    compileSdkVersion 34
    
    defaultConfig {
        applicationId "com.shipment.tracking"
        minSdkVersion 22
        targetSdkVersion 34
        versionCode 1
        versionName "0.0.1"
    }
    
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Step 5: Build APK

**Option A: Using Capacitor CLI (Easier)**
```bash
# Open project in Android Studio
npx cap open android

# In Android Studio:
# 1. Wait for Gradle sync to complete
# 2. Build → Build Bundle(s) / APK(s) → Build APK(s)
# 3. APK will be in: android/app/build/outputs/apk/debug/app-debug.apk
```

**Option B: Using Command Line**
```bash
# Navigate to Android folder
cd android

# Build debug APK
./gradlew assembleDebug

# Build release APK (unsigned)
./gradlew assembleRelease

# APK location:
# Debug: app/build/outputs/apk/debug/app-debug.apk
# Release: app/build/outputs/apk/release/app-release-unsigned.apk
```

### Step 6: Sign APK for Production (Optional)

For production/Play Store:

```bash
# Generate keystore
keytool -genkey -v -keystore shipment-tracking.keystore -alias shipment -keyalg RSA -keysize 2048 -validity 10000

# Create android/key.properties
storePassword=YOUR_STORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=shipment
storeFile=../shipment-tracking.keystore

# Update android/app/build.gradle
android {
    signingConfigs {
        release {
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}

# Build signed APK
cd android && ./gradlew assembleRelease
```

---

## Option 2: EAS Build (Cloud-Based, Easiest)

### Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

### Step 2: Login to Expo

```bash
eas login
# or create account: eas register
```

### Step 3: Configure EAS

Create `eas.json`:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

### Step 4: Build APK

```bash
# Build for development
eas build --platform android --profile development

# Build for production
eas build --platform android --profile production

# Download APK from the link provided
```

**Advantages:**
- No local Android SDK needed
- Cloud-based building
- Automatic signing
- Free tier available

**Note:** Requires Expo account (free)

---

## Option 3: GitHub Actions (Automated CI/CD)

Create `.github/workflows/android-build.yml`:

```yaml
name: Build Android APK

on:
  push:
    branches: [ main, V0.0.1 ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Setup Java
      uses: actions/setup-java@v3
      with:
        distribution: 'temurin'
        java-version: '17'
    
    - name: Install dependencies
      run: npm install
    
    - name: Install Capacitor
      run: |
        npm install @capacitor/core @capacitor/cli @capacitor/android
        npx cap init "Shipment Tracking" "com.shipment.tracking" --web-dir=dist
    
    - name: Build web app
      run: npm run build
    
    - name: Add Android platform
      run: npx cap add android
    
    - name: Sync Capacitor
      run: npx cap sync android
    
    - name: Build APK
      run: |
        cd android
        chmod +x gradlew
        ./gradlew assembleDebug
    
    - name: Upload APK
      uses: actions/upload-artifact@v3
      with:
        name: app-debug
        path: android/app/build/outputs/apk/debug/app-debug.apk
```

**How to use:**
1. Push this workflow file to GitHub
2. Go to Actions tab
3. Click "Build Android APK"
4. Download the APK artifact

---

## Configuration Files

### capacitor.config.ts

Create this file in the project root:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.shipment.tracking',
  appName: 'Shipment Tracking',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
      releaseType: 'APK'
    }
  }
};

export default config;
```

### AndroidManifest.xml Permissions

Add these permissions to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" 
                 android:maxSdkVersion="32" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"
                 android:maxSdkVersion="32" />
```

---

## Troubleshooting

### Issue: Gradle sync failed

**Solution:**
```bash
cd android
./gradlew clean
./gradlew build --refresh-dependencies
```

### Issue: SDK not found

**Solution:**
```bash
# Verify ANDROID_HOME
echo $ANDROID_HOME  # Linux/Mac
echo %ANDROID_HOME% # Windows

# Install SDK if missing
sdkmanager "platform-tools" "platforms;android-34"
```

### Issue: Build failed - OutOfMemoryError

**Solution:**
Edit `android/gradle.properties`:
```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxPermSize=512m -XX:+HeapDumpOnOutOfMemoryError
```

### Issue: Cleartext traffic not permitted

**Solution:**
Edit `android/app/src/main/AndroidManifest.xml`:
```xml
<application
    android:usesCleartextTraffic="true"
    android:networkSecurityConfig="@xml/network_security_config">
```

Create `android/app/src/main/res/xml/network_security_config.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">kjvzhzbxspgvvmktjwdi.supabase.co</domain>
    </domain-config>
</network-security-config>
```

---

## Testing the APK

### Install on Device

```bash
# Enable USB Debugging on your Android device
# Connect device via USB

# Check device connection
adb devices

# Install APK
adb install app-debug.apk

# Or drag-and-drop APK to device
```

### Install via QR Code

Use services like:
- https://appetize.io (browser-based testing)
- https://appdistribution.firebase.google.com (Firebase App Distribution)

---

## Distribution

### Google Play Store

1. Build signed release APK
2. Create Play Console account ($25 one-time fee)
3. Upload APK/AAB
4. Complete store listing
5. Submit for review

### Alternative Distribution

- **Direct Download:** Host APK on your server
- **Firebase App Distribution:** Free testing distribution
- **APKPure/APKMirror:** Third-party stores
- **Enterprise Distribution:** Internal deployment

---

## Size Optimization

Reduce APK size:

```gradle
android {
    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt')
        }
    }
    
    splits {
        abi {
            enable true
            reset()
            include 'armeabi-v7a', 'arm64-v8a'
            universalApk false
        }
    }
}
```

---

## Quick Start Script

Save this as `build-apk.sh`:

```bash
#!/bin/bash

echo "🚀 Building Shipment Tracking Android APK..."

# Install Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android

# Initialize Capacitor
npx cap init "Shipment Tracking" "com.shipment.tracking" --web-dir=dist

# Build web app
npm run build

# Add Android platform
npx cap add android

# Sync assets
npx cap sync android

# Build APK
cd android
./gradlew assembleDebug

echo "✅ APK built successfully!"
echo "📦 Location: android/app/build/outputs/apk/debug/app-debug.apk"
```

Make executable: `chmod +x build-apk.sh`

Run: `./build-apk.sh`

---

## Next Steps

1. Choose your preferred build method (Local/EAS/GitHub Actions)
2. Follow the step-by-step instructions
3. Test the APK on your device
4. Deploy to Play Store or distribute directly

## Support

For issues:
- Capacitor Docs: https://capacitorjs.com/docs
- Android Docs: https://developer.android.com
- Stack Overflow: Tag with `capacitor` and `android`

---

**Note:** The sandbox environment doesn't have Android SDK installed, so you'll need to build the APK locally or use a cloud service as described above.
