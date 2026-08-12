function plugin() {
  return window.Capacitor?.Plugins?.Haptics;
}

export async function hapticTap(enabled) {
  if (!enabled) return;
  const haptics = plugin();
  if (haptics) {
    try {
      await haptics.impact({ style: 'LIGHT' });
      return;
    } catch (e) {
      // fall through to web vibrate
    }
  }
  if (navigator.vibrate) navigator.vibrate(12);
}