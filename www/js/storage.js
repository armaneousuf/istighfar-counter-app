import { STORAGE_KEY, defaultState } from './constants.js';

const DB_NAME = 'IstighfarAppDB';
const STORE_NAME = 'stateStore';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
    };
  });
}

function hydrate(saved) {
  return {
    ...defaultState,
    ...saved,
    hapticsEnabled: saved.hapticsEnabled ?? true,
    reminderEnabled: saved.reminderEnabled ?? false,
    selectedDua: saved.selectedDua || '1',
    unlockedBadges: new Set(saved.unlockedBadges || []),
    dailyHistory: saved.dailyHistory || {}
  };
}

export async function loadState() {
  const db = await openDB();
  const state = await new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get('app_state');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  if (state) return hydrate(state);

  const legacy = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('ISTIGHFAR_APP_DATA_V4');
  if (!legacy) return hydrate({});
  const migrated = hydrate(JSON.parse(legacy));
  await saveState(migrated);
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('ISTIGHFAR_APP_DATA_V4');
  return migrated;
}

export async function saveState(state) {
  const db = await openDB();
  const stored = { ...state, unlockedBadges: Array.from(state.unlockedBadges) };
  await new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(stored, 'app_state');
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearState() {
  const db = await openDB();
  await new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete('app_state');
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('ISTIGHFAR_APP_DATA_V4');
}
