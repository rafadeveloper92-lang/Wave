export interface User {
  id: string;
  name: string;
  avatar: string;
  status?: string;
  isOnline?: boolean;
}

export interface Chat {
  id: string;
  user: User;
  lastMessage: string;
  time: string;
  unreadCount: number;
}

export interface Post {
  id: string;
  user: User;
  content: string;
  image?: string;
  video?: string;
  likes: number;
  comments: number;
  time: string;
  type: 'image' | 'video' | 'text';
}

export interface Group {
  id: string;
  name: string;
  description: string;
  avatar: string;
  memberCount: number;
  members: User[];
}

export interface Event {
  id: string;
  title: string;
  image: string;
  date: string;
}
