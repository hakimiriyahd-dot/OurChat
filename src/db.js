import Dexie from 'dexie'

export const db = new Dexie('OurChatLocal')

db.version(1).stores({
  profiles: 'id, username, phone',
  contacts: '[owner_id+contact_id], owner_id, contact_id',
  blocked_users: '[blocker_id+blocked_id]',
  chats: 'id, is_group, last_message_at',
  chat_members: '[chat_id+user_id], chat_id, user_id, is_archived, is_pinned',
  chat_settings: 'chat_id',
  group_invite_links: 'id, chat_id, invite_code',
  messages: 'id, chat_id, sender_id, created_at, reply_to_id, pending_sync',
  message_media: 'id, message_id',
  message_status: '[message_id+user_id], message_id, user_id, status',
  message_reactions: '[message_id+user_id+emoji], message_id, user_id',
  message_deletes_for_user: '[message_id+user_id], message_id, user_id',
  pinned_messages: '[chat_id+message_id], chat_id',
  starred_messages: '[message_id+user_id], user_id',
  message_reports: 'id, message_id, reporter_id',
  statuses: 'id, user_id, expires_at',
  status_views: '[status_id+viewer_id], status_id',
  calls: 'id, caller_id, receiver_id, created_at',
  user_devices: 'id, user_id',
  chat_assignments: 'chat_id, assigned_to',
  user_chat_preferences: '[user_id+chat_id], user_id, chat_id',
  chat_activity: '[chat_id+user_id], chat_id, updated_at'
})

export default db
