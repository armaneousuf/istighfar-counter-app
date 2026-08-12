const REMINDER_ID = 1001;

function plugin() {
  return window.Capacitor?.Plugins?.LocalNotifications;
}

export async function setDailyReminder(enabled) {
  const localNotifications = plugin();
  if (!localNotifications) return false;
  await localNotifications.cancel({ notifications: [{ id: REMINDER_ID }] });
  if (!enabled) return true;

  let permission = await localNotifications.checkPermissions();
  if (permission.display !== 'granted') permission = await localNotifications.requestPermissions();
  if (permission.display !== 'granted') return false;

  await localNotifications.createChannel({
    id: 'istighfar-reminders',
    name: 'Daily reminders',
    description: 'Gentle Istighfar reminders',
    importance: 3,
    visibility: 1
  });
  await localNotifications.schedule({
    notifications: [{
      id: REMINDER_ID,
      title: 'A gentle moment for Istighfar',
      body: 'Take a quiet moment to seek forgiveness and return to Allah.',
      schedule: { on: { hour: 20, minute: 0 }, repeats: true, allowWhileIdle: true },
      channelId: 'istighfar-reminders'
    }]
  });
  return true;
}
