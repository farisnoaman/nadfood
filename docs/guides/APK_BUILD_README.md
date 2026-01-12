# Android APK Build - Quick Reference

## 🚀 Quick Start (Choose One Method)

### Method 1: Automated Script (Easiest)

**Linux/Mac:**
```bash
chmod +x build-apk.sh
./build-apk.sh
```

**Windows:**
```batch
build-apk.bat
```

### Method 2: GitHub Actions (Cloud Build)

1. Push code to GitHub
2. Go to "Actions" tab
3. Click "Build Android APK"
4. Download APK from artifacts

### Method 3: Manual Build

```bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android

# Build web app
npm run build

# Setup Android
npx cap init "Shipment Tracking" "com.shipment.tracking" --web-dir=dist
npx cap add android
npx cap sync android

# Build APK (choose one):

# Option A: Android Studio
npx cap open android
# Then: Build → Build Bundle(s) / APK(s) → Build APK(s)

# Option B: Command line
cd android && ./gradlew assembleDebug
```

---

## 📦 APK Location

After successful build:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 📱 Install on Device

### Option 1: USB
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Option 2: Manual
1. Transfer APK to device
2. Enable "Install from Unknown Sources"
3. Tap APK to install

---

## ⚙️ Prerequisites

- Node.js 16+ ✅
- Android Studio OR Android SDK ✅
- Java 17+ ✅

**Install Android Studio:** https://developer.android.com/studio

**Set ANDROID_HOME:**
```bash
# Linux/Mac
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Windows
set ANDROID_HOME=C:\Users\[YourUsername]\AppData\Local\Android\Sdk
```

---

## 🔧 Troubleshooting

### Build fails with "SDK not found"
```bash
# Verify ANDROID_HOME
echo $ANDROID_HOME

# Install SDK tools
sdkmanager "platform-tools" "platforms;android-34"
```

### Gradle sync fails
```bash
cd android
./gradlew clean
./gradlew build --refresh-dependencies
```

### Out of memory
Edit `android/gradle.properties`:
```properties
org.gradle.jvmargs=-Xmx4096m
```

---

## 📚 Full Documentation

For detailed instructions, see: **[ANDROID_APK_GUIDE.md](ANDROID_APK_GUIDE.md)**

Topics covered:
- Local build with Android Studio
- Cloud build with EAS
- CI/CD with GitHub Actions
- Signing for production
- Google Play Store deployment
- Size optimization
- Complete troubleshooting guide

---

## 🎯 Production Build

For Play Store release:

1. Generate keystore:
```bash
keytool -genkey -v -keystore shipment-tracking.keystore \
  -alias shipment -keyalg RSA -keysize 2048 -validity 10000
```

2. Build signed APK:
```bash
cd android
./gradlew assembleRelease
```

APK location: `android/app/build/outputs/apk/release/app-release.apk`

---

## 📊 Build Stats

- **App Size:** ~15-25 MB (debug), ~8-12 MB (release)
- **Min SDK:** Android 5.1 (API 22)
- **Target SDK:** Android 14 (API 34)
- **Build Time:** 2-5 minutes (first build), <1 minute (subsequent)

---

## 🔐 GitHub Actions Secrets

For automated builds, add these secrets to your GitHub repository:

**Required for all builds:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

**Required for release builds:**
- `ANDROID_KEYSTORE_BASE64` (base64 encoded keystore)
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_PASSWORD`
- `ANDROID_KEY_ALIAS`

---

## 🆘 Need Help?

1. Check **ANDROID_APK_GUIDE.md** for detailed solutions
2. Verify prerequisites are installed
3. Ensure environment variables are set correctly
4. Try cleaning and rebuilding: `cd android && ./gradlew clean`

---

**Last Updated:** 2025-01-19  
**Version:** 0.0.1  
**Capacitor Version:** 6.x
