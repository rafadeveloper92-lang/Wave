/** Lista de chats e estados locais (até haver inbox no Supabase). */

const CHATS_KEY = 'wave-chat-list-v1';
const MY_STATUSES_KEY = 'wave-my-statuses-v1';
const PROFILE_KEY = 'wave-profile-v1';
const HIDDEN_CHATS_KEY = 'wave-hidden-chat-ids-v1';

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

export function loadHiddenChatIds(): Set<string> {
  if (typeof localStorage === 'undefined') return new Set();
  const arr = safeParse<unknown>(localStorage.getItem(HIDDEN_CHATS_KEY), []);
  if (!Array.isArray(arr)) return new Set();
  return new Set(arr.filter((x): x is string => typeof x === 'string'));
}

export function saveHiddenChatIds(ids: Set<string>): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(HIDDEN_CHATS_KEY, JSON.stringify([...ids]));
}
