/** Chave de sala para mensagens públicas demo (RLS: wave:public:%). */
export function dmRoomKey(chatId: string) {
  return `wave:public:dm:${chatId}`;
}

export function groupRoomKey(groupId: string) {
  return `wave:public:group:${groupId}`;
}
