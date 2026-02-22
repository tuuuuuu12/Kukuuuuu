const allOnEvent = global.GoatBot.onEvent;

const fs = require("fs");
const cron = require("node-cron");
const greetings = {
  eveningDinner: [
    { time: "8:25 PM", message: "etits" }
  ],
  lateNightSnack: [
    { time: "12:00 AM", message: "Happy new year @everyone" },
  ],
};

  module.exports = {
  config: {
    name: "autogreet",
    version: "1.1",
    author: "Zed",
    description: "Autogreeting",
    category: "events"
  },

onStart: async ({ api, args, message, event, threadsData, usersData, dashBoardData, threadModel, userModel, dashBoardModel, role, commandName }) => {

cron.schedule('0 8 * * *', () => {
  sendRandomGreeting(greetings.morning);
});

cron.schedule('0 12 * * *', () => {
  sendRandomGreeting(greetings.lunchtime);
});

cron.schedule('0 15 * * *', () => {
  sendRandomGreeting(greetings.afternoonSnack);
});

cron.schedule('0 18 * * *', () => {
  sendRandomGreeting(greetings.eveningDinner);
});

cron.schedule('0 23 * * *', () => {
  sendRandomGreeting(greetings.lateNightSnack);
});

function sendRandomGreeting(greetingArray) {
  const randomIndex = Math.floor(Math.random() * greetingArray.length);
  const { time, message } = greetingArray[randomIndex];
  console.log(`[${time}] ${message}`);
}
}
};
