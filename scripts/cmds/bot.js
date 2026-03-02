const axios = require("axios");

const API = "https://api.noobs-api.rf.gd/dipto";
const prefixes = ["bby","janu","বাবু","babu","bbu","botli","bot","baby","বেবি","জানু","বট","hi","hlw","babe"];
const reacts = ["❤️","😍","😘","😎","🥰","😂","😇","🤖","😉","🔥","💋"];

const cutPrefix = (t = "") => {
  t = t.toLowerCase().trim();
  const p = prefixes.find(x => t.startsWith(x));
  return p ? t.slice(p.length).trim() : t;
};

const rand = arr => arr[Math.floor(Math.random() * arr.length)];
const reactMsg = (api, emoji, mid, d = 250) =>
  setTimeout(() => api.setMessageReaction(emoji, mid, () => {}, true), d);

async function getName(api, uid) {
  const info = await api.getUserInfo(uid);
  return info?.[uid]?.name || "বন্ধু";
}

async function ask(text, senderID) {
  try {
    const url = `${API}/baby?text=${encodeURIComponent(text)}&senderID=${senderID}&font=1`;
    const { data } = await axios.get(url);
    return {
      msg: data?.reply || "🙂 কী বলো বুঝলাম না!",
      apiReact: data?.react
    };
  } catch {
    return {
      msg: "🥹 এই মুহূর্তে আমি উত্তর দিতে পারছি না!",
      apiReact: null
    };
  }
}

module.exports = {
  config: {
    name: "bot",
    version: "1.8.3",
    author: "dipto•AHMED TARIF",
    role: 0,
    description: {
      bn: "কোনো prefix ছাড়াই বাংলায় কথা বলা বট 🤖"
    },
    category: "Everyone",
    guide: {
      bn: "bby / bot / বাবু লিখে কথা বলা শুরু করো"
    }
  },

  onStart() {},

  async onReply({ api, event }) {
    if (!event.messageReply) return;

    try {
      const text = cutPrefix(event.body || "") || "হ্যালো";
      const name = await getName(api, event.senderID);
      const { msg, apiReact } = await ask(text, event.senderID);

      reactMsg(api, rand(reacts), event.messageID, 200);
      if (apiReact) reactMsg(api, apiReact, event.messageID, 400);

      api.sendMessage(
        {
          body: msg,
          mentions: [{ tag: name, id: event.senderID }]
        },
        event.threadID,
        (err, info) => {
          if (!err)
            global.GoatBot.onReply.set(info.messageID, {
              commandName: "bot",
              type: "reply",
              messageID: info.messageID,
              author: event.senderID
            });
        },
        event.messageID
      );
    } catch (e) {
      api.sendMessage(
        "⚠️ দুঃখিত! রিপ্লাই দিতে সমস্যা হচ্ছে।",
        event.threadID,
        event.messageID
      );
    }
  },

  async onChat({ api, event }) {
    if (event.messageReply) return;
    if (event.senderID == api.getCurrentUserID()) return;

    const body = (event.body || "").trim();
    const low = body.toLowerCase();
    if (!prefixes.some(p => low.startsWith(p))) return;

    const tl = [
      "• বলেন স্যার 😌",
      "• বলেন ম্যাডাম 😌",
      "• ওই মামা, আর ডাকিস না প্লিজ 😡🙂",
      "• আমি কিন্তু রেগে যাচ্ছি 😤",
      "• আজ মনটা ভালো নেই 🙉",
      "• বেশি ডাকলে আম্মু বকা দেবে 🥺",
      "• ভালো হয়ে যাও 😑",
      "• ভুলে যাও আমাকে 😞",
      "• কথা দাও আমাকে পটাবে 😌",
      "• ৩২ তারিখ আমার বিয়ে 🐤"
    ];

    try {
      const parts = low.split(/\s+/);
      const name = await getName(api, event.senderID);

      reactMsg(api, rand(reacts), event.messageID, 200);

      // শুধু prefix লিখলে
      if (parts.length === 1) {
        return api.sendMessage(
          {
            body: `乄 ${name} 乄\n\n𓍯 ${rand(tl)}`,
            mentions: [{ tag: name, id: event.senderID }]
          },
          event.threadID,
          (err, info) => {
            if (!err)
              global.GoatBot.onReply.set(info.messageID, {
                commandName: "bot",
                type: "reply",
                messageID: info.messageID,
                author: event.senderID
              });
          },
          event.messageID
        );
      }

      // prefix + লেখা দিলে
      const text = cutPrefix(low);
      const { msg, apiReact } = await ask(text, event.senderID);
      if (apiReact) reactMsg(api, apiReact, event.messageID, 400);

      api.sendMessage(
        {
          body: msg,
          mentions: [{ tag: name, id: event.senderID }]
        },
        event.threadID,
        (err, info) => {
          if (!err)
            global.GoatBot.onReply.set(info.messageID, {
              commandName: "bot",
              type: "reply",
              messageID: info.messageID,
              author: event.senderID
            });
        },
        event.messageID
      );
    } catch {
      api.sendMessage(
        "⚠️ API এর সাথে সংযোগ করা যাচ্ছে না!",
        event.threadID,
        event.messageID
      );
    }
  }
};
