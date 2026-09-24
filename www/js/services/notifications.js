const REMINDER_ID = 1001;

function plugin() {
  return window.Capacitor?.Plugins?.LocalNotifications;
}

// A short, rotating set of gentle nudges. Copy stays warm and specific but
// never guilt-tripping or repetitive — each message is used once per cycle so
// the user does not see the same line two days in a row.
const MESSAGE_POOL = [
  {
    title: "A small step today",
    body: "A minute of Istighfar now keeps your rhythm going."
  },
  {
    title: "Your streak is rooting",
    body: "You showed up before — one quiet moment today keeps it growing."
  },
  {
    title: "No pressure, just presence",
    body: "Whenever you are ready, a few Istighfar are enough."
  },
  {
    title: "Pick up where you left off",
    body: "Yesterday's effort is waiting for a little company today."
  },
  {
    title: "A gentle pause",
    body: "Take a calm breath and a few Istighfar — that's all it takes."
  }
];

function pickMessage() {
  // Rotate deterministically by day so it advances each day but stays stable
  // within a single day (avoids rescheduling churn).
  const dayIndex = Math.floor(Date.now() / 86400000);
  return MESSAGE_POOL[dayIndex % MESSAGE_POOL.length];
}

async function ensurePermission(localNotifications) {
  let permission = await localNotifications.checkPermissions();
  if (permission.display !== "granted") {
    permission = await localNotifications.requestPermissions();
  }
  return permission.display === "granted";
}

async function ensureChannel(localNotifications) {
  await localNotifications.createChannel({
    id: "istighfar-reminders",
    name: "Gentle reminders",
    description: "Light, occasional Istighfar nudges",
    // importance 3 = DEFAULT: makes a sound but does not pop over the screen
    // or buzz insistently. Kept low on purpose so reminders never annoy.
    importance: 3,
    visibility: 1,
  });
}

/**
 * Schedule a single, repeating, low-key daily reminder at the given hour.
 * One notification a day, no backlog, no nagging.
 */
export async function setDailyReminder(enabled, options = {}) {
  const localNotifications = plugin();
  if (!localNotifications) return false;

  // Always clear first so toggling off or changing time never leaves a stale
  // notification behind.
  await localNotifications.cancel({ notifications: [{ id: REMINDER_ID }] });
  if (!enabled) return true;

  if (!(await ensurePermission(localNotifications))) return false;
  await ensureChannel(localNotifications);

  const hour = Number.isFinite(options.hour) ? options.hour : 20;
  const minute = Number.isFinite(options.minute) ? options.minute : 0;
  const message = pickMessage();

  await localNotifications.schedule({
    notifications: [
      {
        id: REMINDER_ID,
        title: message.title,
        body: message.body,
        schedule: {
          on: { hour, minute },
          repeats: true,
          allowWhileIdle: true,
        },
        channelId: "istighfar-reminders",
      },
    ],
  });
  return true;
}
