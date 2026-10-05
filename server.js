const express = require("express");
const fs = require("fs");
const app = express();
const FILE = "results.json";
const hits = {};

app.use(express.json({ limit: "10kb" }));            // limit payload size
app.use((req, res, next) => {                         // basic security headers
  res.set("X-Content-Type-Options", "nosniff");
  res.set("X-Frame-Options", "DENY");
  next();
});
app.use(express.static(__dirname, { dotfiles: "deny" }));

function limit(req, res, next) {                      // rate limiting: 30 requests/min per IP
  const now = Date.now(), ip = req.ip;
  hits[ip] = (hits[ip] || []).filter(t => now - t < 60000);
  if (hits[ip].length >= 30) return res.status(429).end();
  hits[ip].push(now);
  next();
}
const load = () => fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE)) : [];
const num = (v, max) => Math.min(Math.max(Number.isFinite(+v) ? +v : 0, 0), max);

app.post("/api/result", limit, (req, res) => {        // input validation, no personal data stored
  const b = req.body || {};
  const missed = Array.isArray(b.missed) ? b.missed.slice(0, 10).map(x => String(x).slice(0, 40)) : [];
  const all = load();
  all.push({ score: num(b.score, 300), pre: num(b.pre, 5), post: num(b.post, 5),
    hints: num(b.hints, 50), seconds: num(b.seconds, 86400), missed, at: new Date().toISOString() });
  fs.writeFileSync(FILE, JSON.stringify(all));
  res.json({ ok: true });
});

app.get("/api/stats", (req, res) => {
  const a = load();
  const avg = k => a.length ? +(a.reduce((s, x) => s + x[k], 0) / a.length).toFixed(1) : 0;
  const counts = {};
  a.forEach(x => x.missed.forEach(m => counts[m] = (counts[m] || 0) + 1));
  const missed = Object.entries(counts).map(([tag, count]) => ({ tag, count })).sort((x, y) => y.count - x.count);
  res.json({ players: a.length, avgScore: avg("score"), avgPre: avg("pre"), avgPost: avg("post"),
    missed, recent: a.slice(-10).reverse() });
});

app.listen(process.env.PORT || 3000, () => console.log("Running on http://localhost:3000"));