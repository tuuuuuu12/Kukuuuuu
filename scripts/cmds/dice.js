module.exports = {
        config: {
                name: "dice",
                version: "1.0",
                author: "NeoKEX",
                countDown: 2,
                role: 0,
                description: {
                        vi: "Lăn xúc xắc",
                        en: "Roll the dice"
                },
                category: "games",
                guide: {
                        vi: "   {pn} - Lăn 1 xúc xắc (1-6)\n   {pn} <số> - Lăn xúc xắc <số> lần",
                        en: "   {pn} - Roll 1 dice (1-6)\n   {pn} <number> - Roll dice <number> times"
                }
        },

        langs: {
                vi: {
                        rolled: "🎲 Bạn lăn được: %1",
                        total: "📊 Tổng cộng: %1",
                        invalid: "Số lần lăn phải từ 1-20!"
                },
                en: {
                        rolled: "🎲 You rolled: %1",
                        total: "📊 Total: %1",
                        invalid: "Number of rolls must be 1-20!"
                }
        },

        onStart: async function ({ message, args, getLang, event, usersData }) {
                let times = parseInt(args[0]) || 1;

                if (times < 1 || times > 20) {
                        return message.reply(getLang("invalid"));
                }

                const rolls = [];
                for (let i = 0; i < times; i++) {
                        rolls.push(Math.floor(Math.random() * 6) + 1);
                }

                const total = rolls.reduce((a, b) => a + b, 0);
                const rollText = rolls.join(" + ");
                
                // Add coin & EXP reward
                const reward = times * 5;
                let userData = await usersData.get(event.senderID, "data.economy");
                if (!userData) userData = { wallet: 0, bank: 0, level: 1, exp: 0 };
                
                const expGain = times * 2;
                userData.wallet = (userData.wallet || 0) + reward;
                userData.exp = (userData.exp || 0) + expGain;
                
                const expNeeded = 100 + (userData.level - 1) * 50;
                if (userData.exp >= expNeeded) {
                        userData.level = (userData.level || 1) + 1;
                        userData.exp = 0;
                }
                
                await usersData.set(event.senderID, userData, "data.economy");

                const levelUp = userData.exp === 0 ? "\n\n🎉 **LEVEL UP!** You are now level " + userData.level + "!" : "";
                if (times === 1) {
                        return message.reply(getLang("rolled", rolls[0]) + "\n\n💰 +" + reward + " coins | 💫 +" + expGain + " EXP" + levelUp);
                }

                return message.reply(getLang("rolled", rollText) + "\n" + getLang("total", total) + "\n\n💰 +" + reward + " coins | 💫 +" + expGain + " EXP" + levelUp);
        }
};
