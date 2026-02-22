const axios = require('axios');

// config - using Google Gemini API
const apiKey = process.env.GOOGLE_GEMINI_API_KEY || "";

if (!global.temp.analyzeUsing)
	global.temp.analyzeUsing = {};

const { analyzeUsing } = global.temp;

module.exports = {
	config: {
		name: "analyze",
		version: "1.0",
		author: "NeoKEX",
		countDown: 5,
		role: 0,
		description: {
			vi: "Phân tích hình ảnh bằng Gemini AI",
			en: "Analyze images with Gemini AI"
		},
		category: "box chat",
		guide: {
			vi: "   {pn} - phân tích hình ảnh trong tin nhắn trả lời\n   {pn} <mô tả> - phân tích hình ảnh với hướng dẫn cụ thể",
			en: "   {pn} - analyze image from replied message\n   {pn} <description> - analyze image with specific instructions"
		}
	},

	langs: {
		vi: {
			apiKeyEmpty: "Vui lòng cung cấp API key cho Google Gemini",
			noImage: "Không tìm thấy hình ảnh. Vui lòng trả lời tin nhắn có chứa hình ảnh hoặc tải lên hình ảnh",
			invalidImage: "Không thể tải xuống hình ảnh. Vui lòng thử lại",
			analyzing: "Đang phân tích hình ảnh...",
			error: "Đã có lỗi xảy ra\n%1",
			usingCommand: "Bạn đang sử dụng lệnh phân tích, vui lòng chờ"
		},
		en: {
			apiKeyEmpty: "Please provide API key for Google Gemini",
			noImage: "No image found. Please reply to a message with an image or upload an image",
			invalidImage: "Failed to download image. Please try again",
			analyzing: "Analyzing image...",
			error: "An error has occurred\n%1",
			usingCommand: "You are using analyze command, please wait"
		}
	},

	onStart: async function ({ message, event, args, getLang, commandName, Reply }) {
		if (!apiKey)
			return message.reply(getLang('apiKeyEmpty'));

		if (analyzeUsing[event.senderID])
			return message.reply(getLang("usingCommand"));

		analyzeUsing[event.senderID] = true;

		try {
			let imageUrl = null;
			let customPrompt = args.join(' ') || "Analyze this image in detail and describe what you see";

			// Check if replying to a message with attachments
			if (Reply && Reply.attachments && Reply.attachments.length > 0) {
				const imageAttachment = Reply.attachments.find(att => att.type === 'photo');
				if (imageAttachment) {
					imageUrl = imageAttachment.url;
				}
			}

			// If no image found in reply, check current message
			if (!imageUrl && event.attachments && event.attachments.length > 0) {
				const imageAttachment = event.attachments.find(att => att.type === 'photo');
				if (imageAttachment) {
					imageUrl = imageAttachment.url;
				}
			}

			if (!imageUrl) {
				return message.reply(getLang('noImage'));
			}

			message.reply(getLang('analyzing'));

			// Download image and convert to base64
			let imageBase64;
			try {
				const imageResponse = await axios.get(imageUrl, {
					responseType: 'arraybuffer',
					timeout: 10000
				});
				imageBase64 = Buffer.from(imageResponse.data).toString('base64');
			} catch (err) {
				console.error("Image download error:", err.message);
				return message.reply(getLang('invalidImage'));
			}

			// Determine image mime type from URL or default to jpeg
			let mimeType = 'image/jpeg';
			if (imageUrl.includes('.png')) mimeType = 'image/png';
			else if (imageUrl.includes('.webp')) mimeType = 'image/webp';
			else if (imageUrl.includes('.gif')) mimeType = 'image/gif';

			// Call Gemini API with vision
			const response = await axios({
				url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				data: {
					contents: [{
						parts: [
							{
								inlineData: {
									mimeType: mimeType,
									data: imageBase64
								}
							},
							{
								text: customPrompt
							}
						]
					}],
					generationConfig: {
						maxOutputTokens: 1024,
						temperature: 0.7
					}
				}
			});

			const analysisText = response.data.candidates[0].content.parts[0].text;

			// Reply with analysis (remove the analyzing message first)
			return message.reply(analysisText);
		}
		catch (err) {
			console.error("Analysis Error:", err.response?.data || err.message);
			const errorMessage = err.response?.data?.error?.message || err.message || "Unknown error";
			return message.reply(getLang('error', errorMessage));
		}
		finally {
			delete analyzeUsing[event.senderID];
		}
	},

	onReply: async function ({ Reply, message, event, args, getLang, commandName }) {
		// Not needed for this command
	}
};
