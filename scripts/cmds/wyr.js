module.exports = {
	config: {
		name: "wyr",
		version: "1.0",
		author: "NeoKEX",
		countDown: 3,
		role: 0,
		description: {
			vi: "Would You Rather - Chọn câu hỏi",
			en: "Would You Rather game"
		},
		category: "games",
		guide: {
			vi: "   {pn} - Chơi Would You Rather",
			en: "   {pn} - Play Would You Rather"
		}
	},

	langs: {
		vi: {
			prompt: "❓ Bạn sẽ chọn cái nào?\n\n🔵 A: %1\n\n🔴 B: %2"
		},
		en: {
			prompt: "❓ Which would you rather?\n\n🔵 A: %1\n\n🔴 B: %2"
		}
	},

	onStart: async function ({ message, getLang }) {
		const questions = [
			{ a: "Ability to fly", b: "Ability to become invisible" },
			{ a: "Live without internet", b: "Live without TV" },
			{ a: "Always be cold", b: "Always be hot" },
			{ a: "Speak all languages fluently", b: "Play all instruments fluently" },
			{ a: "Have a photographic memory", b: "Be able to learn any skill instantly" },
			{ a: "Never need sleep", b: "Never need food" },
			{ a: "Time travel to the past", b: "Travel to the future" },
			{ a: "Have free coffee for life", b: "Free pizza for life" },
			{ a: "Be great at everything but nothing special", b: "Excel at one thing but fail at everything else" },
			{ a: "Always win arguments", b: "Always know when someone is lying" }
		];

		const choice = questions[Math.floor(Math.random() * questions.length)];
		return message.reply(getLang("prompt", choice.a, choice.b));
	}
};
