const STORAGE_KEY = 'wave_local_user_id';

function randomId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `u_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

export function getLocalUserId(): string {
  try {
    let id = sessionStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = randomId();
      sessionStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return randomId();
  }
}
