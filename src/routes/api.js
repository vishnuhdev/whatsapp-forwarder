const express = require('express');
const router = express.Router();
const whatsappService = require('../services/whatsappService');
const config = require('../config/config');

// Get all chats
router.get('/chats', async (req, res) => {
    try {
        if (whatsappService.isClientReady()) {
            const chats = await whatsappService.refreshChats();
            res.json(chats);
        } else {
            res.status(503).json({
                error: 'WhatsApp client not ready',
                message: 'Please wait for WhatsApp to connect'
            });
        }
    } catch (error) {
        console.error('❌ Error getting chats:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// Get selected chats
router.get('/selected', (req, res) => {
    try {
        const selectedChats = Array.from(config.getSelectedChats());
        res.json({
            selectedChats,
            count: selectedChats.length
        });
    } catch (error) {
        console.error('❌ Error getting selected chats:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// Select a chat
router.post('/select', (req, res) => {
    try {
        const { chatId } = req.body;

        if (!chatId) {
            return res.status(400).json({
                error: 'Bad request',
                message: 'chatId is required'
            });
        }

        config.addSelectedChat(chatId);
        const selectedChats = Array.from(config.getSelectedChats());

        res.json({
            success: true,
            message: 'Chat selected successfully',
            selectedChats,
            count: selectedChats.length
        });
    } catch (error) {
        console.error('❌ Error selecting chat:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// Deselect a chat
router.post('/deselect', (req, res) => {
    try {
        const { chatId } = req.body;

        if (!chatId) {
            return res.status(400).json({
                error: 'Bad request',
                message: 'chatId is required'
            });
        }

        config.removeSelectedChat(chatId);
        const selectedChats = Array.from(config.getSelectedChats());

        res.json({
            success: true,
            message: 'Chat deselected successfully',
            selectedChats,
            count: selectedChats.length
        });
    } catch (error) {
        console.error('❌ Error deselecting chat:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// Get configuration
router.get('/config', (req, res) => {
    try {
        res.json({
            selectedChatsCount: config.getSelectedChats().size,
            serverPort: config.getServerPort(),
            hasSlackWebhook: !!config.getSlackWebhookUrl()
        });
    } catch (error) {
        console.error('❌ Error getting config:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// Health check
router.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        whatsappReady: whatsappService.isClientReady(),
        timestamp: new Date().toISOString(),
        selectedChats: config.getSelectedChats().size
    });
});

module.exports = router;