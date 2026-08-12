## After changing the html

#### Sync the changes into android project (run from root folder)

`npx cap sync android`

#### Rebuild the APK

```bash
cd android
./gradlew assembleDebug
```

#### How to update the App Version

When releasing a new update (e.g. v2.3):

1. Open `android/app/build.gradle`, increase `versionCode` by 1, and change `versionName` (for example, to `"3.4"`).
2. Open `www/index.html` and update the `App version` value in Settings to `3.4`.
3. Update `package.json` to `3.4.0` if you are making a release.
4. Run `npx cap sync android`, then build the app. The APK will automatically be named `istighfar-app-v3.4.apk`.

#### Share it from this path

`~/istighfar-counter-app/android/app/build/outputs/apk/debug/`
