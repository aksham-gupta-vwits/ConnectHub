# ConnectHub Channel API Documentation

## Overview
The ConnectHub platform uses a unified channel-based architecture where all conversations (public channels, private channels, direct messages, and group chats) are represented as Channel records with different types.

## Channel Types

- **PUBLIC**: Open channels anyone in the NSC can join
- **PRIVATE**: Invite-only channels  
- **DIRECT**: 1:1 conversations between two users
- **GROUP**: Small group chats (2-20 members)

## Endpoints

### 1. Get All Channels for NSC
```
GET /api/channels/:nscId
```

**Query Parameters:**
- `type` (optional): Filter by channel type (`PUBLIC`, `PRIVATE`, `DIRECT`, `GROUP`)

**Response:**
```json
{
  "channels": [
    {
      "id": "channel_id",
      "name": "channel_name",
      "description": "channel_description", 
      "type": "PUBLIC",
      "createdAt": "2023-01-01T00:00:00Z",
      "memberCount": 5,
      "messageCount": 42,
      "members": [...],
      "isMember": true,
      "unreadCount": 0
    }
  ]
}
```

### 2. Get Direct Message Conversations
```
GET /api/channels/:nscId/direct
```

**Response:**
```json
{
  "conversations": [
    {
      "id": "channel_id",
      "type": "DIRECT",
      "user": {
        "id": "user_id",
        "username": "john_doe",
        "firstName": "John",
        "lastName": "Doe",
        "isOnline": false
      },
      "lastMessage": {
        "content": "Last message text",
        "senderId": "sender_id",
        "senderName": "Sender Name",
        "createdAt": "2023-01-01T00:00:00Z"
      },
      "messageCount": 15,
      "unreadCount": 0,
      "updatedAt": "2023-01-01T00:00:00Z"
    }
  ]
}
```

### 3. Create or Get Direct Message Channel
```
POST /api/channels/:nscId/direct/:targetUserId
```

**Response:**
```json
{
  "channel": {
    "id": "channel_id",
    "name": null,
    "type": "DIRECT",
    "createdAt": "2023-01-01T00:00:00Z",
    "members": [...]
  }
}
```

### 4. Create Group Channel
```
POST /api/channels/:nscId/group
```

**Request Body:**
```json
{
  "name": "My Group Chat", // optional
  "description": "Group description", // optional
  "memberIds": ["user1_id", "user2_id", "user3_id"] // required, 1-19 members (creator is added automatically)
}
```

**Response:**
```json
{
  "message": "Group channel created successfully",
  "channel": {
    "id": "channel_id",
    "name": "My Group Chat",
    "description": "Group description",
    "type": "GROUP",
    "createdAt": "2023-01-01T00:00:00Z",
    "memberCount": 4,
    "members": [...]
  }
}
```

### 5. Create Public/Private Channel
```
POST /api/channels/:nscId
```

**Request Body:**
```json
{
  "name": "channel-name", // required, alphanumeric + underscores/hyphens
  "description": "Channel description", // optional
  "type": "PUBLIC", // or "PRIVATE"
  "memberIds": ["user1_id", "user2_id"] // optional, for GROUP type only
}
```

**Response:**
```json
{
  "message": "Channel created successfully",
  "channel": {
    "id": "channel_id",
    "name": "channel-name",
    "description": "Channel description",
    "type": "PUBLIC",
    "createdAt": "2023-01-01T00:00:00Z"
  }
}
```

### 6. Get Channel Details
```
GET /api/channels/:nscId/:channelId
```

**Response:**
```json
{
  "channel": {
    "id": "channel_id",
    "name": "channel_name",
    "description": "channel_description",
    "type": "PUBLIC",
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z",
    "messageCount": 42,
    "members": [...],
    "isMember": true
  }
}
```

### 7. Join Channel
```
POST /api/channels/:nscId/:channelId/join
```

**Notes:**
- Only works for PUBLIC channels
- Private channels require invitation
- Cannot join DIRECT or GROUP channels

### 8. Leave Channel
```
POST /api/channels/:nscId/:channelId/leave
```

**Notes:**
- Cannot leave 'general' channel
- Cannot leave DIRECT channels (use archive instead)
- For GROUP channels, user is removed from members

### 9. Archive Direct Message
```
POST /api/channels/:nscId/:channelId/archive
```

**Notes:**
- Only works for DIRECT channels
- Removes the user's membership (hides the DM for this user)
- Other user still sees the conversation

### 10. Add Member to Channel
```
POST /api/channels/:nscId/:channelId/members
```

**Request Body:**
```json
{
  "userId": "user_id"
}
```

**Notes:**
- Cannot add members to DIRECT channels
- Requires admin permissions or channel creator

### 11. Update Channel
```
PUT /api/channels/:nscId/:channelId
```

**Request Body:**
```json
{
  "name": "new-channel-name", // optional
  "description": "New description" // optional
}
```

### 12. Delete Channel
```
DELETE /api/channels/:nscId/:channelId
```

**Notes:**
- Admin only
- Cannot delete 'general' channel
- Soft delete (sets isActive to false)

## Message Endpoints

All message endpoints work with the unified channel system. Replace `:channelId` with any channel ID (PUBLIC, PRIVATE, DIRECT, or GROUP).

### Get Messages
```
GET /api/messages/:nscId/:channelId
```

### Send Message
```
POST /api/messages/:nscId/:channelId
```

### Update Message
```
PUT /api/messages/:nscId/:channelId/:messageId
```

### Delete Message
```
DELETE /api/messages/:nscId/:channelId/:messageId
```

## Authentication

All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Permissions

- **PUBLIC channels**: Anyone in the NSC can view and join
- **PRIVATE channels**: Invite-only, requires membership to view
- **DIRECT channels**: Only the two participants can access
- **GROUP channels**: Only members can access

## Error Responses

Standard HTTP status codes are used:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (duplicate names, etc.)
- `500`: Internal Server Error

## Migration Notes

If migrating from the old conversation-based system:

1. Run the schema migration: `npm run db:migrate`
2. Run the data migration: `npm run db:migrate-conversations`
3. Seed default channels: `npm run db:seed-channels`

The migration script will:
- Convert existing Conversation records to DIRECT Channel records
- Migrate conversation members to channel members
- Update message references from conversationId to channelId
