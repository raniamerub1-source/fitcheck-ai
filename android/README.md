# FitCheck AI — Android / Google Play Store Release Guide

This directory contains the production-ready **Trusted Web Activity (TWA)** Android project for **FitCheck AI**, configured to package the live PWA (`https://fitcheck-ai.rrmm787787.workers.dev/`) into an official Android App Bundle (`.aab`) for distribution on the Google Play Store.

---

## 1. Project Specifications

- **Application Name**: FitCheck AI
- **Package / Application ID**: `com.fitcheck.ai`
- **Target PWA URL**: `https://fitcheck-ai.rrmm787787.workers.dev/`
- **Architecture**: Google Chrome / AndroidX Trusted Web Activity (TWA) via `com.google.androidbrowserhelper:androidbrowserhelper:2.5.0`
- **Min SDK**: 21 (Android 5.0 Lollipop — 99%+ device compatibility)
- **Target / Compile SDK**: 34 (Android 14 — compliant with current Google Play requirements)
- **App Version**: `1.0.0` (versionCode `1`)
- **Branding**:
  - Theme Color: `#191919`
  - Splash Background: `#FBFBF9`
  - Icons: Complete density mipmap suite (`mdpi`, `hdpi`, `xhdpi`, `xxhdpi`, `xxxhdpi`) + adaptive icons (Android 8.0+)
- **Features Supported**:
  - Full-screen native experience (no browser address bar once Digital Asset Links is verified)
  - Real Gemini Vision AI critique
  - Full Camera & Gallery photo selection via Android FileProvider
  - Offline app shell caching via Service Worker

---

## 2. Prerequisites for Local Android / Java Environment

To build the release Android App Bundle (`.aab`) or APK on your local computer, you will need:

1. **Java Development Kit (JDK 17 or higher)**
   - Verify with: `java -version`
2. **Android SDK** (API Level 34 and Build-Tools 34.0.0)
   - Typically installed via [Android Studio](https://developer.android.com/studio) or Android Command-Line Tools.
3. Set `ANDROID_HOME` or `ANDROID_SDK_ROOT`:
   ```bash
   export ANDROID_HOME=$HOME/Android/Sdk   # Linux/macOS
   # Or set ANDROID_HOME in Windows Environment Variables
   ```

---

## 3. Step-by-Step Build Instructions

### Method A: Using Gradle / Android Studio (Recommended)

1. Open the `android/` folder in **Android Studio**, or navigate to `android/` in your terminal:
   ```bash
   cd android
   ```

2. **Generate a Release Keystore** (one-time setup for your Google Play Developer account):
   ```bash
   keytool -genkey -v -keystore android.keystore -alias android -keyalg RSA -keysize 2048 -validity 10000
   ```

3. **Obtain your SHA-256 Fingerprint**:
   ```bash
   keytool -list -v -keystore android.keystore -alias android
   ```
   Locate the line starting with `SHA256:`. Copy the hex string (e.g. `AA:BB:CC:...`).

4. **Update Digital Asset Links**:
   In `public/.well-known/assetlinks.json` and in `src/worker.ts`, paste your SHA-256 fingerprint into the `sha256_cert_fingerprints` array.

5. **Build the Android App Bundle (`.aab`)**:
   Run the Gradle release bundle task passing your signing credentials:
   ```bash
   ./gradlew bundleRelease \
     -PRELEASE_STORE_FILE=../android.keystore \
     -PRELEASE_STORE_PASSWORD=your_store_password \
     -PRELEASE_KEY_ALIAS=android \
     -PRELEASE_KEY_PASSWORD=your_key_password
   ```
   The production Google Play App Bundle will be output to:
   `android/app/build/outputs/bundle/release/app-release.aab`

---

### Method B: Using Bubblewrap CLI

Because `twa-manifest.json` is pre-configured at the project root, you can also use Google's official Bubblewrap CLI:

1. Install Bubblewrap CLI:
   ```bash
   npm install -g @bubblewrap/cli
   ```
2. Build the project:
   ```bash
   bubblewrap build
   ```

---

## 4. Google Play Console Upload Checklist

1. Log in to [Google Play Console](https://play.google.com/console).
2. Click **Create App**:
   - App name: **FitCheck AI**
   - Default language: English (United States)
   - App or game: App
   - Free or paid: Free
3. Navigate to **Release > Testing or Production**.
4. Create a new release and upload `app-release.aab`.
5. **App Signing with Google Play**:
   - If you opt into Play App Signing, Google generates an app signing key.
   - Go to **Release > Setup > App integrity > App signing key certificate**.
   - Copy the Google SHA-256 certificate fingerprint and add it to `public/.well-known/assetlinks.json` so the app is verified automatically on end-user devices.
6. Complete store listing details (app descriptions, screenshots, privacy policy).
7. Submit for review!
