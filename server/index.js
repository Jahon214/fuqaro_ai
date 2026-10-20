import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

// Load environment variables
dotenv.config();

import { db } from "./db.js";
import { evaluate, initials, TYPES } from "./engine.js";
import { botManager } from "./bots/botManager.js";
import { analyzeCaseWithAI } from "./aiService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// 1. Get all cases
app.get("/api/cases", (req, res) => {
  const cases = db.getAllCases();
  res.json({ success: true, cases });
});

// 2. Get single case
app.get("/api/cases/:id", (req, res) => {
  const c = db.getCaseById(req.params.id);
  if (!c) {
    return res.status(404).json({ success: false, message: "Case not found" });
  }
  res.json({ success: true, case: c });
});

// 3. Create case (Intake submission)
app.post("/api/cases", async (req, res) => {
  try {
    const p = req.body;

    if (!p.name || p.age == null || !p.mfy || !p.type) {
      return res.status(400).json({
        success: false,
        message: "Majburiy maydonlar: Ism, yoshi, MFY, murojaat turi"
      });
    }

    const out = evaluate(p, db.cfg);
    const caseId = "Q-" + String(Date.now()).slice(-6);

    // Run AI Analysis for Admin Advisor
    let aiAnalysis = null;
    try {
      aiAnalysis = await analyzeCaseWithAI(p, out, db.cfg);
    } catch (err) {
      console.warn("AI analysis error:", err.message);
    }

    const newCase = {
      id: caseId,
      ts: Date.now(),
      ini: initials(p.name),
      name: p.name,
      age: Number(p.age),
      gender: p.gender || "",
      mfy: p.mfy,
      type: p.type,
      members: p.members != null ? Number(p.members) : null,
      children: p.children != null ? Number(p.children) : 0,
      income: p.income != null ? Number(p.income) : null,
      housing: p.housing || "",
      work: p.work || "",
      edu: p.edu || "",
      disab: p.disab != null && p.disab !== "" ? Number(p.disab) : null,
      debt: p.debt || "",
      notes: p.notes || "",
      pc: out.pc,
      conf: out.conf,
      poor: out.poor,
      missing: out.missing,
      recs: out.recs,
      decisions: p.decisions || {},
      aiAnalysis,
      example: false,
      source: p.source || "web",
      telegramUserId: p.telegramUserId || null
    };

    db.addCase(newCase);

    // Notify Admin Bot in background
    botManager.broadcastNewCase(newCase).catch(err => {
      console.error("Error notifying admins:", err);
    });

    res.json({
      success: true,
      case: newCase,
      evaluation: out,
      aiAnalysis
    });
  } catch (err) {
    console.error("Error saving case:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// AI Direct Analysis API
app.post("/api/ai/analyze", async (req, res) => {
  try {
    const { p, out } = req.body;
    const evalOut = out || evaluate(p, db.cfg);
    const analysis = await analyzeCaseWithAI(p, evalOut, db.cfg);
    res.json({ success: true, aiAnalysis: analysis });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Re-analyze existing case with AI
app.post("/api/cases/:id/re-analyze", async (req, res) => {
  try {
    const c = db.getCaseById(req.params.id);
    if (!c) return res.status(404).json({ success: false, message: "Case not found" });
    const evalOut = { recs: c.recs, pc: c.pc, conf: c.conf, poor: c.poor, missing: c.missing };
    const analysis = await analyzeCaseWithAI(c, evalOut, db.cfg);
    c.aiAnalysis = analysis;
    db.saveCases(db.cases);
    res.json({ success: true, aiAnalysis: analysis, case: c });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Update case decisions
app.put("/api/cases/:id/decisions", (req, res) => {
  const { decisions } = req.body;
  if (!decisions) {
    return res.status(400).json({ success: false, message: "Decisions required" });
  }

  const updated = db.updateCaseDecisions(req.params.id, decisions);
  if (!updated) {
    return res.status(404).json({ success: false, message: "Case not found" });
  }

  res.json({ success: true, case: updated });
});

// 5. Reseed sample cases
app.post("/api/cases/reseed", (req, res) => {
  const seeds = db.reseedCases();
  res.json({ success: true, cases: seeds });
});

// 6. Wipe cases
app.delete("/api/cases", (req, res) => {
  db.wipeCases();
  res.json({ success: true, message: "Cases wiped successfully" });
});

// 7. Stats & analytics
app.get("/api/stats", (req, res) => {
  const stats = db.getStats();
  res.json({ success: true, stats });
});

// 8. Configuration
app.get("/api/cfg", (req, res) => {
  res.json({ success: true, cfg: db.cfg });
});

app.put("/api/cfg", (req, res) => {
  const { threshold, mfys, webAppUrl } = req.body;
  const updates = {};
  if (threshold != null && !isNaN(threshold)) updates.threshold = Number(threshold);
  if (Array.isArray(mfys)) updates.mfys = mfys;
  if (webAppUrl) updates.webAppUrl = webAppUrl;

  db.saveConfig(updates);
  res.json({ success: true, cfg: db.cfg });
});

// 9. Export CSV
app.get("/api/export/csv", (req, res) => {
  const cases = db.getAllCases();
  const rows = [["raqam", "sana", "fuqaro_ism", "yosh", "jins", "mfy", "murojaat", "daromad", "tavsiyalar_soni", "tasdiqlangan", "jami_qaror"]];

  cases.forEach(c => {
    const ds = Object.values(c.decisions || {});
    rows.push([
      c.id,
      new Date(c.ts).toISOString().slice(0, 10),
      c.name || c.ini,
      c.age,
      c.gender || "",
      c.mfy,
      TYPES[c.type] || c.type,
      c.income || 0,
      (c.recs || []).length,
      ds.filter(d => d.d === "ok").length,
      ds.length
    ]);
  });

  const txt = rows
    .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="fuqaro_ai_qabullar.csv"');
  res.send("\uFEFF" + txt);
});

// 10. Bot status & test notification
app.get("/api/bots/status", (req, res) => {
  res.json({ success: true, status: botManager.getStatus() });
});

app.post("/api/bots/test-notify", async (req, res) => {
  const testCase = {
    id: "TEST-" + String(Date.now()).slice(-4),
    ts: Date.now(),
    ini: "S.S.",
    name: "Sinov Foydalanuvchi",
    age: 30,
    gender: "Erkak",
    mfy: "Xovosobod",
    type: "ish",
    members: 4,
    children: 2,
    income: 2800000,
    pc: 700000,
    conf: 100,
    poor: true,
    notes: "Bu bot xabarnoma tizimini sinash uchun yuborilgan test murojaat.",
    recs: [
      {
        id: "bandlik",
        title: "Bandlik xizmatida ro'yxatdan o'tish va ish tanlash",
        pri: 3,
        why: ["Fuqaro ishsiz", "Murojaat turi: ish qidirish"],
        where: "Tumanning bandlik markazi yoki mahalla yettiligi",
        docs: ["Pasport", "Mehnat daftarchasi"],
        steps: ["Bandlik markaziga borish", "Ro'yxatdan o'tish"]
      }
    ],
    decisions: {}
  };

  await botManager.broadcastNewCase(testCase);
  res.json({ success: true, message: "Test xabarnomasi yuborildi", testCase });
});

// Serve frontend build if available
const clientDist = path.join(__dirname, "..", "client", "dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get("*", (req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

// Start server and initialize bots
app.listen(PORT, async () => {
  console.log(`\n🚀 Xovos Fuqaro AI Server is running at http://localhost:${PORT}`);
  console.log(`📡 API endpoints: http://localhost:${PORT}/api/cases`);
  await botManager.init();
});
