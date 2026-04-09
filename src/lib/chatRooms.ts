export function dmRoomKey(chatId: string) {
  return `wave:public:dm:${chatId}`;
}

export function groupRoomKey(groupId: string) {
  return `wave:public:group:${groupId}`;
}

export function safeStorageSegment(key: string) {
  return key.replace(/[^a-zA-Z0-9_-]/g, '_');
}
