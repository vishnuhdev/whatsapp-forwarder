const express = require('express');
const { Server } = require('socket.io');
const http = require('http');
const cors = require('cors');
const path = require('path');

// Import services and config
const whatsappService = require('./services/whatsappService');
const slackService = require('./services/slackService');
const config = require('./config/config');
const apiRoutes = require('./routes/api');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api', apiRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('🔌 Client connected');

    // Send current status to new client
    if (whatsappService.isClientReady()) {
        const chats = whatsappService.getChats();
        socket.emit('ready', { chats });
    }

    // Send current selected chats
    socket.emit('selectedChats', Array.from(config.getSelectedChats()));

    // Handle chat selection
    socket.on('selectChat', (chatId) => {
        try {
            config.addSelectedChat(chatId);
            io.emit('selectedChats', Array.from(config.getSelectedChats()));
            console.log(`✅ Chat selected: ${chatId}`);
        } catch (error) {
            console.error('❌ Error selecting chat:', error);
            socket.emit('error', 'Failed to select chat');
        }
    });

    // Handle chat deselection
    socket.on('deselectChat', (chatId) => {
        try {
            config.removeSelectedChat(chatId);
            io.emit('selectedChats', Array.from(config.getSelectedChats()));
            console.log(`❌ Chat deselected: ${chatId}`);
        } catch (error) {
            console.error('❌ Error deselecting chat:', error);
            socket.emit('error', 'Failed to deselect chat');
        }
    });

    socket.on('disconnect', () => {
        console.log('🔌 Client disconnected');
    });
});

// WhatsApp event handlers
whatsappService.on('qr', (qr) => {
    console.log('📱 QR Code received');
    io.emit('qr', qr);
});

whatsappService.on('ready', (data) => {
    console.log('✅ WhatsApp service ready');
    io.emit('ready', data);
});

whatsappService.on('message', async (msg) => {
    const selectedChats = config.getSelectedChats();

    // Only forward messages from selected chats
    if (selectedChats.has(msg.from)) {
        console.log(`📩 Processing message from ${msg.from}`);

        try {
            // Get message details
            const messageDetails = await whatsappService.getMessageDetails(msg);

            // Send to Slack
            const success = await slackService.sendMessage(messageDetails);

            if (success) {
                // Notify frontend
                io.emit('messageForwarded', {
                    from: msg.from,
                    body: msg.body,
                    senderName: messageDetails.senderName,
                    timestamp: messageDetails.timestamp,
                    success: true
                });
            } else {
                io.emit('messageForwarded', {
                    from: msg.from,
                    body: msg.body,
                    senderName: messageDetails.senderName,
                    timestamp: messageDetails.timestamp,
                    success: false,
                    error: 'Failed to send to Slack'
                });
            }
        } catch (error) {
            console.error('❌ Error processing message:', error);
            io.emit('messageForwarded', {
                from: msg.from,
                body: msg.body,
                timestamp: new Date(),
                success: false,
                error: error.message
            });
        }
    }
});

whatsappService.on('disconnected', (reason) => {
    console.log('❌ WhatsApp disconnected:', reason);
    io.emit('whatsappDisconnected', { reason });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        message: 'The requested resource was not found'
    });
});

// Start server
const PORT = config.getServerPort();
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Selected chats: ${config.getSelectedChats().size}`);
    console.log(`🔗 Slack webhook configured: ${!!config.getSlackWebhookUrl()}`);
});