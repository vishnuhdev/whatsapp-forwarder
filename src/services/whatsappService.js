const { Client, LocalAuth } = require('whatsapp-web.js');
const path = require('path');
const qrcode = require('qrcode-terminal');
const EventEmitter = require('events');

class WhatsAppService extends EventEmitter {
    constructor() {
        super();
        this.client = null;
        this.isReady = false;
        this.chats = [];
        // Don't auto-initialize, let server control when to start
    }

    initialize() {
        // Determine if running in production environment
        const isProduction = process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT || !process.env.DISPLAY;

        // Puppeteer configuration for production deployment
        const puppeteerConfig = {
            headless: isProduction ? 'new' : false,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--no-first-run',
                '--no-zygote',
                '--disable-extensions',
                '--disable-default-apps',
                '--disable-background-timer-throttling',
                '--disable-renderer-backgrounding',
                '--disable-backgrounding-occluded-windows',
                '--disable-ipc-flooding-protection',
                '--disable-hang-monitor',
                '--disable-popup-blocking',
                '--disable-prompt-on-repost',
                '--disable-sync',
                '--disable-translate',
                '--metrics-recording-only',
                '--no-crash-upload',
                '--disable-background-networking',
                '--disable-default-apps',
                '--disable-domain-reliability',
                '--disable-component-update',
                '--disable-client-side-phishing-detection',
                '--disable-features=TranslateUI',
                '--disable-features=BlinkGenPropertyTrees',
                '--run-all-compositor-stages-before-draw',
                '--memory-pressure-off'
            ]
        };

        // Force headless mode if no display available
        if (!process.env.DISPLAY && isProduction) {
            puppeteerConfig.headless = 'new';
            puppeteerConfig.args.push('--headless');
        }

        // Use system Chrome in production
        if (isProduction) {
            puppeteerConfig.executablePath = process.env.CHROME_BIN || '/usr/bin/google-chrome-stable';
        }

        console.log(`🔧 Initializing WhatsApp client`);
        console.log(`   Production: ${isProduction}`);
        console.log(`   Headless: ${puppeteerConfig.headless}`);
        console.log(`   Chrome Path: ${puppeteerConfig.executablePath || 'default'}`);
        console.log(`   Display: ${process.env.DISPLAY || 'none'}`);

        try {
            // Use Railway volume path if available, otherwise use default
            const dataPath = process.env.RAILWAY_VOLUME_MOUNT_PATH
                ? path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, '.wwebjs_auth')
                : '.wwebjs_auth';

            console.log(`📁 Using session data path: ${dataPath}`);

            this.client = new Client({
                authStrategy: new LocalAuth({
                    dataPath: dataPath
                }),
                puppeteer: puppeteerConfig
            });

            this.setupEventHandlers();

            // Initialize with timeout and retry logic
            this.initializeWithRetry();
        } catch (error) {
            console.error('❌ Failed to initialize WhatsApp client:', error);
            this.emit('error', error);
        }
    }

    async initializeWithRetry(maxRetries = 3, retryDelay = 5000) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔄 WhatsApp initialization attempt ${attempt}/${maxRetries}`);
                await this.client.initialize();
                console.log('✅ WhatsApp client initialized successfully');
                return;
            } catch (error) {
                console.error(`❌ Initialization attempt ${attempt} failed:`, error.message);

                if (attempt === maxRetries) {
                    console.error('❌ All WhatsApp initialization attempts failed');
                    this.emit('error', error);
                    return;
                }

                console.log(`⏳ Waiting ${retryDelay/1000}s before retry...`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }
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