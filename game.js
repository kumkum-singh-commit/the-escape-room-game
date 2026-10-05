const app = document.getElementById("app");
let L, score = 0, step = 0, hints = 0, pre = 0, post = 0, secs = 0, missed = [];
const MAX = 208;
setInterval(() => { secs++; bar(); }, 1000);

const titles = ["Welcome", "Pre-Quiz", "Act 1: Recon", "Act 1: Phishing Builder", "Act 1: Phone Pretext",
  "Act 2: Inbox Triage", "Act 2: Vishing", "Act 2: USB Drop", "Act 2: Tailgating", "Act 2: MFA Fatigue", "Post-Quiz", "Results"];
const rooms = [intro, () => quiz("pre"), recon, builder, () => scenario(0), inbox,
  () => scenario(1), () => scenario(2), () => scenario(3), () => scenario(4), () => quiz("post"), finish];

function bar() {
  document.getElementById("progress").textContent =
    `Room ${step + 1}/${rooms.length} | ${titles[step]} | Score: ${score} | ⏱ ${secs}s`;
}
function go() { bar(); rooms[step](); }
function nextRoom() { step++; go(); }
function feedback(msg) {
  bar();
  document.getElementById("fb").innerHTML = `<p>${msg}</p><button onclick="nextRoom()">Next room →</button>`;
}
const hintHTML = '<button class="clue" id="hb">💡 Hint (-3 pts)</button><span id="ht" class="why"></span>';
function wireHint(text) {
  const b = document.getElementById("hb");
  b.onclick = () => { hints++; score = Math.max(0, score - 3); b.disabled = true;
    document.getElementById("ht").textContent = " " + text; bar(); };
}

function intro() {
  app.innerHTML = `<h1>🔐 NovaTech Escape Room</h1>
    <p>NovaTech Solutions is a fictional company. In <b>Act 1</b> you play the attacker and learn how
    social engineering works. In <b>Act 2</b> you become the defender and must spot the same tricks.
    Hints cost points, and the inbox room is timed.</p>
    <p><i>Everything is simulated. No real emails are sent and no personal data is collected.</i></p>
    <button onclick="nextRoom()">Start</button>`;
}

function quiz(kind) {
  let i = 0, right = 0;
  const show = () => {
    if (i === L.quiz.length) {
      kind === "pre" ? pre = right : post = right;
      app.innerHTML = `<h2>${kind === "pre" ? "Pre" : "Post"}-quiz score: ${right}/${L.quiz.length}</h2><div id="fb"></div>`;
      return feedback(kind === "pre" ? "Baseline saved. Now let's play." : "See your improvement on the results screen.");
    }
    const q = L.quiz[i];
    app.innerHTML = `<h2>${kind === "pre" ? "Pre" : "Post"}-Quiz ${i + 1}/${L.quiz.length}</h2><p>${q.q}</p>`;
    q.o.forEach((t, j) => {
      const b = document.createElement("button");
      b.textContent = t;
      b.onclick = () => { if (j === q.a) right++; i++; show(); };
      app.appendChild(b);
    });
  };
  show();
}

function recon() {
  const picked = new Set();
  app.innerHTML = `<h2>🕵️ Attacker: Recon</h2>
    <p>You are browsing NovaTech's website and social media. Select details useful for a believable phishing email.</p>
    <div id="clues"></div><button id="done">Done</button><div id="fb"></div>`;
  L.clues.forEach((c, i) => {
    const b = document.createElement("button");
    b.className = "clue"; b.textContent = c.text;
    b.onclick = () => { picked.has(i) ? picked.delete(i) : picked.add(i); b.classList.toggle("on"); };
    document.getElementById("clues").appendChild(b);
  });
  document.getElementById("done").onclick = (e) => {
    e.target.disabled = true;
    let pts = 0;
    picked.forEach(i => pts += L.clues[i].useful ? 10 : -5);
    score += Math.max(pts, 0);
    feedback("Attackers use OSINT (names, vendors, email formats) to make phishing believable. The menu and picnic photo were noise. (MITRE ATT&CK T1589, T1591)");
  };
}

function builder() {
  app.innerHTML = `<h2>🎣 Attacker: Build the bait</h2>
    <label>Sender address</label>
    <select id="s"><option value="20">ceo.priya@gmail.com</option>
      <option value="50">priya.mehta@novatech-secure.com</option>
      <option value="10">promo@randomdeals.biz</option></select>
    <label>Subject line</label>
    <select id="t"><option value="10">Hello</option>
      <option value="40">URGENT: CloudPay invoice overdue, pay within 1 hour</option>
      <option value="5">Monthly newsletter</option></select>
    <button id="send">Send (simulated)</button><div id="fb"></div>`;
  document.getElementById("send").onclick = (e) => {
    e.target.disabled = true;
    const pct = +document.getElementById("s").value + +document.getElementById("t").value;
    score += Math.round(pct / 5);
    feedback(`Success chance: <b>${pct}%</b>. Strongest combo: <b>lookalike domain</b> + <b>urgency</b> + <b>authority</b>. Remember them, because in Act 2 you hunt for them. (T1566 Phishing)`);
  };
}

function scenario(n) {
  const s = L.scenarios[n];
  app.innerHTML = `<h2>${s.title}</h2><p>${s.text}</p><div id="opts"></div>${hintHTML}<div id="fb"></div>`;
  wireHint(s.hint);
  s.opts.forEach(o => {
    const b = document.createElement("button");
    b.textContent = o.t;
    b.onclick = () => {
      document.querySelectorAll("#opts button").forEach(x => x.disabled = true);
      score += o.p;
      if (o.p < 20 && s.act === 2) missed.push(s.tag);
      feedback((o.p === 20 ? "✅ " : "❌ ") + o.why + `<br><i>${s.ref}</i>`);
    };
    document.getElementById("opts").appendChild(b);
  });
}

function inbox() {
  let t = 60, over = false;
  app.innerHTML = `<h2>🛡️ Defender: Inbox Triage</h2>
    <p>Mark every email before time runs out: <b id="cd">60</b>s</p>${hintHTML}
    <div id="list"></div><div id="fb"></div>`;
  wireHint("Check the exact domain, then ask: is it rushing me or asking for money, codes or a login?");
  const mails = [];
  const end = () => {
    if (over) return; over = true; clearInterval(tm);
    mails.forEach(m => { if (!m.done) m.reveal(null); });
    feedback("Check the real domain, the urgency, and what is being asked of you.");
  };
  const tm = setInterval(() => { t--; document.getElementById("cd").textContent = t; if (t <= 0) end(); }, 1000);
  L.emails.forEach(e => {
    const d = document.createElement("div");
    d.className = "mail";
    d.innerHTML = `<b>From:</b> <span class="f"></span><br><b>Subject:</b> <span class="s"></span><p class="b"></p>
      <button>🎣 Phishing</button><button>✅ Safe</button><div class="why"></div>`;
    d.querySelector(".f").textContent = e.from;
    d.querySelector(".s").textContent = e.subject;
    d.querySelector(".b").textContent = e.body;
    const [b1, b2] = d.querySelectorAll("button");
    d.reveal = (says) => {
      d.done = true; b1.disabled = b2.disabled = true;
      const ok = says === e.phish;
      if (ok) score += 10; else if (e.phish) missed.push(e.tag);
      d.classList.add(ok ? "good" : "bad");
      d.querySelector(".why").textContent = (ok ? "✅ Correct. " : "❌ Missed. ") + e.why;
      bar();
    };
    b1.onclick = () => { d.reveal(true); if (mails.every(m => m.done)) end(); };
    b2.onclick = () => { d.reveal(false); if (mails.every(m => m.done)) end(); };
    mails.push(d);
    document.getElementById("list").appendChild(d);
  });
}

function finish() {
  const pct = Math.round((score / MAX) * 100);
  const rank = pct >= 80 ? "🏆 Security Champion" : pct >= 50 ? "🛡️ Alert Employee" : "⚠️ Needs Training";
  const uniq = [...new Set(missed)];
  app.innerHTML = `<h1>Results</h1>
    <h2>${score} / ${MAX} (${pct}%) ${rank}</h2>
    <p>Quiz improvement: <b>${pre}/5 → ${post}/5</b> | Hints used: ${hints} | Time: ${secs}s</p>
    <h3>Red flags you missed</h3>
    <p>${uniq.length ? uniq.join(", ") : "None. Great job!"}</p>
    <ul><li>Attackers research you before they strike.</li>
    <li>Lookalike domains + urgency + authority = red flags.</li>
    <li>Never approve unexpected MFA prompts, never share OTPs, never plug in unknown USBs. Report instead.</li></ul>
    <button onclick="location.reload()">Play again</button>`;
  fetch("/api/result", { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ score, pre, post, hints, seconds: secs, missed: uniq }) }).catch(() => {});
}

fetch("levels.json").then(r => r.json()).then(d => { L = d; go(); })
  .catch(() => { app.textContent = "Could not load levels.json. Run the game with: node server.js"; });