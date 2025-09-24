const fs = require('fs');
const path = require('path');

class ConfigManager {
    constructor() {
        this.configPath = path.join(__dirname, '../../config.json');
        this.config = this.loadConfig();
    }

    loadConfig() {
        try {
            if (fs.existsSync(this.configPath)) {
                const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
                console.log(`✅ Loaded configuration from ${this.configPath}`);
                return {
                    selectedChats: new Set(config.selectedChats || []),
                    slackWebhookUrl: config.slackWebhookUrl || process.env.SLACK_WEBHOOK_URL,
                    serverPort: config.serverPort || process.env.PORT || 3000,
                    lastUpdated: config.lastUpdated
                };
            } else {
                console.log('📄 No config file found, creating default configuration');
                return {
                    selectedChats: new Set(),
                    slackWebhookUrl: process.env.SLACK_WEBHOOK_URL || "",
                    serverPort: process.env.PORT || 3000,
                    lastUpdated: null
                };
            }
        } catch (error) {
            console.error('❌ Error loading config:', error);
            return {
                selectedChats: new Set(),
                slackWebhookUrl: process.env.SLACK_WEBHOOK_URL || "",
                serverPort: process.env.PORT || 3000,
                lastUpdated: null
            };
        }
    }

    saveConfig() {
        try {
            const configToSave = {
                selectedChats: Array.from(this.config.selectedChats),
                slackWebhookUrl: this.config.slackWebhookUrl,
                serverPort: this.config.serverPort,
                lastUpdated: new Date().toISOString()
            };

            fs.writeFileSync(this.configPath, JSON.stringify(configToSave, null, 2));
            console.log(`💾 Configuration saved successfully`);
        } catch (error) {
            console.error('❌ Error saving config:', error);
        }
    }

    getSelectedChats() {
        return this.config.selectedChats;
    }

    addSelectedChat(chatId) {
        this.config.selectedChats.add(chatId);
        this.saveConfig();
    }

    removeSelectedChat(chatId) {
        this.config.selectedChats.delete(chatId);
        this.saveConfig();
    }

    getSlackWebhookUrl() {
        return this.config.slackWebhookUrl;
    }

    getServerPort() {
        return this.config.serverPort;
    }

    updateSlackWebhook(url) {
        this.config.slackWebhookUrl = url;
        this.saveConfig();
    }
}

module.exports = new ConfigManager();