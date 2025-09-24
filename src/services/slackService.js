const axios = require('axios');
const config = require('../config/config');

class SlackService {
    constructor() {
        this.webhookUrl = config.getSlackWebhookUrl();
    }

    async sendMessage(messageDetails) {
        const slackMessage = this.formatMessage(messageDetails);

        try {
            await axios.post(this.webhookUrl, slackMessage);
            console.log('✅ Message sent to Slack successfully');
            return true;
        } catch (error) {
            console.error('❌ Error sending to Slack:', error);

            // Fallback to simple message
            try {
                await axios.post(this.webhookUrl, {
                    text: `📩 WhatsApp (${messageDetails.senderNumber}): ${messageDetails.message}`
                });
                console.log('✅ Fallback message sent to Slack');
                return true;
            } catch (fallbackError) {
                console.error('❌ Fallback message also failed:', fallbackError);
                return false;
            }
        }
    }

    formatMessage(messageDetails) {
        const { senderName, senderNumber, message, timestamp, isGroup } = messageDetails;

        return {
            blocks: [
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `📱 *WhatsApp Message*`
                    }
                },
                {
                    type: "section",
                    fields: [
                        {
                            type: "mrkdwn",
                            text: `*From:*\n${senderName}`
                        },
                        {
                            type: "mrkdwn",
                            text: `*Number:*\n${senderNumber}`
                        }
                    ]
                },
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `*Message:*\n${message}`
                    }
                },
                {
                    type: "context",
                    elements: [
                        {
                            type: "mrkdwn",
                            text: `📅 ${timestamp.toLocaleString()}`
                        }
                    ]
                }
            ]
        };
    }

    updateWebhookUrl(url) {
        this.webhookUrl = url;
        config.updateSlackWebhook(url);
    }

    getWebhookUrl() {
        return this.webhookUrl;
    }
}

module.exports = new SlackService();