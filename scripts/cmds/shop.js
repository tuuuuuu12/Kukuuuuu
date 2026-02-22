module.exports = {
	config: {
		name: "shop",
		aliases: ["store", "buy"],
		version: "1.0",
		author: "Replit Agent",
		countDown: 3,
		role: 0,
		description: {
			en: "Shop system - buy items with coins"
		},
		category: "economy",
		guide: {
			en: "   {pn} - View shop\n   {pn} buy <item_id> - Buy an item\n   {pn} inventory - View your items"
		}
	},

	langs: {
		en: {
			shop: "🛍️ SHOP 🛍️\n\n%1",
			item: "🔢 ID:%1 | 📦 %2 | 💰 %3 coins",
			buy_success: "✅ You bought %1 for %2 coins!",
			buy_error: "❌ Not enough coins or invalid item!",
			inventory: "🎁 YOUR INVENTORY 🎁\n\n%1",
			empty_inventory: "Your inventory is empty!"
		}
	},

	items: [
		{ id: 1, name: "🍕 Pizza", price: 50, emoji: "🍕" },
		{ id: 2, name: "🍔 Burger", price: 30, emoji: "🍔" },
		{ id: 3, name: "🍰 Cake", price: 100, emoji: "🍰" },
		{ id: 4, name: "🎮 Game Pass", price: 200, emoji: "🎮" },
		{ id: 5, name: "🏆 Trophy", price: 500, emoji: "🏆" },
		{ id: 6, name: "👑 Crown", price: 1000, emoji: "👑" },
		{ id: 7, name: "💎 Diamond", price: 2000, emoji: "💎" },
		{ id: 8, name: "🚀 Rocket", price: 5000, emoji: "🚀" },
		{ id: 9, name: "🌟 Star", price: 150, emoji: "⭐" },
		{ id: 10, name: "❤️ Heart", price: 75, emoji: "❤️" }
	],

	onStart: async function ({ message, args, getLang, event, usersData }) {
		const userID = event.senderID;
		const action = args[0]?.toLowerCase();

		// Get user data
		let userData = await usersData.get(userID, "data.economy");
		if (!userData) {
			userData = { wallet: 0, bank: 0 };
			await usersData.set(userID, userData, "data.economy");
		}

		if (!action || action === "list") {
			let shopText = "";
			this.items.forEach(item => {
				shopText += getLang("item", item.id, item.name, item.price) + "\n";
			});
			return message.reply(getLang("shop", shopText));
		}

		if (action === "buy") {
			const itemID = parseInt(args[1]);
			const item = this.items.find(i => i.id === itemID);

			if (!item) return message.reply(getLang("buy_error"));
			if (userData.wallet < item.price) return message.reply(getLang("buy_error"));

			// Deduct from wallet
			userData.wallet -= item.price;
			await usersData.set(userID, userData, "data.economy");

			// Add to inventory
			let inventory = await usersData.get(userID, "data.inventory") || [];
			inventory.push({ id: item.id, name: item.name, emoji: item.emoji });
			await usersData.set(userID, inventory, "data.inventory");

			return message.reply(getLang("buy_success", item.name, item.price));
		}

		if (action === "inventory") {
			let inventory = await usersData.get(userID, "data.inventory") || [];
			if (inventory.length === 0) return message.reply(getLang("empty_inventory"));

			let invText = inventory.map((item, idx) => `${item.emoji} ${item.name}`).join("\n");
			return message.reply(getLang("inventory", invText));
		}

		return message.reply("Unknown action!");
	}
};
