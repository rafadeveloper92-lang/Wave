export function dmRoomKey(chatId: string) {
  return `wave:public:dm:${chatId}`;
}

/** Sala canónica para DM: mesma chave para ambos os utilizadores. */
export function dmRoomKeyForPair(userIdA: string, userIdB: string) {
  const [x, y] = [userIdA, userIdB].sort();
  return `wave:public:dm:${x}:${y}`;
}

export function groupRoomKey(groupId: string) {
  return `wave:public:group:${groupId}`;
}

export function safeStorageSegment(key: string) {
  return key.replace(/[^a-zA-Z0-9_-]/g, '_');
}
