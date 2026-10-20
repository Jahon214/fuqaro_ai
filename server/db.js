import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateSeedCases } from "./seedData.js";
import { MFYS, TYPES, ageGroup } from "./engine.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");
const CASES_FILE = path.join(DATA_DIR, "cases.json");
const CFG_FILE = path.join(DATA_DIR, "config.json");

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class Database {
  constructor() {
    this.cfg = this.loadConfig();
    this.cases = this.loadCases();
  }

  loadConfig() {
    try {
      if (fs.existsSync(CFG_FILE)) {
        const raw = fs.readFileSync(CFG_FILE, "utf-8");
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error("Error reading config file:", e);
    }
    const defaultCfg = {
      threshold: 1000000,
      mfys: MFYS,
      adminChatIds: [],
      adminBotToken: process.env.ADMIN_BOT_TOKEN || "",
      citizenBotToken: process.env.CITIZEN_BOT_TOKEN || "",
      webAppUrl: process.env.WEBAPP_URL || "http://localhost:5173"
    };
    this.saveConfig(defaultCfg);
    return defaultCfg;
  }

  saveConfig(cfg) {
    this.cfg = { ...this.cfg, ...cfg };
    try {
      fs.writeFileSync(CFG_FILE, JSON.stringify(this.cfg, null, 2), "utf-8");
    } catch (e) {
      console.error("Error writing config file:", e);
    }
  }

  loadCases() {
    try {
      if (fs.existsSync(CASES_FILE)) {
        const raw = fs.readFileSync(CASES_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Error reading cases file:", e);
    }
    // Generate initial seeds if empty
    const seeds = generateSeedCases(this.cfg.threshold || 1000000);
    this.saveCases(seeds);
    return seeds;
  }

  saveCases(cases) {
    this.cases = cases;
    try {
      fs.writeFileSync(CASES_FILE, JSON.stringify(this.cases, null, 2), "utf-8");
    } catch (e) {
      console.error("Error writing cases file:", e);
    }
  }

  getAllCases() {
    return this.cases;
  }

  getCaseById(id) {
    return this.cases.find(c => c.id === id);
  }

  addCase(caseData) {
    this.cases.unshift(caseData);
    this.saveCases(this.cases);
    return caseData;
  }

  updateCaseDecisions(id, decisions) {
    const idx = this.cases.findIndex(c => c.id === id);
    if (idx === -1) return null;

    this.cases[idx].decisions = {
      ...this.cases[idx].decisions,
      ...decisions
    };
    this.saveCases(this.cases);
    return this.cases[idx];
  }

  reseedCases() {
    const seeds = generateSeedCases(this.cfg.threshold || 1000000);
    this.saveCases(seeds);
    return seeds;
  }

  wipeCases() {
    this.saveCases([]);
    return [];
  }

  getStats() {
    const cases = this.cases;
    const total = cases.length;
    const allDec = cases.flatMap(c => Object.values(c.decisions || {}));
    const approvedDec = allDec.filter(d => d.d === "ok").length;
    const acc = allDec.length ? Math.round(100 * approvedDec / allDec.length) : 0;
    const avg = total ? (cases.reduce((s, c) => s + (c.recs ? c.recs.length : 0), 0) / total).toFixed(1) : "0";
    const exampleCount = cases.filter(c => c.example).length;

    // Type distribution
    const typeCounts = new Map();
    cases.forEach(c => {
      const label = TYPES[c.type] || c.type || "Boshqa";
      const g = typeCounts.get(label) || { n: 0, recs: 0, ok: 0, dec: 0 };
      g.n++;
      g.recs += (c.recs ? c.recs.length : 0);
      Object.values(c.decisions || {}).forEach(d => {
        g.dec++;
        if (d.d === "ok") g.ok++;
      });
      typeCounts.set(label, g);
    });

    const byType = [...typeCounts.entries()]
      .map(([name, g]) => ({
        name,
        count: g.n,
        recs: g.recs,
        approvalRate: g.dec ? Math.round(100 * g.ok / g.dec) : null
      }))
      .sort((a, b) => b.count - a.count);

    // Grouping stats helper
    const groupStats = (keyFn) => {
      const m = new Map();
      cases.forEach(c => {
        const k = keyFn(c) || "Ko'rsatilmagan";
        const g = m.get(k) || { n: 0, recs: 0, ok: 0, dec: 0 };
        g.n++;
        g.recs += (c.recs ? c.recs.length : 0);
        Object.values(c.decisions || {}).forEach(d => {
          g.dec++;
          if (d.d === "ok") g.ok++;
        });
        m.set(k, g);
      });
      return [...m.entries()]
        .map(([group, g]) => ({
          group,
          count: g.n,
          avgRecs: g.n ? (g.recs / g.n).toFixed(1) : "0",
          approvalRate: g.dec ? Math.round(100 * g.ok / g.dec) : null,
          isLowSample: g.n < 5
        }))
        .sort((a, b) => b.count - a.count);
    };

    return {
      total,
      avgRecs: avg,
      acceptanceRate: acc,
      exampleCount,
      byType,
      fairness: {
        byAge: groupStats(c => ageGroup(c.age)),
        byGender: groupStats(c => c.gender || "Ko'rsatilmagan"),
        byMfy: groupStats(c => c.mfy || "Ko'rsatilmagan")
      }
    };
  }
}

export const db = new Database();
