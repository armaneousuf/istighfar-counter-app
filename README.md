## After changing the html

#### Sync the changes into android project (run from root folder)

`npx cap sync android`

#### Rebuild the APK

```bash
cd android
./gradlew assembleDebug
```

#### How the App Version works

The version number is defined in a few places to ensure consistency across the app UI, the installed app name, and the final APK file.

- **APK Filename:** In `android/app/build.gradle`, the `versionName` (e.g. `"2.2"`) controls the version. The build script uses this to automatically name the generated file (e.g. `istighfar-app-v2.2.apk`). You should also increment `versionCode` by 1 each time you release a new version to the Play Store.
- **App Icon Name:** In `capacitor.config.json`, the `appName` (e.g. `Istighfar Counter v2.2`) controls the name shown under the app icon on your phone's home screen.
- **In-App UI:** In `www/index.html`, the `<title>` and `<h1>` tags control the version shown inside the app.

#### How to update the App Version

When releasing a new update (e.g. v2.3):

1. Open `android/app/build.gradle`, increase `versionCode` by 1, and change `versionName` to the new version (e.g., `"2.3"`).
2. Open `capacitor.config.json` and change the version in `appName` to `"Istighfar Counter v2.3"`.
3. Open `www/index.html` and update the version in `<title>` and `<h1>`.
4. Build the app. The generated APK will automatically be named `istighfar-app-v2.3.apk`.

#### Share it from this path

`~/istighfar-app/android/app/build/outputs/apk/debug/`
