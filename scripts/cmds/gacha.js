const axios = require("axios");

module.exports = {
	config: {
		name: "gacha",
		aliases: ["pull", "waifupull"],
		version: "1.0",
		author: "Agent",
		countDown: 3,
		role: 0,
		description: { en: "Gacha system - Pull waifus with coins" },
		category: "games",
		guide: { en: "   {pn} <amount> - Pull waifu\n   {pn} collection - View collection" }
	},

	getRarity: () => {
		const rand = Math.random() * 100;
		if (rand < 4) return "🌟 Mythical";
		if (rand < 18) return "⭐ Ultra Rare";
		if (rand < 45) return "💎 Rare";
		return "🔹 Common";
	},

	getReward: (rarity) => ({ "🌟 Mythical": 500, "⭐ Ultra Rare": 250, "💎 Rare": 100, "🔹 Common": 25 }[rarity] || 25),

	fetchWaifu: async () => {
		try {
			const cat = ["waifu", "fanservice", "ecchi"][Math.floor(Math.random() * 3)];
			const r = await axios.get(`https://api.waifu.pics/random/${cat}`, { timeout: 5000 });
			return r.data.url;
		} catch (e) { return null; }
	},

	onStart: async function ({ message, args, event, usersData }) {
		const uid = event.senderID, amt = parseInt(args[0]);
		if (!args[0]) return message.reply("❌ Usage: *gacha <amount>");
		if (args[0].toLowerCase() === "collection") {
			const wd = await usersData.get(uid, "data.waifus") || { stats: { total: 0, rare: 0, common: 0 } };
			return message.reply(`📚 Collection: ${wd.stats.total} total | ${wd.stats.rare} Rare | ${wd.stats.common} Common`);
		}
		if (!amt || amt <= 0) return message.reply("❌ Invalid amount");
		if (amt < 100) return message.reply("❌ Min: 100 coins");
		let ud = await usersData.get(uid, "data.economy") || { wallet: 0, level: 1, exp: 0 };
		if (ud.wallet < amt) return message.reply(`❌ Need ${amt}, have ${ud.wallet}`);
		ud.wallet -= amt;
		const rarity = this.getRarity();
		const url = await this.fetchWaifu();
		const reward = this.getReward(rarity);
		let wd = await usersData.get(uid, "data.waifus") || { owned: [], stats: { total: 0, rare: 0, common: 0 } };
		wd.owned.push({ id: `${Date.now()}`, rarity, url, date: new Date() });
		wd.stats.total += 1;
		if (rarity.includes("Rare")) wd.stats.rare += 1;
		else wd.stats.common += 1;
		ud.wallet += reward + amt;
		ud.exp = (ud.exp || 0) + Math.floor(reward / 50);
		if (ud.exp >= 100 + (ud.level - 1) * 50) { ud.level += 1; ud.exp = 0; }
		await usersData.set(uid, ud, "data.economy");
		await usersData.set(uid, wd, "data.waifus");
		const msg = `🎉 **WAIFU GACHA** 🎉\n⭐ ${rarity}\n💰 Bet: ${amt} | 🎁 Won: ${reward}\n✨ Balance: ${ud.wallet}\n👜 Total: ${wd.stats.total}${ud.exp === 0 ? `\n🎉 LEVEL UP → ${ud.level}` : ""}${url ? `\n🖼️ ${url}` : ""}`;
		message.reply(msg);
	}
};
