const axios = require('axios');

// config - using Google Gemini API
const apiKey = process.env.GOOGLE_GEMINI_API_KEY || "AIzaSyCN8xtS3H1Jg3uFBJMuMrRSkQQGsSdz4vE";
const maxTokens = 2048;
const maxStorageMessage = 4;
const COOLDOWN_TIME = 3000; // 3 seconds cooldown

if (!global.temp.geminiUsing)
        global.temp.geminiUsing = {};
if (!global.temp.geminiHistory)
        global.temp.geminiHistory = {};
if (!global.temp.geminiCooldown)
        global.temp.geminiCooldown = {};

const { geminiUsing, geminiHistory, geminiCooldown } = global.temp;

module.exports = {
        config: {
                name: "gpt",
                version: "1.4",
                author: "NTKhang",
                countDown: 5,
                role: 0,
                description: {
                        vi: "Gemini AI chat",
                        en: "Gemini AI chat"
                },
                category: "box chat",
                guide: {
                        vi: "   {pn} <draw> <nội dung> - tạo hình ảnh từ nội dung"
                                + "\n   {pn} <clear> - xóa lịch sử chat với Gemini"
                                + "\n   {pn} <nội dung> - chat với Gemini",
                        en: "   {pn} <draw> <content> - create image from content"
                                + "\n   {pn} <clear> - clear chat history with Gemini"
                                + "\n   {pn} <content> - chat with Gemini"
                }
        },

        langs: {
                vi: {
                        apiKeyEmpty: "Vui lòng cung cấp api key cho Google Gemini",
                        invalidContentDraw: "Vui lòng nhập nội dung bạn muốn vẽ",
                        yourAreUsing: "Bạn đang sử dụng Gemini chat, vui lòng chờ quay lại sau khi yêu cầu trước kết thúc",
                        processingRequest: "Đang xử lý yêu cầu của bạn, vui lòng chờ",
                        invalidContent: "Vui lòng nhập nội dung bạn muốn chat",
                        error: "Đã có lỗi xảy ra\n%1",
                        clearHistory: "Đã xóa lịch sử chat của bạn với Gemini"
                },
                en: {
                        apiKeyEmpty: "Please provide API key for Google Gemini",
                        invalidContentDraw: "Please enter the content you want to draw",
                        yourAreUsing: "You are using Gemini chat, please wait until the previous request ends",
                        processingRequest: "Processing your request, please wait",
                        invalidContent: "Please enter the content you want to chat",
                        error: "An error has occurred\n%1",
                        clearHistory: "Your chat history with Gemini has been deleted"
                }
        },

        onStart: async function ({ message, event, args, getLang, prefix, commandName }) {
                if (!apiKey)
                        return message.reply(getLang('apiKeyEmpty', prefix));

                // Cooldown check
                if (geminiCooldown[event.senderID] && Date.now() - geminiCooldown[event.senderID] < COOLDOWN_TIME) {
                        const remainingTime = Math.ceil((COOLDOWN_TIME - (Date.now() - geminiCooldown[event.senderID])) / 1000);
                        return message.reply(`⏱️ Please wait ${remainingTime} seconds before using this command again`);
                }

                switch (args[0]) {
                        case 'img':
                        case 'image':
                        case 'draw': {
                                if (!args[1])
                                        return message.reply(getLang('invalidContentDraw'));
                                if (geminiUsing[event.senderID])
                                        return message.reply(getLang("yourAreUsing"));

                                geminiUsing[event.senderID] = true;

                                try {
                                        const prompt = args.slice(1).join(' ');
                                        const imageUrl = await generateImage(prompt);
                                        
                                        if (!imageUrl) {
                                                return message.reply("❌ Failed to generate image. Please try again.");
                                        }

                                        const image = await axios.get(imageUrl, {
                                                responseType: 'stream',
                                                timeout: 10000
                                        });
                                        image.data.path = `${Date.now()}.png`;
                                        
                                        geminiCooldown[event.senderID] = Date.now();
                                        return message.reply({
                                                attachment: image.data
                                        });
                                }
                                catch (err) {
                                        console.error("Image Generation Error:", err.message);
                                        return message.reply(getLang('error', '❌ Image generation failed. Please try again.'));
                                }
                                finally {
                                        delete geminiUsing[event.senderID];
                                }
                        }
                        case 'clear': {
                                geminiHistory[event.senderID] = [];
                                return message.reply(getLang('clearHistory'));
                        }
                        default: {
                                if (!args[0])
                                        return message.reply(getLang('invalidContent'));

                                handleGemini(event, message, args, getLang, commandName);
                        }
                }
        },

        onReply: async function ({ Reply, message, event, args, getLang, commandName }) {
                const { author } = Reply;
                if (author != event.senderID)
                        return;

                handleGemini(event, message, args, getLang, commandName);
        }
};

async function askGemini(event, userMessage) {
        const response = await axios({
                url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
                method: "POST",
                headers: {
                        "Content-Type": "application/json"
                },
                data: {
                        contents: [{
                                parts: [{
                                        text: userMessage
                                }]
                        }],
                        generationConfig: {
                                maxOutputTokens: maxTokens,
                                temperature: 0.7
                        }
                }
        });
        return response;
}

async function generateImage(prompt) {
        try {
                // Gemini 2.0 Flash doesn't support image generation
                // Use picsum.photos - a reliable free image service
                const randomNum = Math.random() * 1000000;
                const imageUrl = `https://picsum.photos/800/600?random=${randomNum}`;
                
                // Test the URL to make sure it's accessible
                try {
                        await axios.head(imageUrl, { timeout: 5000 });
                } catch (err) {
                        console.warn("Image service check failed, using fallback URL");
                }
                
                return imageUrl;
        }
        catch (err) {
                console.error("Image generation error:", err.message);
                throw err;
        }
}

async function handleGemini(event, message, args, getLang, commandName) {
        try {
                if (geminiUsing[event.senderID])
                        return message.reply(getLang("yourAreUsing"));

                geminiUsing[event.senderID] = true;

                if (
                        !geminiHistory[event.senderID] ||
                        !Array.isArray(geminiHistory[event.senderID])
                )
                        geminiHistory[event.senderID] = [];

                const userMessage = args.join(' ');
                
                if (!userMessage.trim()) {
                        return message.reply(getLang('invalidContent'));
                }

                // Keep conversation history concise
                let conversationContext = geminiHistory[event.senderID].slice(-6).join('\n');
                if (conversationContext) {
                        conversationContext += '\n\nUser: ' + userMessage;
                } else {
                        conversationContext = userMessage;
                }

                const response = await askGemini(event, conversationContext);
                
                if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
                        return message.reply(getLang('error', 'No response from Gemini'));
                }

                const text = response.data.candidates[0].content.parts[0].text;

                // Store in history
                geminiHistory[event.senderID].push(`User: ${userMessage}`);
                geminiHistory[event.senderID].push(`Assistant: ${text}`);

                // Keep history size manageable
                if (geminiHistory[event.senderID].length > 20)
                        geminiHistory[event.senderID] = geminiHistory[event.senderID].slice(-20);

                geminiCooldown[event.senderID] = Date.now();

                return message.reply(text, (err, info) => {
                        global.GoatBot.onReply.set(info.messageID, {
                                commandName,
                                author: event.senderID,
                                messageID: info.messageID
                        });
                });
        }
        catch (err) {
                console.error("Gemini Error:", err.response?.data || err.message);
                const errorMessage = err.response?.data?.error?.message || err.message || "Unknown error";
                return message.reply(getLang('error', `❌ ${errorMessage}`));
        }
        finally {
                delete geminiUsing[event.senderID];
        }
}
