const BLOCKED_KEY = 'wave_blocked_users_v2';
const PINNED_KEY = 'wave_pinned_chat_ids';

export type BlockedUser = { id: string; name: string };

function readBlocked(): BlockedUser[] {
  try {
    const raw = localStorage.getItem(BLOCKED_KEY);
    if (!raw) return [];
    const p = JSON.parse(raw) as unknown;
    if (!Array.isArray(p)) return [];
    return p
      .filter((x): x is BlockedUser => x && typeof x === 'object' && typeof (x as BlockedUser).id === 'string')
      .map((x) => ({ id: x.id, name: typeof x.name === 'string' ? x.name : 'Utilizador' }));
  } catch {
    return [];
  }
}

function writeBlocked(users: BlockedUser[]) {
  localStorage.setItem(BLOCKED_KEY, JSON.stringify(users));
}

export function getBlockedUsers(): BlockedUser[] {
  return readBlocked();
}

export function getBlockedUserIds(): Set<string> {
  return new Set(readBlocked().map((b) => b.id));
}

export function isUserBlocked(userId: string | undefined | null): boolean {
  if (!userId) return false;
  return getBlockedUserIds().has(userId);
}

export function blockUser(userId: string, displayName: string) {
  const list = readBlocked().filter((b) => b.id !== userId);
  list.push({ id: userId, name: displayName });
  writeBlocked(list);
  window.dispatchEvent(new CustomEvent('wave-blocklist-changed'));
}

export function unblockUser(userId: string) {
  writeBlocked(readBlocked().filter((b) => b.id !== userId));
  window.dispatchEvent(new CustomEvent('wave-blocklist-changed'));
}

function readPinnedIds(): string[] {
  try {
    const raw = localStorage.getItem(PINNED_KEY);
    if (!raw) return [];
    const p = JSON.parse(raw) as unknown;
    return Array.isArray(p) ? p.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function writePinnedIds(ids: string[]) {
  localStorage.setItem(PINNED_KEY, JSON.stringify(ids));
}

export function getPinnedChatIds(): string[] {
  return readPinnedIds();
}

export function isChatPinned(chatId: string): boolean {
  return readPinnedIds().includes(chatId);
}

export function togglePinChat(chatId: string): boolean {
  const list = readPinnedIds();
  const i = list.indexOf(chatId);
  let pinned: boolean;
  if (i >= 0) {
    list.splice(i, 1);
    pinned = false;
  } else {
    list.unshift(chatId);
    pinned = true;
  }
  writePinnedIds(list);
  window.dispatchEvent(new CustomEvent('wave-pins-changed'));
  return pinned;
}

export function sortChatsWithPins<T extends { id: string }>(chats: T[]): T[] {
  const order = readPinnedIds();
  const pinned = order.map((id) => chats.find((c) => c.id === id)).filter(Boolean) as T[];
  const pinnedSet = new Set(order);
  const rest = chats.filter((c) => !pinnedSet.has(c.id));
  return [...pinned, ...rest];
}
