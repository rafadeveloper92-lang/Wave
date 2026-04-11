/** Persistência local (demo) para lista de chats, estados e perfil até haver backend. */

const CHATS_KEY = 'wave-chat-list-v1';
const MY_STATUSES_KEY = 'wave-my-statuses-v1';
const PROFILE_KEY = 'wave-profile-v1';

export type PersistedChat = {
  id: string;
  peerUserId?: string;
  name: string;
  avatar: string;
  message: string;
  time: string;
  unread: number;
  online?: boolean;
};

export type PersistedStatusItem = {
  id: string;
  image: string;
  overlays: unknown[];
  time: string;
};

export type PersistedProfile = {
  profilePic: string;
  coverPhoto: string;
  displayName: string;
  /** URLs (object URLs ou https) dos teus posts no grid */
  posts: string[];
};

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadChatList(): PersistedChat[] {
  if (typeof localStorage === 'undefined') return [];
  return safeParse<PersistedChat[]>(localStorage.getItem(CHATS_KEY), []);
}

export function saveChatList(chats: PersistedChat[]): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
}

export function loadMyStatuses(): PersistedStatusItem[] {
  if (typeof localStorage === 'undefined') return [];
  return safeParse<PersistedStatusItem[]>(localStorage.getItem(MY_STATUSES_KEY), []);
}

export function saveMyStatuses(items: PersistedStatusItem[]): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(MY_STATUSES_KEY, JSON.stringify(items));
}

const defaultProfile: PersistedProfile = {
  profilePic: 'https://i.pravatar.cc/300?u=wave-user',
  coverPhoto: 'https://picsum.photos/seed/wave-cover/800/600',
  displayName: 'Tu',
  posts: [],
};

export function loadProfile(): PersistedProfile {
  if (typeof localStorage === 'undefined') return { ...defaultProfile };
  const p = safeParse<Partial<PersistedProfile> | null>(localStorage.getItem(PROFILE_KEY), null);
  if (!p) return { ...defaultProfile };
  const posts = Array.isArray(p.posts) ? p.posts.filter((x): x is string => typeof x === 'string') : [];
  return {
    profilePic: typeof p.profilePic === 'string' ? p.profilePic : defaultProfile.profilePic,
    coverPhoto: typeof p.coverPhoto === 'string' ? p.coverPhoto : defaultProfile.coverPhoto,
    displayName: typeof p.displayName === 'string' ? p.displayName : defaultProfile.displayName,
    posts,
  };
}

export function saveProfile(p: PersistedProfile): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
}
