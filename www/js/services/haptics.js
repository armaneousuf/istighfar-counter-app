export function hapticTap(enabled) {
  if (!enabled || !navigator.vibrate) return;
  navigator.vibrate(12);
}
