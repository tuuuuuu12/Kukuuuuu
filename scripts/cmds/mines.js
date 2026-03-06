// mines.js (fixed)
const fs = require("fs");
const path = require("path");
const { createCanvas } = require("canvas");

module.exports.config = {
  name: "mines",
  aliases: ["mine","minesweeper"],
  version: "1.2",
  author: "ChatGPT",
  shortDescription: "Mini Mines (9 blocks, 3 bombs) + GBank",
  category: "game",
  guide: { en: "{p}mines → Start" }
};

const sessionsFile = path.join(__dirname, "minesData.json");
const gbankFile = path.join(__dirname, "gbank_balance.json");

if (!fs.existsSync(sessionsFile)) fs.writeFileSync(sessionsFile, JSON.stringify({}, null, 2));
if (!fs.existsSync(gbankFile)) fs.writeFileSync(gbankFile, JSON.stringify({}, null, 2));

function loadSessions(){ return JSON.parse(fs.readFileSync(sessionsFile)); }
function saveSessions(d){ fs.writeFileSync(sessionsFile, JSON.stringify(d, null, 2)); }

function loadGBank(){ return JSON.parse(fs.readFileSync(gbankFile)); }
function saveGBank(d){ fs.writeFileSync(gbankFile, JSON.stringify(d, null, 2)); }
function ensureUser(u){
  const db = loadGBank();
  if (!db[u]) db[u] = { balance: 500, bank: 0, history: [] };
  // extra safety: make sure history exists and is an array
  if (!Array.isArray(db[u].history)) db[u].history = [];
  saveGBank(db);
}
function updateMoney(u, win = 0, lose = 0, note = ""){
  const db = loadGBank();
  if (!db[u]) db[u] = { balance: 500, bank: 0, history: [] };
  // safety: ensure history is an array before pushing
  if (!Array.isArray(db[u].history)) db[u].history = [];

  db[u].balance += win;
  db[u].balance -= lose;
  if (win) db[u].history.push(`Win: +${win}$ ${note}`);
  if (lose) db[u].history.push(`Lose: -${lose}$ ${note}`);
  saveGBank(db);
}

async function sendGameResult(api, threadID, uid, title, changeAmount){
  const db = loadGBank();
  const user = db[uid] || { balance: 0, bank: 0, history: [] };
  const canvas = createCanvas(520,220);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = "#0f1724"; ctx.fillRect(0,0,520,220);
  ctx.fillStyle = "#fff"; ctx.font = "20px Arial"; ctx.fillText(title, 20, 40);
  ctx.font = "16px Arial";
  ctx.fillText(`Change: ${changeAmount >= 0 ? "+"+changeAmount : changeAmount}$`, 20, 80);
  ctx.fillText(`Wallet: ${user.balance}$`, 20, 120);
  ctx.fillText(`Bank: ${user.bank}$`, 20, 150);
  const file = path.join(__dirname, "cache", `mines_res_${Date.now()}.png`);
  if (!fs.existsSync(path.dirname(file))) fs.mkdirSync(path.dirname(file));
  fs.writeFileSync(file, canvas.toBuffer());
  await api.sendMessage({ body: "", attachment: fs.createReadStream(file) }, threadID);
  setTimeout(()=>fs.existsSync(file)&&fs.unlinkSync(file), 9000);
}

function genBoard(){
  const positions = Array.from({length:9}, (_,i)=>i);
  const bombs = [];
  while (bombs.length < 3){
    const pick = positions.splice(Math.floor(Math.random()*positions.length),1)[0];
    bombs.push(pick);
  }
  return { bombs, picks: [] };
}

module.exports.onStart = async function({ api, event }){
  const { threadID, senderID } = event;
  ensureUser(senderID);
  const data = loadSessions();
  data[threadID] = { owner: senderID, board: genBoard(), state: "playing", reward: 10 };
  saveSessions(data);

  const img = await drawBoard([]);
  const msg = await api.sendMessage({ body: "🧨 Mines started! 9 boxes, 3 bombs.\nReply with number 1-9 to pick a box. Each safe pick increases reward.\nType 'c' or 'cash' any time to cash out and receive current reward.", attachment: fs.createReadStream(img) }, threadID);
  global.GoatBot.onReply.set(msg.messageID, { commandName: module.exports.config.name });
  setTimeout(()=>fs.existsSync(img)&&fs.unlinkSync(img), 8000);
};

module.exports.onReply = async function({ api, event, Reply }){
  const { threadID, senderID } = event;
  const data = loadSessions();
  const session = data[threadID];
  if (!session) return;
  if (session.state !== "playing") return api.sendMessage("Game not active.", threadID);
  if (session.owner !== senderID) return api.sendMessage("Only game starter can play.", threadID);

  const body = String(event.body || "").trim();
  // CASHOUT option: user can type 'c' or 'cash' to take current reward
  if (body.toLowerCase() === 'c' || body.toLowerCase() === 'cash'){
    const payout = session.reward || 0;
    // give the player their accumulated reward
    updateMoney(senderID, payout, 0, "Mines cashout");
    const img = await drawBoard(session.board.picks, session.board.bombs);
    await api.sendMessage({ body: `💰 You cashed out: ${payout}$.`, attachment: fs.createReadStream(img) }, threadID);
    await sendGameResult(api, threadID, senderID, "Cashed out", payout);
    delete data[threadID]; saveSessions(data);
    return;
  }

  const pick = parseInt(body, 10);
  if (isNaN(pick) || pick < 1 || pick > 9) return;
  const idx = pick - 1;
  // ensure picks array exists
  if (!Array.isArray(session.board.picks)) session.board.picks = [];
  if (session.board.picks.includes(idx)) return api.sendMessage("Already picked that box.", threadID);

  session.board.picks.push(idx);

  if (session.board.bombs.includes(idx)){
    session.state = "lost";
    saveSessions(data);
    // penalty 50$ (higher risk)
    updateMoney(senderID, 0, 50, "Mines bomb");
    const img = await drawBoard(session.board.picks, session.board.bombs);
    await api.sendMessage({ body: `💥 Boom! You hit a bomb. You lost. Penalty: 50$`, attachment: fs.createReadStream(img) }, threadID);
    await sendGameResult(api, threadID, senderID, "Bomb! You lost", -50);
    delete data[threadID]; saveSessions(data);
    return;
  } else {
    // safe pick gives +10..50 increasing: we'll give +10 each safe pick
    session.reward += 10;
    saveSessions(data);
    if (session.board.picks.length === 6){
      // all safe found -> bonus +200
      const total = session.reward + 200;
      updateMoney(senderID, total, 0, "Mines cleared");
      const img = await drawBoard(session.board.picks);
      await api.sendMessage({ body: `🎉 Congrats! You cleared all safe boxes. Reward: ${total}$`, attachment: fs.createReadStream(img) }, threadID);
      await sendGameResult(api, threadID, senderID, "You cleared Mines!", total);
      delete data[threadID]; saveSessions(data);
      return;
    } else {
      const img = await drawBoard(session.board.picks);
      const msg = await api.sendMessage({ body: `Safe! Current reward: ${session.reward}$. Keep picking (1-9). Type 'c' to cash out.`, attachment: fs.createReadStream(img) }, threadID);
      global.GoatBot.onReply.set(msg.messageID, { commandName: module.exports.config.name });
      setTimeout(()=>fs.existsSync(img)&&fs.unlinkSync(img), 8000);
      return;
    }
  }
};

async function drawBoard(picks = [], bombs = []){
  const size = 300;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = "#fafafa";
  ctx.fillRect(0,0,size,size);
  ctx.fillStyle = "#333";
  ctx.font = "20px Arial";
  ctx.fillText("Mines", 20, 30);

  const gap = 10;
  const cell = (size - 2 * gap) / 3;
  for (let r = 0; r < 3; r++){
    for (let c = 0; c < 3; c++){
      const i = r * 3 + c;
      const x = gap + c * cell;
      const y = 50 + r * cell;
      ctx.fillStyle = (Array.isArray(picks) && picks.includes(i)) ? "#8fd18f" : "#ddd";
      ctx.fillRect(x, y, cell - 8, cell - 8);
      ctx.strokeStyle = "#bbb";
      ctx.strokeRect(x, y, cell - 8, cell - 8);
      ctx.fillStyle = "#333";
      ctx.fillText(String(i+1), x + (cell - 8)/2 - 5, y + (cell - 8)/2 + 8);
      if (Array.isArray(bombs) && bombs.includes(i)){
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(x + (cell - 8)/2, y + (cell - 8)/2, 12, 0, Math.PI*2);
        ctx.fill();
      }
    }
  }

  const file = path.join(__dirname, "cache", `mines_${Date.now()}.png`);
  if (!fs.existsSync(path.dirname(file))) fs.mkdirSync(path.dirname(file));
  fs.writeFileSync(file, canvas.toBuffer());
  return file;
}
