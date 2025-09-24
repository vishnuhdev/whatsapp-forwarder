# Installation Guide

## System Requirements

- **Node.js**: Version 16.0.0 or higher
- **RAM**: Minimum 512MB available
- **Storage**: At least 100MB free space
- **Network**: Stable internet connection for WhatsApp Web
- **Browser**: Chrome/Chromium (installed automatically with Puppeteer)

## Step-by-Step Installation

### 1. Download and Setup

```bash
# Clone or download the project
git clone <your-repository-url>
cd whatsapp-slack-forwarder

# Install dependencies
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory (optional):

```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
PORT=3000
NODE_ENV=production
```

### 3. Slack Webhook Setup

1. Go to [Slack API](https://api.slack.com/apps)
2. Create a new app for your workspace
3. Add "Incoming Webhooks" feature
4. Create a webhook for your desired channel
5. Copy the webhook URL

### 4. First Run

```bash
# Start the application
npm start
```

The server will:
- Start on http://localhost:3000
- Display a QR code in the console
- Launch a Chrome window for WhatsApp Web

### 5. WhatsApp Connection

1. Open your web browser and go to http://localhost:3000
2. Scan the QR code using WhatsApp on your phone:
   - Open WhatsApp on your phone
   - Go to Menu > WhatsApp Web
   - Scan the QR code displayed in the browser
3. Wait for the contacts and groups to load

### 6. Select Chats

- Browse through your contacts and groups
- Click on any contact/group to start monitoring
- Selected chats will be highlighted
- Your selections are automatically saved

## Verification

To verify everything is working:

1. Send a test message from a selected contact
2. Check your Slack channel for the forwarded message
3. The web interface should show the message in "Recent Messages"

## Troubleshooting Installation

### Node.js Issues

```bash
# Check Node.js version
node --version

# Should be 16.0.0 or higher
# If not, download from https://nodejs.org
```

### Permission Issues

```bash
# On Linux/Mac, you might need to use sudo
sudo npm install

# Or fix npm permissions
npm config set prefix ~/.local
```

### Puppeteer Installation Issues

```bash
# If Puppeteer fails to install
npm install puppeteer --unsafe-perm=true --allow-root

# Or skip Chromium download and use system Chrome
npm install puppeteer-core
```

### Port Already in Use

```bash
# Check what's using port 3000
lsof -i :3000

# Or use a different port
PORT=3001 npm start
```

## Running as a Service

### Using PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start src/server.js --name whatsapp-forwarder

# Save PM2 configuration
pm2 save

# Setup auto-start on boot
pm2 startup
```

### Using systemd (Linux)

Create `/etc/systemd/system/whatsapp-forwarder.service`:

```ini
[Unit]
Description=WhatsApp Slack Forwarder
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/whatsapp-slack-forwarder
ExecStart=/usr/bin/node src/server.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable whatsapp-forwarder
sudo systemctl start whatsapp-forwarder
```

## Security Recommendations

1. **Firewall**: Only allow necessary ports (3000)
2. **Updates**: Keep Node.js and dependencies updated
3. **Environment**: Use environment variables for sensitive data
4. **Access**: Limit access to the web interface
5. **Monitoring**: Set up log monitoring and alerts

## Next Steps

After successful installation:

1. Read the [Usage Guide](USAGE.md)
2. Configure your monitoring preferences
3. Set up log rotation
4. Consider implementing backups for config.json
5. Monitor resource usage and performance