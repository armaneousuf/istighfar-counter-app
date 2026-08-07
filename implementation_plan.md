# Istighfar Counter v3.0 Implementation Plan

This plan details the steps to implement v3.0 of the Istighfar Counter app with IndexedDB, Chart.js, Adhan.js, and Local Notifications, adhering to the strict offline and versioning constraints provided.

## User Review Required
> [!IMPORTANT]
> The user has requested to pause after each of the 4 features so they can manually verify the build on their phone. I will implement Feature 1, commit, and wait for confirmation before moving to Feature 2.

## Proposed Changes

---
### 1. IndexedDB Migration
#### [MODIFY] [script.js](file:///home/armaneousuf/istighfar-counter-app/www/script.js)
- *Verified Storage Key:* The existing data uses the key `ISTIGHFAR_APP_DATA_V4`.
- Add a loading state (e.g. an overlay with a spinner) to the UI that is visible by default or shown immediately on load.
- Add functions `openDB()`, `loadStateIDB()`, and `saveStateIDB()`.
- On startup, `openDB()` will be called. Inside `loadStateIDB()`:
  - Try to load from `IndexedDB`.
  - If no data, check `localStorage.getItem('ISTIGHFAR_APP_DATA_V4')`.
  - If local storage data exists, migrate it to IndexedDB, then `localStorage.removeItem('ISTIGHFAR_APP_DATA_V4')`.
- Catch any errors during DB loading and display a visible error state rather than failing silently.
- Once loaded successfully, remove the loading state and run the synchronous UI initializations.

---
### 2. Chart.js Weekly Chart
#### [NEW] `www/lib/chart.umd.js`
- Install `chart.js` via npm, copy `node_modules/chart.js/dist/chart.umd.js` to `www/lib/`.
#### [MODIFY] [index.html](file:///home/armaneousuf/istighfar-counter-app/www/index.html)
- Add `<script src="lib/chart.umd.js"></script>` near the end of `<body>`, exactly before `script.js`.
- Replace the existing `weeklyChartContainer` inner DOM structure with a `<canvas id="weeklyChartCanvas"></canvas>`.
#### [MODIFY] [script.js](file:///home/armaneousuf/istighfar-counter-app/www/script.js)
- Rewrite `renderWeeklyChart()` to initialize/update a Chart.js instance.

---
### 3. Prayer Times (Adhan.js)
#### [NEW] `www/lib/adhan.umd.js`
- Install `adhan` via npm, copy `node_modules/adhan/lib/adhan.umd.js` to `www/lib/`.
#### [MODIFY] [index.html](file:///home/armaneousuf/istighfar-counter-app/www/index.html)
- Add `<script src="lib/adhan.umd.js"></script>` near the end of `<body>`, exactly before `script.js`.
- Add a Prayer Times card on the main screen below the stats.
- Add Settings dropdown for Calculation Method (Default: Karachi).
#### [MODIFY] [script.js](file:///home/armaneousuf/istighfar-counter-app/www/script.js)
- Default calculation method explicitly set to `Adhan.CalculationMethod.Karachi()` with `madhab = Adhan.Madhab.Hanafi`. 
- Settings will allow switching to MWL, ISNA, Egyptian, or Umm al-Qura.
- Request Geolocation via Capacitor (`@capacitor/geolocation`), with fallbacks.
- Calculate prayer times using local midnight `new Date(year, month, date)`.
- Highlight current/next prayer, refreshing every minute.
- Prohibited windows logic: after Fajr until ~15m after sunrise, before Dhuhr until Dhuhr, Asr until Maghrib.

---
### 4. Local Notifications
#### [MODIFY] [package.json](file:///home/armaneousuf/istighfar-counter-app/package.json)
- Install `@capacitor/local-notifications`.
#### [MODIFY] [android/app/src/main/AndroidManifest.xml](file:///home/armaneousuf/istighfar-counter-app/android/app/src/main/AndroidManifest.xml)
- Add permissions: `POST_NOTIFICATIONS`, `SCHEDULE_EXACT_ALARM`, `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`.
#### [MODIFY] [index.html](file:///home/armaneousuf/istighfar-counter-app/www/index.html)
- Add a "Daily Reminder" toggle and time picker in Settings.
#### [MODIFY] [script.js](file:///home/armaneousuf/istighfar-counter-app/www/script.js)
- Request `POST_NOTIFICATIONS` permission if on Android 13+.
- Schedule the recurring local notification.

---
### 5. Versioning
#### [MODIFY] [android/app/build.gradle](file:///home/armaneousuf/istighfar-counter-app/android/app/build.gradle)
- Update `versionCode` to 7, `versionName` to "3.0".
#### [MODIFY] [capacitor.config.json](file:///home/armaneousuf/istighfar-counter-app/capacitor.config.json)
- Update `appName` to "Istighfar Counter v3.0".
#### [MODIFY] [index.html](file:///home/armaneousuf/istighfar-counter-app/www/index.html)
- Update `<title>` and `<h1>` to v3.0.

## Process
I will commit after each of the 4 features independently and WAIT for the user to confirm the build works on their phone before proceeding.

## Verification Plan
### Automated Tests
- No automated test suite exists, relying on manual verification via the Capacitor build.
### Manual Verification
- Review the `istighfar-app-v3.0.apk` after build completion.
