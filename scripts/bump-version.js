#!/usr/bin/env node
/**
 * bump-version.js — update the app version everywhere at once.
 *
 * Usage (run from the project root, before `npx cap sync android`):
 *
 *   node scripts/bump-version.js 3.8.3          # --code auto-increments, date = today
 *   node scripts/bump-version.js 3.8.3 22       # also set versionCode to 22
 *   node scripts/bump-version.js 3.8.3 --code +2
 *   node scripts/bump-version.js                  # interactive prompts
 *   node scripts/bump-version.js --dry-run 3.8.3  # show changes, write nothing
 *
 * Also available as `npm run version:bump -- 3.8.3`.
 *
 * Files touched:
 *   android/app/build.gradle  versionName "x" + versionCode N
 *   www/index.html            Settings label "App version"
 *   package.json              "version" (bare version, derived if you pass 4 parts)
 *   www/script.js             APP_LAST_UPDATED
 *   www/sw.js                 CACHE_NAME (optional, keeps the PWA from serving stale files)
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const ROOT = path.resolve(__dirname, "..");

const FILES = {
  gradle: path.join(ROOT, "android/app/build.gradle"),
  indexHtml: path.join(ROOT, "www/index.html"),
  packageJson: path.join(ROOT, "package.json"),
  scriptJs: path.join(ROOT, "www/script.js"),
  swJs: path.join(ROOT, "www/sw.js"),
};

// ---------------------------------------------------------------- utilities

const c = {
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
};

function fail(msg) {
  console.error(c.red("error: ") + msg);
  process.exit(1);
}

function readText(file) {
  if (!fs.existsSync(file))
    fail(`file not found: ${path.relative(ROOT, file)}`);
  return fs.readFileSync(file, "utf8");
}

/** today in the machine's local time, as YYYY-MM-DD */
function todayISO() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function isVersion(v) {
  return /^\d+(\.\d+)*$/.test(v);
}

/** keep only the first 3 parts, for package.json's strict semver field */
function toSemver(v) {
  const parts = v.split(".");
  while (parts.length < 3) parts.push("0");
  return parts.slice(0, 3).join(".");
}

/** replace exactly one match of `re` in `text`; throws if the shape changed */
function replaceOnce(text, re, build, label) {
  const matches = text.match(
    new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g"),
  );
  if (!matches || matches.length === 0) {
    fail(`could not find ${label} — did the file change? (pattern: ${re})`);
  }
  if (matches.length > 1) {
    fail(
      `found ${matches.length} matches for ${label}, expected 1 — refusing to guess.`,
    );
  }
  return text.replace(re, build);
}

// ---------------------------------------------------------------- reading current state

function readCurrent() {
  const gradle = readText(FILES.gradle);
  const html = readText(FILES.indexHtml);
  const pkgRaw = readText(FILES.packageJson);
  const script = readText(FILES.scriptJs);
  const sw = readText(FILES.swJs);

  const versionName = gradle.match(/versionName\s+"([^"]+)"/);
  const versionCode = gradle.match(/versionCode\s+(\d+)/);
  const htmlVersion = html.match(
    /(<span>App version<\/span><span>)([^<]*)(<\/span>)/,
  );
  const pkgVersion = pkgRaw.match(/"version"\s*:\s*"([^"]+)"/);
  const lastUpdated = script.match(/const APP_LAST_UPDATED\s*=\s*"([^"]*)"/);
  const cacheName = sw.match(/const CACHE_NAME\s*=\s*'([^']*)'/);

  if (!versionName)
    fail("could not find versionName in android/app/build.gradle");
  if (!versionCode)
    fail("could not find versionCode in android/app/build.gradle");
  if (!htmlVersion)
    fail("could not find the 'App version' span in www/index.html");
  if (!pkgVersion) fail('could not find "version" in package.json');
  if (!lastUpdated) fail("could not find APP_LAST_UPDATED in www/script.js");
  if (!cacheName) fail("could not find CACHE_NAME in www/sw.js");

  return {
    versionName: versionName[1],
    versionCode: Number(versionCode[1]),
    htmlVersion: htmlVersion[2],
    pkgVersion: pkgVersion[1],
    lastUpdated: lastUpdated[1],
    cacheName: cacheName[1],
    raw: { gradle, html, pkgRaw, script, sw },
  };
}

// ---------------------------------------------------------------- prompts

function ask(rl, question, fallback) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim() || fallback));
  });
}

// ---------------------------------------------------------------- main

async function main() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes("--dry-run") || argv.includes("-n");
  const noCache = argv.includes("--no-cache");
  const jsonUpdate = argv.includes("--update-json");
  const positional = argv.filter((a) => !a.startsWith("-"));

  // --code can be "+1", "+2", a number, or "auto" (default: +1)
  let codeArg = null;
  const codeFlag = argv.findIndex((a) => a === "--code" || a === "-c");
  if (codeFlag !== -1) codeArg = argv[codeFlag + 1] || "auto";

  const cur = readCurrent();
  console.log(
    c.dim(
      `current version: ${cur.versionName}  (versionCode ${cur.versionCode}, package.json ${cur.pkgVersion}, updated ${cur.lastUpdated})`,
    ),
  );

  let version = positional[0];
  let code = positional[1] || codeArg;
  let date = todayISO();

  if (!version) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    console.log(
      c.bold("\nNew version"),
      c.dim("(e.g. 3.8.3 — bump the last number for a bug fix)"),
    );
    version = await ask(
      rl,
      `  version [${cur.versionName}]: `,
      cur.versionName,
    );
    code = await ask(
      rl,
      `  versionCode [${cur.versionCode + 1}]: `,
      String(cur.versionCode + 1),
    );
    date = await ask(rl, `  last-updated date [${date}]: `, date);
    rl.close();
  }

  version = version.replace(/^v/, "").trim();
  if (!isVersion(version)) {
    fail(
      `"${version}" is not a valid version. Use dotted numbers only, e.g. 3.8.3 (no letters or dashes — Android versionName and the APK file name use it verbatim).`,
    );
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
    fail(
      `"${date}" is not a date in YYYY-MM-DD form (used by APP_LAST_UPDATED).`,
    );

  // ---- versionCode
  let nextCode;
  if (code === undefined || code === null || code === "" || code === "auto") {
    nextCode = cur.versionCode + 1;
  } else if (/^\+\d+$/.test(String(code))) {
    nextCode = cur.versionCode + Number(String(code).slice(1));
  } else if (/^\d+$/.test(String(code))) {
    nextCode = Number(code);
  } else {
    fail(
      `"${code}" is not a valid versionCode (use a number, or +1 to increase by one).`,
    );
  }
  if (nextCode <= cur.versionCode) {
    console.log(
      c.yellow(
        `warning: versionCode ${nextCode} is not greater than the installed ${cur.versionCode} — Android will refuse to install the update.`,
      ),
    );
  }

  const pkgVersion = toSemver(version);
  if (pkgVersion !== version) {
    console.log(
      c.yellow(
        `note: package.json keeps a 3-part semver, so it will be "${pkgVersion}" (from "${version}").`,
      ),
    );
  }

  // ---- build the new file contents
  const newGradle = replaceOnce(
    replaceOnce(
      cur.raw.gradle,
      /versionCode\s+\d+/,
      () => `versionCode ${nextCode}`,
      "versionCode",
    ),
    /versionName\s+"[^"]+"/,
    () => `versionName "${version}"`,
    "versionName",
  );

  const newHtml = replaceOnce(
    cur.raw.html,
    /(<span>App version<\/span><span>)[^<]*(<\/span>)/,
    (m, a, b) => `${a}${version}${b}`,
    "'App version' label",
  );

  const newPkg = replaceOnce(
    cur.raw.pkgRaw,
    /"version"\s*:\s*"[^"]*"/,
    () => `"version": "${pkgVersion}"`,
    'package.json "version"',
  );

  let newScript = replaceOnce(
    cur.raw.script,
    /const APP_LAST_UPDATED\s*=\s*"[^"]*"/,
    () => `const APP_LAST_UPDATED = "${date}"`,
    "APP_LAST_UPDATED",
  );
  if (jsonUpdate) {
    const withVersion = newScript.match(/const APP_VERSION\s*=\s*"([^"]*)"/);
    if (!withVersion) {
      console.log(
        c.yellow(
          "note: --update-json was passed but www/script.js has no APP_VERSION constant; skipping.",
        ),
      );
    } else {
      newScript = replaceOnce(
        newScript,
        /const APP_VERSION\s*=\s*"[^"]*"/,
        () => `const APP_VERSION = "${version}"`,
        "APP_VERSION",
      );
    }
  }

  // Cache name always changes so installed PWAs fetch the new files instead of
  // serving the previous release from cache. --no-cache opts out.
  const cachePrefix = cur.cacheName.replace(/-v[\d.]+$/, "");
  const nextCacheName = `${cachePrefix}-v${version}`;
  const newSw = noCache
    ? cur.raw.sw
    : replaceOnce(
        cur.raw.sw,
        /const CACHE_NAME\s*=\s*'[^']*'/,
        () => `const CACHE_NAME = '${nextCacheName}'`,
        "CACHE_NAME",
      );

  // ---- report
  const rows = [
    ["android/app/build.gradle  versionName", cur.versionName, version],
    [
      "android/app/build.gradle  versionCode",
      String(cur.versionCode),
      String(nextCode),
    ],
    ["www/index.html             App version", cur.htmlVersion, version],
    ["package.json               version", cur.pkgVersion, pkgVersion],
    ["www/script.js              APP_LAST_UPDATED", cur.lastUpdated, date],
  ];
  if (!noCache)
    rows.push([
      "www/sw.js                  CACHE_NAME",
      cur.cacheName,
      nextCacheName,
    ]);

  console.log("");
  for (const [label, from, to] of rows) {
    const changed = from !== to;
    const arrow = changed
      ? `${c.red(from)} ${c.dim("→")} ${c.green(to)}`
      : `${c.dim(from)} ${c.dim("(unchanged)")}`;
    console.log(`  ${label.padEnd(42)} ${arrow}`);
  }
  console.log("");

  if (dryRun) {
    console.log(c.cyan("dry run — nothing written."));
    return;
  }

  fs.writeFileSync(FILES.gradle, newGradle);
  fs.writeFileSync(FILES.indexHtml, newHtml);
  fs.writeFileSync(FILES.packageJson, newPkg);
  fs.writeFileSync(FILES.scriptJs, newScript);
  if (!noCache) fs.writeFileSync(FILES.swJs, newSw);

  console.log(c.green("✓ version updated") + c.dim(" — next steps:"));
  console.log(
    c.dim(
      "    npm run build:css            # only if tailwind.input.css changed",
    ),
  );
  console.log(c.dim("    npx cap sync android"));
  console.log(c.dim("    cd android && ./gradlew assembleDebug"));
  console.log(
    c.dim(
      `    APK: android/app/build/outputs/apk/debug/istighfar-app-v${version}.apk`,
    ),
  );
}

main().catch((err) => fail(err && err.stack ? err.stack : String(err)));
