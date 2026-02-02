import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import { Telegraf, Markup } from "telegraf";

const app = express();
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ===== DATABASE ===== */
const db = new Database("data.db");

db.exec(`
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  price INTEGER
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  total INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

if (db.prepare("SELECT COUNT(*) as c FROM products").get().c === 0) {
  db.prepare("INSERT INTO products (name, price) VALUES (?, ?)").run("Produit A", 1000);
  db.prepare("INSERT INTO products (name, price) VALUES (?, ?)").run("Produit B", 1500);
}

/* ===== API ===== */
app.use("/app-assets", express.static(path.join(__dirname, "webapp")));

app.get("/app", (req, res) => {
  res.sendFile(path.join(__dirname, "webapp/index.html"));
});

app.get("/api/products", (req, res) => {
  res.json(db.prepare("SELECT * FROM products").all());
});

app.post("/api/order", (req, res) => {
  const { user_id, total } = req.body;
  db.prepare("INSERT INTO orders (user_id, total) VALUES (?, ?)").run(user_id, total);
  res.json({ ok: true });
});

/* ===== SERVER ===== */
app.listen(process.env.PORT || 3000, () => {
  console.log("🌐 Server running");
});

/* ===== BOT ===== */
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start(ctx => {
  ctx.reply(
    "Bienvenue 👋\nClique pour ouvrir la mini-app",
    Markup.inlineKeyboard([
      Markup.button.webApp(
        "🛒 Ouvrir la mini-app",
        `${process.env.PUBLIC_BASE_URL}/app`
      )
    ])
  );
});

bot.launch();
console.log("🤖 Bot lancé");