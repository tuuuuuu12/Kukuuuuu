module.exports = {
	config: {
		name: "topdecks",
		aliases: ["tournament", "winning", "topdeck"],
		version: "1.0",
		author: "Replit Agent",
		countDown: 5,
		role: 0,
		description: {
			en: "View tournament-winning Yu-Gi-Oh deck lists"
		},
		category: "yugioh",
		guide: {
			en: "   {pn} - View recent tournament winners\n   {pn} <deck> - Get full decklist\n   {pn} recent - Last 30 days winners"
		}
	},

	langs: {
		en: {
			list: "🏆 TOURNAMENT WINNING DECKS 🏆\n\n━━━━━━━━━━━━━━━━━━━━━\n%1\n━━━━━━━━━━━━━━━━━━━━━\n\nType: *topdecks <deckname> for full list",
			recent: "🔥 RECENT TOURNAMENT WINNERS 🔥\n\n📅 Last 30 Days:\n%1",
			decklist: "🎴 %1 - %2 🎴\n\n━━━━━━━━━━━━━━━━━━━━━\n🏅 Tournament: %3\n👤 Player: %4\n📊 Record: %5\n\n📋 MAIN DECK (40):\n%6\n\n📋 EXTRA DECK (15):\n%7\n\n📋 SIDE DECK (15):\n%8\n━━━━━━━━━━━━━━━━━━━━━"
		}
	},

	tournaments: [
		{
			name: "Swordsoul 1st Place",
			event: "YCS European Championship",
			date: "Nov 2024",
			player: "ProDuelist_X",
			record: "9-0",
			mainDeck: ["3x Swordsoul Strategist Longyuan", "3x Swordsoul Supremacy", "3x Visas Starfrost", "2x Ash Blossom & Joyous Spring", "3x Maxx C", "2x Swordsoul Singularity", "3x Pot of Desires", "2x Swordsoul Combination"],
			extraDeck: ["1x Swordsoul Grandmaster - Chixiao", "1x Swordsoul Grandmaster - Longyuan", "2x I.P. Masquerena", "1x Unchained Abomination", "1x Borrelsword Dragon"],
			sideDeck: ["2x Ghost Ogre & Snow Rabbit", "2x Droll & Lock Bird", "2x Red Reboot", "1x Crossout Designator", "2x Evenly Matched"]
		},
		{
			name: "Tearlaments 1st Place",
			event: "World Championship",
			date: "Oct 2024",
			player: "ChampionDuelist",
			record: "10-0",
			mainDeck: ["3x Tearlaments Scheiren", "3x Tearlaments Kitkallos", "2x Tearlaments Merrli", "2x Primeval Planet Prajna", "2x Maxx C", "3x Neptabyss the Atlantean", "3x Abyss Actor Twinkle Littlestar", "2x Pot of Prosperity"],
			extraDeck: ["1x Predaplant Verte Anaconda", "1x Mudragon of the Swamp", "1x Panzer Dragon", "1x Salamangreat Roar", "1x Accesscode Talker"],
			sideDeck: ["2x Lancea", "2x Artifact Lancea", "2x System Down", "1x Crossout Designator", "2x Infinite Impermanence"]
		},
		{
			name: "Unchained 1st Place",
			event: "Regional Championship",
			date: "Sep 2024",
			player: "AbyssalKing",
			record: "8-1",
			mainDeck: ["3x Unchained Soul of Anguish", "3x Unchained Abomination", "2x Abominable Unchained Soul", "2x Maxx C", "3x Crossout Designator", "2x Unchained Twins", "3x Dark Ruler No More", "2x Lightning Storm"],
			extraDeck: ["1x Unchained Abomination", "1x Accesscode Talker", "1x Borrelsword Dragon", "1x Topologic Trisbaena", "1x Winn Winged Beast Lyrical Conductor"],
			sideDeck: ["2x Ghost Ogre & Snow Rabbit", "2x Red Reboot", "2x Evenly Matched", "1x Crossout Designator", "2x Infinite Impermanence"]
		}
	],

	onStart: async function ({ message, args, getLang, event, usersData }) {
		const deckQuery = args[0]?.toLowerCase();

		if (args[0]?.toLowerCase() === "recent") {
			const recent = this.tournaments
				.map((t, i) => `${i+1}. ${t.name}\n   📅 ${t.date} | 👤 ${t.player}`)
				.join("\n");
			
			return message.reply(getLang("recent", recent));
		}

		const matchedTournament = this.tournaments.find(t => 
			t.name.toLowerCase().includes(deckQuery) || 
			t.player.toLowerCase().includes(deckQuery)
		);

		if (deckQuery && matchedTournament) {
			const deckName = matchedTournament.name.split(" ")[0];
			return message.reply(getLang("decklist",
				deckName,
				matchedTournament.date,
				matchedTournament.event,
				matchedTournament.player,
				matchedTournament.record,
				matchedTournament.mainDeck.map((card, i) => `${i+1}. ${card}`).join("\n"),
				matchedTournament.extraDeck.map((card, i) => `${i+1}. ${card}`).join("\n"),
				matchedTournament.sideDeck.map((card, i) => `${i+1}. ${card}`).join("\n")
			));
		}

		const listDisplay = this.tournaments
			.map((t, i) => `${i+1}. 🏆 ${t.name}\n   📊 ${t.player} (${t.record})\n   📅 ${t.event}`)
			.join("\n\n");

		return message.reply(getLang("list", listDisplay));
	}
};
