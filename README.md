# WhatsApp to Slack Forwarder

A professional Node.js application that forwards WhatsApp messages to Slack with a clean web interface for managing which contacts and groups to monitor.

## ✨ Features

- 🌐 **Web Interface**: Modern, responsive UI to view and manage WhatsApp contacts/groups
- 🔄 **Real-time Updates**: Live message forwarding with WebSocket communication
- 💾 **Persistent Configuration**: Settings are automatically saved and restored
- 🔍 **Search & Filter**: Easily find specific contacts or groups
- 📱 **Group Support**: Handle both individual contacts and group chats
- 🎨 **Rich Slack Messages**: Well-formatted messages with sender details and timestamps
- 🔐 **Session Management**: WhatsApp sessions are saved locally for seamless reconnection

## 🏗️ Project Structure

```
whatsapp-slack-forwarder/
├── src/
│   ├── config/
│   │   └── config.js          # Configuration management
│   ├── routes/
│   │   └── api.js             # API endpoints
│   ├── services/
│   │   ├── whatsappService.js # WhatsApp client management
│   │   └── slackService.js    # Slack integration
│   └── server.js              # Main server file
├── public/
│   └── index.html             # Web interface
├── docs/
├── logs/
├── config.json                # Runtime configuration (auto-generated)
├── package.json
├── .gitignore
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A Slack webhook URL
- WhatsApp account

### Installation

1. **Clone or download the project**
   ```bash
   git clone <repository-url>
   cd whatsapp-slack-forwarder
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure your Slack webhook URL**
   ```bash
   # Copy the example environment file
   cp .env.example .env

   # Edit .env and add your Slack webhook URL
   # SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
   ```

   To get your webhook URL:
   - Go to [Slack API](https://api.slack.com/apps)
   - Create a new app → Incoming Webhooks
   - Copy the webhook URL to your `.env` file

4. **Start the application**
   ```bash
   npm start
   ```

5. **Open the web interface**
   - Navigate to `http://localhost:3000`
   - Scan the QR code with your WhatsApp mobile app
   - Select contacts/groups to monitor

## 📱 Usage

### First Time Setup

1. **Start the server** and open the web interface
2. **Scan QR Code** with your WhatsApp mobile app when prompted
3. **Wait for sync** - the app will load all your contacts and groups
4. **Select chats** you want to monitor by clicking on them in the web interface
5. **Done!** Messages from selected chats will now be forwarded to Slack

### Managing Selections

- **Select**: Click on any contact or group to add it to monitoring
- **Deselect**: Click on selected items again to remove them
- **Search**: Use the search box to quickly find specific contacts
- **Persistent**: Your selections are automatically saved and restored

### Message Format

Messages sent to Slack include:
- **Sender Name**: Contact name or group name with individual sender
- **Phone Number**: Clean format without technical suffixes
- **Message Content**: Full message text
- **Timestamp**: When the message was received

## 🔧 Configuration

The application supports configuration through:

### Environment Variables
```bash
SLACK_WEBHOOK_URL=your_webhook_url_here
PORT=3000
NODE_ENV=production
```

### Configuration File
The `config.json` file is automatically created and maintained:
```json
{
  "selectedChats": ["1234567890-123456@g.us"],
  "slackWebhookUrl": "https://hooks.slack.com/...",
  "serverPort": 3000,
  "lastUpdated": "2024-01-01T00:00:00.000Z"
}
```

## 🛠️ API Endpoints

The application provides a REST API for programmatic access:

### GET `/api/health`
Check application status
```json
{
  "status": "healthy",
  "whatsappReady": true,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "selectedChats": 5
}
```

### GET `/api/chats`
Get all available WhatsApp chats
```json
[
  {
    "id": "1234567890@c.us",
    "name": "John Doe",
    "isGroup": false,
    "unreadCount": 0
  }
]
```

### GET `/api/selected`
Get currently selected chats
```json
{
  "selectedChats": ["1234567890@c.us"],
  "count": 1
}
```

### POST `/api/select`
Select a chat for monitoring
```json
{
  "chatId": "1234567890@c.us"
}
```

### POST `/api/deselect`
Remove a chat from monitoring
```json
{
  "chatId": "1234567890@c.us"
}
```

## 🔒 Security Considerations

- **Local Sessions**: WhatsApp sessions are stored locally using `LocalAuth`
- **No Cloud Storage**: All data remains on your server
- **Environment Variables**: Sensitive URLs should be stored as environment variables
- **Network Access**: The application only connects to WhatsApp Web and your Slack webhook

## 🐛 Troubleshooting

### Common Issues

**WhatsApp not connecting:**
- Clear browser data and restart
- Check if WhatsApp Web works in your browser
- Ensure you have a stable internet connection

**Messages not forwarding:**
- Verify your Slack webhook URL is correct
- Check the console logs for error messages
- Ensure selected chats are properly saved

**QR code not appearing:**
- Wait a few seconds for initialization
- Refresh the web page
- Check browser console for errors

### Development Mode

For development with auto-reload:
```bash
npm install -g nodemon  # If not already installed
npm run dev
```

### Logs

Application logs are displayed in the console and include:
- ✅ Success messages (green)
- ❌ Error messages (red)
- 📱 WhatsApp events
- 💾 Configuration changes
- 🔌 Client connections

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Disclaimer

This tool is for personal/educational use. Please respect WhatsApp's Terms of Service and your organization's policies when using automated message forwarding.

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the console logs for error messages
3. Ensure all dependencies are correctly installed
4. Verify your Slack webhook configuration

---

**Made with ❤️ for seamless WhatsApp to Slack integration**