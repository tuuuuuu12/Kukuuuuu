module.exports = {
        config: {
                name: "rps",
                version: "1.0",
                author: "NeoKEX",
                countDown: 3,
                role: 0,
                description: {
                        vi: "Chơi Rock Paper Scissors với bot",
                        en: "Play Rock Paper Scissors with bot"
                },
                category: "games",
                guide: {
                        vi: "   {pn} <rock|paper|scissors> - Chơi với bot",
                        en: "   {pn} <rock|paper|scissors> - Play with bot"
                }
        },

        langs: {
                vi: {
                        invalidChoice: "Lựa chọn không hợp lệ! Sử dụng: rock, paper, hoặc scissors",
                        result: "🎮 **ROCK PAPER SCISSORS**\nBạn chọn: %1\nBot chọn: %2\n%3",
                        win: "🎉 Bạn thắng!",
                        lose: "😢 Bạn thua!",
                        tie: "🤝 Hòa!"
                },
                en: {
                        invalidChoice: "Invalid choice! Use: rock, paper, or scissors",
                        result: "🎮 **ROCK PAPER SCISSORS**\nYou chose: %1\nBot chose: %2\n%3",
                        win: "🎉 You win!",
                        lose: "😢 You lose!",
                        tie: "🤝 Draw!"
                }
        },

        onStart: async function ({ message, args, getLang, event, usersData }) {
                const choices = ["rock", "paper", "scissors"];
                const userChoice = args[0]?.toLowerCase();

                if (!choices.includes(userChoice)) {
                        return message.reply(getLang("invalidChoice"));
                }

                const botChoice = choices[Math.floor(Math.random() * choices.length)];
                let result;
                let reward = 0;

                if (userChoice === botChoice) {
                        result = getLang("tie");
                        reward = 10;
                } else if (
                        (userChoice === "rock" && botChoice === "scissors") ||
                        (userChoice === "paper" && botChoice === "rock") ||
                        (userChoice === "scissors" && botChoice === "paper")
                ) {
                        result = getLang("win");
                        reward = 25;
                } else {
                        result = getLang("lose");
                        reward = 5;
                }

                // Add coin & EXP reward
                let userData = await usersData.get(event.senderID, "data.economy");
                if (!userData) userData = { wallet: 0, bank: 0, level: 1, exp: 0 };
                
                let expGain = reward > 20 ? 10 : reward > 10 ? 5 : 2;
                userData.wallet = (userData.wallet || 0) + reward;
                userData.exp = (userData.exp || 0) + expGain;
                
                const expNeeded = 100 + (userData.level - 1) * 50;
                if (userData.exp >= expNeeded) {
                        userData.level = (userData.level || 1) + 1;
                        userData.exp = 0;
                }
                
                await usersData.set(event.senderID, userData, "data.economy");

                const levelUp = userData.exp === 0 && reward > 20 ? "\n\n🎉 **LEVEL UP!** You are now level " + userData.level + "!" : "";
                return message.reply(getLang("result", userChoice, botChoice, result) + "\n\n💰 +" + reward + " coins | 💫 +" + expGain + " EXP" + levelUp);
        }
};
