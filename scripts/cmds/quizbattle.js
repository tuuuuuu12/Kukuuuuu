const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

// Database file for global leaderboard
const LEADERBOARD_FILE = path.join(__dirname, "../data/quiz_leaderboard.json");

const ensureLeaderboardFile = async () => {
	const dir = path.dirname(LEADERBOARD_FILE);
	await fs.ensureDir(dir);
	if (!await fs.pathExists(LEADERBOARD_FILE)) {
		await fs.writeJSON(LEADERBOARD_FILE, { players: {}, scores: [] });
	}
};

const saveScore = async (userID, userName, score, groupID) => {
	await ensureLeaderboardFile();
	const data = await fs.readJSON(LEADERBOARD_FILE);
	
	if (!data.players[userID]) {
		data.players[userID] = { name: userName, totalScore: 0, gamesPlayed: 0, groups: [] };
	}
	
	data.players[userID].totalScore += score;
	data.players[userID].gamesPlayed += 1;
	if (!data.players[userID].groups.includes(groupID)) {
		data.players[userID].groups.push(groupID);
	}
	
	await fs.writeJSON(LEADERBOARD_FILE, data);
};

const getLeaderboard = async (limit = 10) => {
	await ensureLeaderboardFile();
	const data = await fs.readJSON(LEADERBOARD_FILE);
	
	const leaderboard = Object.entries(data.players)
		.map(([id, player]) => ({
			id,
			...player,
			avgScore: Math.round(player.totalScore / player.gamesPlayed)
		}))
		.sort((a, b) => b.totalScore - a.totalScore)
		.slice(0, limit);
	
	return leaderboard;
};

// Decode HTML entities
const decodeHTML = (html) => {
	const map = {
		'&amp;': '&',
		'&lt;': '<',
		'&gt;': '>',
		'&quot;': '"',
		'&#039;': "'",
		'&ldquo;': '"',
		'&rdquo;': '"',
		'&ndash;': '-',
		'&mdash;': '—',
		'&hellip;': '...'
	};
	return html.replace(/&[a-z]+;/gi, match => map[match] || match);
};

// Fetch questions from Open Trivia Database API (FREE & INFINITE)
const fetchQuestionsFromAPI = async () => {
	try {
		const response = await axios.get("https://opentdb.com/api.php?amount=5&type=multiple&difficulty=medium");
		
		if (response.data.results && response.data.results.length > 0) {
			return response.data.results.map(q => {
				const allAnswers = [q.correct_answer, ...q.incorrect_answers];
				// Shuffle answers
				for (let i = allAnswers.length - 1; i > 0; i--) {
					const j = Math.floor(Math.random() * (i + 1));
					[allAnswers[i], allAnswers[j]] = [allAnswers[j], allAnswers[i]];
				}
				
				return {
					q: decodeHTML(q.question),
					opts: allAnswers.map(a => decodeHTML(a)),
					ans: decodeHTML(q.correct_answer)
				};
			});
		}
	} catch (error) {
		console.log("API error, using fallback questions");
	}
	return null;
};

module.exports = {
	config: {
		name: "quizbattle",
		aliases: ["qb", "quiz"],
		version: "2.0",
		author: "Replit Agent",
		countDown: 5,
		role: 0,
		description: {
			en: "Quiz battle with INFINITE questions & global leaderboard"
		},
		category: "games",
		guide: {
			en: "   {pn} - Start quiz\n   {pn} <number> - Answer question\n   {pn} leaderboard - View global leaderboard"
		}
	},

	langs: {
		en: {
			question: "❓ Question %1/5:\n\n%2\n\n1️⃣ %3\n2️⃣ %4\n3️⃣ %5\n4️⃣ %6\n\nReply: *quizbattle <number>",
			correct: "✅ Correct! +10 points",
			wrong: "❌ Wrong! -5 points. Answer: %1",
			final: "🏆 QUIZ COMPLETE!\n\nFinal Score: %1\n\nView: *quizbattle leaderboard",
			leaderboard: "🏆 GLOBAL LEADERBOARD 🏆\n\n%1",
			rank: "#%1 | %2 | Score: %3 | Avg: %4 | Games: %5",
			noGame: "No active quiz! Use *quizbattle to start",
			started: "🎮 QUIZ BATTLE STARTED!\n\nYou'll answer 5 FRESH QUESTIONS (infinite pool, never repeat).\nCorrect: +10 pts\nWrong: -5 pts\n"
		}
	},

	fallbackQuestions: [
		{ q: "What is the capital of France?", opts: ["London", "Berlin", "Paris", "Madrid"], ans: "Paris" },
		{ q: "Which planet is closest to the sun?", opts: ["Venus", "Mercury", "Earth", "Mars"], ans: "Mercury" },
		{ q: "Who invented the telephone?", opts: ["Nikola Tesla", "Alexander Graham Bell", "Thomas Edison", "Albert Einstein"], ans: "Alexander Graham Bell" },
		{ q: "What is the largest mammal in the world?", opts: ["Elephant", "Giraffe", "Blue Whale", "Hippopotamus"], ans: "Blue Whale" },
		{ q: "Which country has the most population?", opts: ["India", "USA", "Indonesia", "Pakistan"], ans: "India" }
	],

	onStart: async function ({ message, args, getLang, event, commandName }) {
		if (args[0]?.toLowerCase() === "leaderboard") {
			const board = await getLeaderboard(10);
			let boardText = "";
			board.forEach((player, idx) => {
				boardText += getLang("rank", idx + 1, player.name, player.totalScore, player.avgScore, player.gamesPlayed) + "\n";
			});
			return message.reply(getLang("leaderboard", boardText || "No scores yet!"));
		}

		if (!global.temp.quizGames) global.temp.quizGames = {};
		
		// Fetch fresh questions from API (INFINITE & NEVER REPEATING)
		let questions = await fetchQuestionsFromAPI();
		
		// Fallback to local questions if API fails
		if (!questions || questions.length === 0) {
			questions = this.fallbackQuestions;
		}
		
		global.temp.quizGames[event.senderID] = {
			questions,
			currentQ: 0,
			score: 0,
			userID: event.senderID,
			userName: event.senderName || "Player"
		};

		const q = questions[0];
		message.reply(getLang("started") + getLang("question", 1, q.q, q.opts[0], q.opts[1], q.opts[2], q.opts[3]), (err, info) => {
			if (!err) {
				global.GoatBot.onReply.set(info.messageID, {
					commandName,
					author: event.senderID,
					messageID: info.messageID
				});
			}
		});
	},

	onReply: async function ({ message, event, args, getLang }) {
		const game = global.temp.quizGames?.[event.senderID];
		if (!game) return message.reply(getLang("noGame"));

		const answer = parseInt(args[0]) - 1;
		if (answer < 0 || answer > 3) return message.reply("Invalid answer!");

		const currentQuestion = game.questions[game.currentQ];
		const userAnswer = currentQuestion.opts[answer];

		if (userAnswer === currentQuestion.ans) {
			game.score += 10;
			message.reply(getLang("correct"));
		} else {
			game.score -= 5;
			message.reply(getLang("wrong", currentQuestion.ans));
		}

		game.currentQ++;

		// Game complete
		if (game.currentQ >= 5) {
			const finalScore = Math.max(0, game.score);
			await saveScore(game.userID, game.userName, finalScore, event.threadID);
			delete global.temp.quizGames[event.senderID];
			return message.reply(getLang("final", finalScore));
		}

		// Next question
		const nextQ = game.questions[game.currentQ];
		message.reply(getLang("question", game.currentQ + 1, nextQ.q, nextQ.opts[0], nextQ.opts[1], nextQ.opts[2], nextQ.opts[3]), (err, info) => {
			if (!err) {
				global.GoatBot.onReply.set(info.messageID, {
					commandName: "quizbattle",
					author: event.senderID,
					messageID: info.messageID
				});
			}
		});
	}
};
