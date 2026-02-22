module.exports = {
        config: {
                name: "riddle",
                version: "1.0",
                author: "NeoKEX",
                countDown: 5,
                role: 0,
                description: {
                        vi: "Trò chơi Riddle",
                        en: "Riddle Game"
                },
                category: "games",
                guide: {
                        vi: "   {pn} - Đoán câu đố",
                        en: "   {pn} - Guess the riddle"
                }
        },

        langs: {
                vi: {
                        riddle: "🧩 Câu đố: %1\n\nTrả lời: *riddle answer <câu trả lời>",
                        correct: "✅ Đúng rồi!",
                        wrong: "❌ Sai rồi! Đáp án là: %1"
                },
                en: {
                        riddle: "🧩 Riddle: %1\n\nAnswer: *riddle answer <answer>",
                        correct: "✅ Correct!",
                        wrong: "❌ Wrong! The answer is: %1"
                }
        },

        onStart: async function ({ message, args, getLang, event, commandName }) {
                const riddles = [
                        { q: "I have cities but no houses. What am I?", a: "map" },
                        { q: "What has a head and a tail but no body?", a: "coin" },
                        { q: "I get wet while drying. What am I?", a: "towel" },
                        { q: "What can travel around the world while staying in a corner?", a: "stamp" },
                        { q: "I have keys but no locks. What am I?", a: "piano" },
                        { q: "What is always coming but never arrives?", a: "tomorrow" },
                        { q: "I speak without a mouth. What am I?", a: "echo" },
                        { q: "What has a face and two hands but no arms or legs?", a: "clock" }
                ];

                const riddle = riddles[Math.floor(Math.random() * riddles.length)];

                if (!global.temp.riddleData) global.temp.riddleData = {};
                global.temp.riddleData[event.senderID] = riddle;

                return message.reply(getLang("riddle", riddle.q), (err, info) => {
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
                const userAnswer = args.join(" ").toLowerCase();
                const riddle = global.temp.riddleData?.[event.senderID];

                if (!riddle) return message.reply("No riddle found!");

                if (userAnswer === riddle.a.toLowerCase()) {
                        // Add coin reward for correct answer
                        const reward = 40;
                        let userData = await usersData.get(event.senderID, "data.economy");
                        if (!userData) userData = { wallet: 0, bank: 0 };
                        userData.wallet = (userData.wallet || 0) + reward;
                        await usersData.set(event.senderID, userData, "data.economy");
                        
                        delete global.temp.riddleData[event.senderID];
                        return message.reply(getLang("correct") + "\n\n💰 +" + reward + " coins!");
                } else {
                        delete global.temp.riddleData[event.senderID];
                        return message.reply(getLang("wrong", riddle.a));
                }
        }
};
