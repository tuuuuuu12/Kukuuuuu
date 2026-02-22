module.exports = {
	config: {
		name: "pokemon",
		aliases: ["poke", "catch", "pokedex"],
		version: "1.0",
		author: "Replit Agent",
		countDown: 3,
		role: 0,
		description: {
			en: "Catch random Pokémon and earn coins!"
		},
		category: "games",
		guide: {
			en: "   {pn} - Catch a random Pokémon\n   {pn} dex - View your collection"
		}
	},

	langs: {
		en: {
			caught: "🎉 POKÉMON CAUGHT! 🎉\n\n━━━━━━━━━━━━━━━━━━━━━\n🔴 Pokémon: %1\n📊 Type: %2\n💪 Base Power: %3\n🏆 Rarity: %4\n━━━━━━━━━━━━━━━━━━━━━\n\n💰 +%5 coins!\n👜 Total Caught: %6",
			dex: "📚 POKÉDEX 📚\n\n━━━━━━━━━━━━━━━━━━━━━\n🔴 Pokémon Caught: %1\n💰 Coins from Pokémon: %2\n🎯 Most Rare: %3\n━━━━━━━━━━━━━━━━━━━━━"
		}
	},

	pokemon: [
		{ name: "Charizard", type: "Fire/Flying", power: 320, rarity: "Legendary" },
		{ name: "Blastoise", type: "Water", power: 310, rarity: "Legendary" },
		{ name: "Venusaur", type: "Grass/Poison", power: 300, rarity: "Legendary" },
		{ name: "Dragonite", type: "Dragon/Flying", power: 350, rarity: "Ultra Rare" },
		{ name: "Mewtwo", type: "Psychic", power: 380, rarity: "Mythical" },
		{ name: "Articuno", type: "Ice/Flying", power: 330, rarity: "Ultra Rare" },
		{ name: "Zapdos", type: "Electric/Flying", power: 330, rarity: "Ultra Rare" },
		{ name: "Moltres", type: "Fire/Flying", power: 330, rarity: "Ultra Rare" },
		{ name: "Lugia", type: "Psychic/Flying", power: 370, rarity: "Mythical" },
		{ name: "Ho-Oh", type: "Fire/Flying", power: 370, rarity: "Mythical" },
		{ name: "Rayquaza", type: "Dragon/Flying", power: 360, rarity: "Mythical" },
		{ name: "Pikachu", type: "Electric", power: 120, rarity: "Common" },
		{ name: "Gyarados", type: "Water/Flying", power: 340, rarity: "Rare" },
		{ name: "Alakazam", type: "Psychic", power: 300, rarity: "Rare" },
		{ name: "Machamp", type: "Fighting", power: 310, rarity: "Rare" }
	],

	getReward: (rarity) => {
		const rewards = {
			"Mythical": 500,
			"Legendary": 300,
			"Ultra Rare": 200,
			"Rare": 100,
			"Common": 30
		};
		return rewards[rarity] || 30;
	},

	onStart: async function ({ message, args, getLang, event, usersData }) {
		const userID = event.senderID;

		if (args[0]?.toLowerCase() === "dex") {
			let pokeData = await usersData.get(userID, "data.pokemon");
			if (!pokeData) pokeData = { caught: 0, totalCoins: 0, rarest: "None" };
			
			return message.reply(getLang("dex", pokeData.caught, pokeData.totalCoins, pokeData.rarest));
		}

		const poke = this.pokemon[Math.floor(Math.random() * this.pokemon.length)];
		const reward = this.getReward(poke.rarity);

		// Update Pokemon data
		let pokeData = await usersData.get(userID, "data.pokemon");
		if (!pokeData) pokeData = { caught: 0, totalCoins: 0, rarest: "Common" };
		
		pokeData.caught = (pokeData.caught || 0) + 1;
		pokeData.totalCoins = (pokeData.totalCoins || 0) + reward;
		
		const rarityOrder = ["Mythical", "Legendary", "Ultra Rare", "Rare", "Common"];
		const currentRarityIndex = rarityOrder.indexOf(pokeData.rarest || "Common");
		const newRarityIndex = rarityOrder.indexOf(poke.rarity);
		if (newRarityIndex < currentRarityIndex) {
			pokeData.rarest = poke.rarity;
		}
		
		await usersData.set(userID, pokeData, "data.pokemon");

		// Add reward to wallet
		let userData = await usersData.get(userID, "data.economy");
		if (!userData) userData = { wallet: 0, bank: 0, level: 1, exp: 0 };
		
		userData.wallet = (userData.wallet || 0) + reward;
		userData.exp = (userData.exp || 0) + Math.floor(reward / 50);
		
		const expNeeded = 100 + (userData.level - 1) * 50;
		if (userData.exp >= expNeeded) {
			userData.level += 1;
			userData.exp = 0;
		}
		
		await usersData.set(userID, userData, "data.economy");

		const levelUp = userData.exp === 0 ? "\n\n🎉 **LEVEL UP!** You are now level " + userData.level + "!" : "";
		return message.reply(getLang("caught", poke.name, poke.type, poke.power, poke.rarity, reward, pokeData.caught) + levelUp);
	}
};
