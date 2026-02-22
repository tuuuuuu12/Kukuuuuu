module.exports = {
	config: {
		name: "level",
		aliases: ["rank", "profile", "lvl"],
		version: "1.0",
		author: "Replit Agent",
		countDown: 5,
		role: 0,
		description: {
			en: "View your anime-style rank and progression!"
		},
		category: "economy",
		guide: {
			en: "   {pn} - View your rank\n   {pn} @user - View someone's rank"
		}
	},

	langs: {
		en: {
			profile: "╔══════════════════════════════════════╗\n║           ⭐ RANK PROFILE ⭐            ║\n╠══════════════════════════════════════╣\n║ 👤 %1\n║ 💫 Rank: %2 [%3]\n║ 📊 Level: %4 ⭐\n║ 🔥 EXP: %5 / %6\n║ 💰 Balance: %7 coins\n║ 🏆 Total Earned: %8 coins\n╠══════════════════════════════════════╣\n║ %9\n╚══════════════════════════════════════╝"
		}
	},

	getRankTier: (level) => {
		if (level >= 100) return { rank: "🌌 MYTHICAL", color: "👑" };
		if (level >= 80) return { rank: "⚡ LEGENDARY", color: "✨" };
		if (level >= 60) return { rank: "👿 OVERLORD", color: "🔥" };
		if (level >= 41) return { rank: "⚔️ LORD", color: "💎" };
		if (level >= 26) return { rank: "🛡️ KNIGHT", color: "🌟" };
		if (level >= 11) return { rank: "⚒️ WARRIOR", color: "💪" };
		return { rank: "🌱 NOVICE", color: "✨" };
	},

	getProgressBar: (current, max) => {
		const percentage = Math.min(100, Math.round((current / max) * 100));
		const filled = Math.floor(percentage / 10);
		const empty = 10 - filled;
		return `[${"█".repeat(filled)}${"░".repeat(empty)}] ${percentage}%`;
	},

	onStart: async function ({ message, args, getLang, event, usersData, api, threadID }) {
		const targetID = event.mentions[Object.keys(event.mentions)[0]] || event.senderID;

		let userData = await usersData.get(targetID, "data.economy");
		if (!userData) userData = { wallet: 0, bank: 0, level: 1, exp: 0 };

		const level = userData.level || 1;
		const currentExp = userData.exp || 0;
		const expNeeded = 100 + (level - 1) * 50; // Increases with level
		const totalEarned = (await usersData.get(targetID, "data.daily"))?.totalEarned || 0;

		const rankTier = this.getRankTier(level);
		const progressBar = this.getProgressBar(currentExp, expNeeded);

		let userName = "Unknown";
		try {
			const userInfo = await api.getUserInfo(targetID);
			userName = userInfo[targetID]?.name || "Unknown";
		} catch (e) {
			userName = `User ${targetID}`;
		}

		const profile = getLang("profile",
			userName,
			rankTier.rank,
			rankTier.color,
			level,
			currentExp,
			expNeeded,
			userData.wallet || 0,
			totalEarned,
			progressBar
		);

		return message.reply(profile);
	}
};
