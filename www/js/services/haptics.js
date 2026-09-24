function plugin() {
  return window.Capacitor?.Plugins?.Haptics;
}

// Feedback "flavours". Each call site can request a light, intentional tick
// (every tap) or a richer pattern for meaningful moments (round complete,
// milestone). Keeping them distinct makes the app feel responsive rather than
// monotonous, and avoids a harsh buzz on every single tap.
const PATTERNS = {
  light: { style: 'LIGHT', webMs: 10 },
  medium: { style: 'MEDIUM', webMs: [0, 18] },
  success: { style: 'MEDIUM', webMs: [0, 12, 40, 18] },
  selection: { style: 'LIGHT', webMs: 8 }
};

export async function hapticTap(enabled, flavour = 'light') {
  if (!enabled) return;
  const pattern = PATTERNS[flavour] || PATTERNS.light;

  const haptics = plugin();
  if (haptics) {
    try {
      if (haptics.impact) {
        await haptics.impact({ style: pattern.style });
        return;
      }
      if (haptics.vibrate) {
        await haptics.vibrate({ duration: pattern.webMs });
        return;
      }
    } catch (e) {
      // fall through to web vibrate
    }
  }

  if (navigator.vibrate) {
    try {
      navigator.vibrate(pattern.webMs);
    } catch (e) {
      // vibration unsupported / blocked — silently ignore
    }
  }
}