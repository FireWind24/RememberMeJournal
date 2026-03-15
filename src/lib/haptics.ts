// Haptic feedback — silently ignored on devices that don't support it
export function haptic(type: 'light' | 'medium' | 'success' | 'error' = 'light') {
  if (!navigator.vibrate) return
  const patterns: Record<string, number | number[]> = {
    light:   10,
    medium:  20,
    success: [10, 50, 10],
    error:   [20, 30, 20, 30, 20],
  }
  navigator.vibrate(patterns[type])
}
