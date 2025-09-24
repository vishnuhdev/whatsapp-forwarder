const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const EventEmitter = require('events');

class WhatsAppService extends EventEmitter {
    constructor() {
        super();
        this.client = null;
        this.isReady = false;
        this.chats = [];
        this.initialize();
    }

    initialize() {
        // Determine if running in production environment
        const isProduction = process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT;

        // Puppeteer configuration for production deployment
        const puppeteerConfig = {
            headless: isProduction ? 'new' : false,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--run-all-compositor-stages-before-draw',
                '--disable-background-timer-throttling',
                '--disable-renderer-backgrounding',
                '--disable-backgrounding-occluded-windows',
                '--disable-ipc-flooding-protection',
                '--virtual-time-budget=5000'
            ]
        };

        // Use system Chrome in production
        if (isProduction) {
            puppeteerConfig.executablePath = '/usr/bin/google-chrome-stable';
        }

        console.log(`🔧 Initializing WhatsApp client - Production: ${isProduction}, Headless: ${puppeteerConfig.headless}`);

        this.client = new Client({
            authStrategy: new LocalAuth(),
            puppeteer: puppeteerConfig
        });

        this.setupEventHandlers();
        this.client.initialize();
    }

    setupEventHandlers() {
        this.client.on('qr', (qr) => {
            console.log('📱 QR Code received, scan please!');
            qrcode.generate(qr, { small: true });
            this.emit('qr', qr);
        });

        this.client.on('ready', async () => {
            console.log('✅ WhatsApp client is ready!');
            this.isReady = true;
            await this.loadChats();
            this.emit('ready', { chats: this.chats });
        });

        this.client.on('message', async (msg) => {
            this.emit('message', msg);
        });

        this.client.on('disconnected', (reason) => {
            console.log('❌ WhatsApp client disconnected:', reason);
            this.isReady = false;
            this.emit('disconnected', reason);
        });
    }

    async loadChats() {
        try {
            const chats = await this.client.getChats();
            this.chats = chats.map(chat => ({
                id: chat.id._serialized,
                name: chat.name || 'Unknown',
                isGroup: chat.isGroup,
                unreadCount: chat.unreadCount,
                lastMessage: chat.lastMessage ? {
                    body: chat.lastMessage.body,
                    timestamp: chat.lastMessage.timestamp
                } : null
            }));

            console.log(`📱 Loaded ${this.chats.length} chats`);
            return this.chats;
        } catch (error) {
            console.error('❌ Error loading chats:', error);
            this.chats = [];
            return [];
        }
    }

    async getMessageDetails(msg) {
        try {
            const chat = await msg.getChat();
            const contact = await msg.getContact();

            let senderName = 'Unknown';
            let senderNumber = msg.from;

            // Format sender info based on chat type
            if (chat.isGroup) {
                senderName = `${chat.name} (Group)`;
                if (msg.author) {
                    try {
                        const authorContact = await this.client.getContactById(msg.author);
                        senderName += `\n👤 From: ${authorContact.pushname || authorContact.name || msg.author}`;
                    } catch (err) {
                        senderName += `\n👤 From: ${msg.author}`;
                    }
                }
            } else {
                senderName = contact.pushname || contact.name || 'Unknown Contact';
            }

            // Clean up phone number display
            senderNumber = msg.from.replace('@c.us', '').replace('@g.us', '');

            return {
                senderName,
                senderNumber,
                message: msg.body,
                timestamp: new Date(msg.timestamp * 1000),
                isGroup: chat.isGroup,
                chatName: chat.name
            };
        } catch (error) {
            console.error('❌ Error getting message details:', error);
            return {
                senderName: 'Unknown',
                senderNumber: msg.from.replace('@c.us', '').replace('@g.us', ''),
                message: msg.body,
                timestamp: new Date(),
                isGroup: false,
                chatName: 'Unknown'
            };
        }
    }

    getChats() {
        return this.chats;
    }

    isClientReady() {
        return this.isReady;
    }

    async refreshChats() {
        if (this.isReady) {
            return await this.loadChats();
        }
        return [];
    }
}

module.exports = new WhatsAppService();