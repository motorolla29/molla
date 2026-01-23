# Molla Socket.IO Server

Real-time chat server using Socket.IO for the Molla marketplace.

## Features
- User authentication via JWT
- Real-time messaging
- User presence tracking
- Chat room management
- Message delivery status

## Environment Variables
```
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your-jwt-secret
CORS_ORIGIN=https://your-frontend.vercel.app
PORT=4001
```

## Deployment on Railway

1. Create new GitHub repository
2. Push this code to the repository
3. Connect repository to Railway
4. Set environment variables
5. Deploy

Railway will automatically detect Node.js and deploy the server.

## API

### Socket Events

#### Client → Server
- `join_chat` - Join a chat room
- `leave_chat` - Leave a chat room
- `send_message` - Send a message
- `typing` - User is typing
- `stop_typing` - User stopped typing

#### Server → Client
- `user_online` - User came online
- `user_offline` - User went offline
- `presence_snapshot` - Current online users
- `new_message` - New message received
- `message_status_update` - Message status changed
- `typing` - User typing in chat
- `stop_typing` - User stopped typing
- `unread_update` - Unread message count changed

## Development
```bash
npm install
npm start
```