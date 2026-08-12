import { CalculationMethod, Coordinates, Madhab, PrayerTimes } from '../../vendor/adhan/Adhan.js';

export function calculatePrayerTimes(latitude, longitude, date = new Date()) {
  const parameters = CalculationMethod.Karachi();
  parameters.madhab = Madhab.Hanafi;
  return new PrayerTimes(new Coordinates(latitude, longitude), date, parameters);
}

export function formatPrayerTime(date) {
  return new Intl.DateTimeFormat([], { hour: 'numeric', minute: '2-digit' }).format(date);
}

// Save location to localStorage
export function saveLocation(latitude, longitude) {
  localStorage.setItem('savedLatitude', latitude);
  localStorage.setItem('savedLongitude', longitude);
}

// Retrieve saved location from localStorage
export function getSavedLocation() {
  const lat = localStorage.getItem('savedLatitude');
  const lng = localStorage.getItem('savedLongitude');
  return (lat && lng) ? { latitude: parseFloat(lat), longitude: parseFloat(lng) } : null;
}

// Clear saved location
export function clearSavedLocation() {
  localStorage.removeItem('savedLatitude');
  localStorage.removeItem('savedLongitude');
}