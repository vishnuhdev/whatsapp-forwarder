# API Documentation

The WhatsApp Slack Forwarder provides a RESTful API for programmatic interaction.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Currently, no authentication is required. In production, consider implementing API keys or JWT tokens.

## Endpoints

### Health Check

**GET** `/health`

Check the application status and WhatsApp connection.

**Response:**
```json
{
  "status": "healthy",
  "whatsappReady": true,
  "timestamp": "2024-01-01T12:00:00.000Z",
  "selectedChats": 5
}
```

**Status Codes:**
- `200`: Application is healthy
- `503`: Service unavailable (WhatsApp not connected)

---

### Get All Chats

**GET** `/chats`

Retrieve all available WhatsApp chats (contacts and groups).

**Response:**
```json
[
  {
    "id": "1234567890@c.us",
    "name": "John Doe",
    "isGroup": false,
    "unreadCount": 2,
    "lastMessage": {
      "body": "Hello!",
      "timestamp": 1640995200000
    }
  },
  {
    "id": "1234567890-123456@g.us",
    "name": "Family Group",
    "isGroup": true,
    "unreadCount": 0,
    "lastMessage": null
  }
]
```

**Status Codes:**
- `200`: Success
- `503`: WhatsApp client not ready
- `500`: Internal server error

---

### Get Selected Chats

**GET** `/selected`

Get the list of currently selected chats for monitoring.

**Response:**
```json
{
  "selectedChats": [
    "1234567890@c.us",
    "1234567890-123456@g.us"
  ],
  "count": 2
}
```

**Status Codes:**
- `200`: Success
- `500`: Internal server error

---

### Select Chat

**POST** `/select`

Add a chat to the monitoring list.

**Request Body:**
```json
{
  "chatId": "1234567890@c.us"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Chat selected successfully",
  "selectedChats": [
    "1234567890@c.us",
    "1234567890-123456@g.us"
  ],
  "count": 2
}
```

**Status Codes:**
- `200`: Success
- `400`: Bad request (missing chatId)
- `500`: Internal server error

---

### Deselect Chat

**POST** `/deselect`

Remove a chat from the monitoring list.

**Request Body:**
```json
{
  "chatId": "1234567890@c.us"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Chat deselected successfully",
  "selectedChats": [
    "1234567890-123456@g.us"
  ],
  "count": 1
}
```

**Status Codes:**
- `200`: Success
- `400`: Bad request (missing chatId)
- `500`: Internal server error

---

### Get Configuration

**GET** `/config`

Get current application configuration (non-sensitive data only).

**Response:**
```json
{
  "selectedChatsCount": 5,
  "serverPort": 3000,
  "hasSlackWebhook": true
}
```

**Status Codes:**
- `200`: Success
- `500`: Internal server error

## WebSocket Events

The application also supports real-time communication via WebSocket.

### Client → Server Events

| Event | Data | Description |
|-------|------|-------------|
| `selectChat` | `chatId: string` | Select a chat for monitoring |
| `deselectChat` | `chatId: string` | Deselect a chat |

### Server → Client Events

| Event | Data | Description |
|-------|------|-------------|
| `qr` | `qr: string` | QR code for WhatsApp authentication |
| `ready` | `{chats: Chat[]}` | WhatsApp client is ready with chat list |
| `selectedChats` | `chatIds: string[]` | Updated list of selected chats |
| `messageForwarded` | `MessageData` | A message was forwarded to Slack |
| `whatsappDisconnected` | `{reason: string}` | WhatsApp client disconnected |
| `error` | `message: string` | An error occurred |

### MessageData Structure

```typescript
interface MessageData {
  from: string;           // Chat ID where message originated
  body: string;           // Message content
  senderName: string;     // Formatted sender name
  timestamp: Date;        // Message timestamp
  success: boolean;       // Whether forwarding succeeded
  error?: string;         // Error message if failed
}
```

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

Common error types:
- `Bad request`: Invalid request data
- `Not found`: Resource not found
- `Internal server error`: Server-side error
- `Service unavailable`: WhatsApp not connected

## Rate Limiting

Currently, no rate limiting is implemented. Consider adding rate limiting for production use:

```bash
npm install express-rate-limit
```

## Example Usage

### JavaScript/Node.js

```javascript
const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

// Get all chats
async function getChats() {
  try {
    const response = await axios.get(`${API_BASE}/chats`);
    return response.data;
  } catch (error) {
    console.error('Error fetching chats:', error.response.data);
  }
}

// Select a chat
async function selectChat(chatId) {
  try {
    const response = await axios.post(`${API_BASE}/select`, { chatId });
    console.log('Chat selected:', response.data);
  } catch (error) {
    console.error('Error selecting chat:', error.response.data);
  }
}
```

### Python

```python
import requests

API_BASE = "http://localhost:3000/api"

# Get health status
response = requests.get(f"{API_BASE}/health")
print(response.json())

# Select a chat
response = requests.post(f"{API_BASE}/select", json={"chatId": "1234567890@c.us"})
print(response.json())
```

### cURL

```bash
# Get all chats
curl -X GET http://localhost:3000/api/chats

# Select a chat
curl -X POST http://localhost:3000/api/select \
  -H "Content-Type: application/json" \
  -d '{"chatId": "1234567890@c.us"}'

# Get selected chats
curl -X GET http://localhost:3000/api/selected
```

## WebSocket Client Example

```javascript
const socket = io('http://localhost:3000');

// Listen for events
socket.on('ready', (data) => {
  console.log('WhatsApp ready with chats:', data.chats);
});

socket.on('messageForwarded', (data) => {
  console.log('Message forwarded:', data);
});

// Send events
socket.emit('selectChat', 'chatId123');
socket.emit('deselectChat', 'chatId123');
```