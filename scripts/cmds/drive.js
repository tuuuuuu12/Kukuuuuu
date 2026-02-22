const a = require('axios');
const u = "http://65.109.80.126:20409/aryan/drive";

module.exports = {
  config: {
    name: "drive",
    version: "0.0.2",
    author: "ArYAN",
    countDown: 5,
    role: 2,
    description: "Upload videos to Google Drive easily!",
    category: "utility",
    guide: "Use: {pn} <link> to upload a video from a link\nOr reply to a video/message with media to upload"
  },

  onStart: async function ({ message, event, args }) {
    const i = event?.messageReply?.attachments?.[0]?.url || args[0];

    if (!i) return message.reply("⚠️ Please provide a valid video URL or reply to a media message.");

    try {
      const r = await a.get(`${u}?url=${encodeURIComponent(i)}`);
      const d = r.data || {};
      console.log("API response:", d);

      const l = d.driveLink || d.driveLIink;
      if (l) return message.reply(`✅ File uploaded to Google Drive!\n\n🔗 URL: ${l}`);

      const e = d.error || JSON.stringify(d) || "❌ Failed to upload the file.";
      return message.reply(`Upload failed: ${e}`);
    } catch (e) {
      console.error("Upload Error:", e.message || e);
      return message.reply("❌ An error occurred during upload. Please try again later.");
    }
  }
};
