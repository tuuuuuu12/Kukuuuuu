module.exports = {
        config: {
                name: "hangman",
                version: "1.0",
                author: "Replit Agent",
                countDown: 5,
                role: 0,
                description: {
                        en: "Hangman word guessing game"
                },
                category: "games",
                guide: {
                        en: "   {pn} - Start hangman\n   {pn} guess <letter> - Guess a letter"
                }
        },

        langs: {
                en: {
                        started: "🎮 HANGMAN STARTED!\n\nI'm thinking of a word. Guess letters!\n",
                        guessing: "Wrong guesses left: %1\nGuessed: %2\nWord: %3\n\nReply: *hangman guess <letter>",
                        correct: "✅ Correct!",
                        wrong: "❌ Wrong!",
                        won: "🎉 YOU WON! The word was: %1",
                        lost: "💀 GAME OVER! The word was: %1",
                        noGame: "No active game! Use *hangman to start"
                }
        },

        onStart: async function ({ message, args, getLang, event, commandName }) {
                const words = [
                        "javascript", "programming", "hangman", "elephant", "mountain",
                        "computer", "adventure", "mystery", "treasure", "champion",
                        "butterfly", "universe", "keyboard", "developer", "fantastic"
                ];

                const word = words[Math.floor(Math.random() * words.length)];

                if (!global.temp.hangmanGames) global.temp.hangmanGames = {};
                
                global.temp.hangmanGames[event.senderID] = {
                        word: word,
                        guessed: [],
                        wrong: 0,
                        maxWrong: 6
                };

                const display = word.split("").map(() => "_").join(" ");
                message.reply(getLang("started") + getLang("guessing", 6, "", display), (err, info) => {
                        if (!err) {
                                global.GoatBot.onReply.set(info.messageID, {
                                        commandName,
                                        author: event.senderID,
                                        messageID: info.messageID
                                });
                        }
                });
        },

        onReply: async function ({ message, event, args, getLang, usersData }) {
                const game = global.temp.hangmanGames?.[event.senderID];
                if (!game) return message.reply(getLang("noGame"));

                const letter = args[0]?.toLowerCase();
                if (!letter || letter.length !== 1) return message.reply("Enter a single letter!");
                if (game.guessed.includes(letter)) return message.reply("Already guessed that!");

                game.guessed.push(letter);

                if (game.word.includes(letter)) {
                        message.reply(getLang("correct"));
                } else {
                        game.wrong++;
                        message.reply(getLang("wrong"));
                }

                const display = game.word.split("").map(l => game.guessed.includes(l) ? l : "_").join(" ");

                if (game.wrong >= game.maxWrong) {
                        delete global.temp.hangmanGames[event.senderID];
                        return message.reply(getLang("lost", game.word));
                }

                if (!display.includes("_")) {
                        delete global.temp.hangmanGames[event.senderID];
                        
                        // Reward coins
                        const reward = Math.max(50, 100 - (game.guessed.length * 3));
                        let userData = await usersData.get(event.senderID, "data.economy");
                        if (!userData) userData = { wallet: 0, bank: 0 };
                        userData.wallet = (userData.wallet || 0) + reward;
                        await usersData.set(event.senderID, userData, "data.economy");
                        
                        return message.reply(getLang("won", game.word) + "\n\n💰 +" + reward + " coins earned!");
                }

                message.reply(getLang("guessing", game.maxWrong - game.wrong, game.guessed.join(", "), display), (err, info) => {
                        if (!err) {
                                global.GoatBot.onReply.set(info.messageID, {
                                        commandName: "hangman",
                                        author: event.senderID,
                                        messageID: info.messageID
                                });
                        }
                });
        }
};
