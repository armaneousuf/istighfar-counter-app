import { CalculationMethod, Coordinates, Madhab, PrayerTimes } from '../../vendor/adhan/Adhan.js';

export function calculatePrayerTimes(latitude, longitude, date = new Date()) {
  const parameters = CalculationMethod.Karachi();
  parameters.madhab = Madhab.Hanafi;
  return new PrayerTimes(new Coordinates(latitude, longitude), date, parameters);
}

export function formatPrayerTime(date) {
  return new Intl.DateTimeFormat([], { hour: 'numeric', minute: '2-digit' }).format(date);
}
