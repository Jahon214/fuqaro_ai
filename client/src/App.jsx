import React, { useState, useEffect } from "react";
import { Header } from "./components/Header.jsx";
import { IntakeForm } from "./components/IntakeForm.jsx";
import { ResultView } from "./components/ResultView.jsx";
import { AdminExportModal } from "./components/AdminExportModal.jsx";
import { evaluate, generateSeedCases, calculateStats } from "./constants.js";
import { getAiAnalysis } from "./services/aiService.js";
import { sendCaseToAdminBot } from "./services/telegramNotifier.js";
import { CheckCircle2, Bot } from "lucide-react";

export default function App() {
  const [currentView, setCurrentView] = useState("intake");
  const [currentCase, setCurrentCase] = useState(null);
  const [cases, setCases] = useState([]);
  const [stats, setStats] = useState(null);
  const [config, setConfig] = useState({ threshold: 1000000, mfys: [], webAppUrl: "https://fuqaroxovosai.vercel.app" });
  const [threshold, setThreshold] = useState(1000000);
  const [toast, setToast] = useState(null);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("fuqaro_theme") || "light";
  });

  // Theme application
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.setAttribute("data-theme", "light");
    }
    localStorage.setItem("fuqaro_theme", theme);
  }, [theme]);

  // Check URL query parameters for direct admin access (?admin=true)
  useEffect(() => {
    if (window.location.search && window.location.search.toLowerCase().includes("admin")) {
      setAdminModalOpen(true);
    }
  }, []);

  const toggleTheme = () => {
    setTheme(prev => (prev === "dark" ? "light" : "dark"));
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  // Initial data loading from server or local seed fallback
  const loadData = async () => {
    let currentThreshold = threshold;
    try {
      const [casesRes, statsRes, cfgRes] = await Promise.all([
        fetch("/api/cases").then(r => r.json()).catch(() => ({ cases: [] })),
        fetch("/api/stats").then(r => r.json()).catch(() => ({ stats: null })),
        fetch("/api/cfg").then(r => r.json()).catch(() => ({ cfg: { threshold: 1000000 } }))
      ]);

      if (cfgRes?.cfg) {
        setConfig(cfgRes.cfg);
        if (cfgRes.cfg.threshold) {
          currentThreshold = cfgRes.cfg.threshold;
          setThreshold(cfgRes.cfg.threshold);
        }
      }

      let loadedCases = [];
      if (casesRes?.cases && casesRes.cases.length > 0) {
        loadedCases = casesRes.cases;
      } else {
        const local = localStorage.getItem("fuqaro_local_cases");
        if (local) {
          try {
            const parsed = JSON.parse(local);
            if (Array.isArray(parsed) && parsed.length > 0) {
              loadedCases = parsed;
            }
          } catch(e) {}
        }
        if (!loadedCases || loadedCases.length === 0) {
          loadedCases = generateSeedCases(currentThreshold);
          try { localStorage.setItem("fuqaro_local_cases", JSON.stringify(loadedCases)); } catch(e) {}
        }
      }

      setCases(loadedCases);
      if (statsRes?.stats) {
        setStats(statsRes.stats);
      } else {
        setStats(calculateStats(loadedCases));
      }
    } catch (err) {
      const fallback = generateSeedCases(currentThreshold);
      setCases(fallback);
      setStats(calculateStats(fallback));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Intake Form submission with AI analysis & real-time Admin Bot notification
  const handleIntakeSubmit = async (formData) => {
    showToast("Sun'iy intellekt tahlil qilmoqda va xabarnoma yuborilmoqda...", "success");

    // 1. Evaluate rules and run AI analysis (Gemini or Built-in Copilot)
    const out = evaluate(formData, { threshold });
    const aiAnalysis = await getAiAnalysis(formData, out, { threshold });
    const newCaseId = "Q-" + Math.floor(1000 + Math.random() * 9000);
    
    // Set immediate case
    const initialCase = {
      id: newCaseId,
      ts: Date.now(),
      p: formData,
      out,
      aiAnalysis,
      saved: true
    };
    setCurrentCase(initialCase);
    setCurrentView("result");
    window.scrollTo({ top: 0, behavior: "smooth" });

    // 2. Immediately send notification with full AI analysis to Admin Telegram Bot (@fuqaro_adminbot)
    sendCaseToAdminBot(initialCase, aiAnalysis);

    // 3. Optional live Google Sheets webhook sync
    const sheetWebhook = localStorage.getItem("fuqaro_google_sheet_url");
    if (sheetWebhook && sheetWebhook.startsWith("http")) {
      try {
        fetch(sheetWebhook, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: newCaseId,
            ts: new Date().toLocaleString("uz-UZ"),
            ...formData,
            aiSummary: aiAnalysis.summary || "",
            povertyRisk: aiAnalysis.povertyRisk || "",
            debtRisk: aiAnalysis.debtRisk || "",
            socialPackage: aiAnalysis.socialPackage || "",
            advice: (aiAnalysis.adminAdvice || []).join("; ")
          })
        });
      } catch (e) {}
    }

    // 4. If inside Telegram WebApp, send data back to Telegram
    if (window.Telegram?.WebApp?.sendData) {
      try {
        window.Telegram.WebApp.sendData(JSON.stringify({
          ...formData,
          aiAnalysis,
          source: "telegram_webapp"
        }));
      } catch (e) {
        console.warn("Telegram WebApp sendData error:", e);
      }
    }

    // 5. Save to local storage for persistence
    const savedLocal = {
      id: newCaseId,
      ts: Date.now(),
      ...formData,
      aiAnalysis,
      recs: out?.recs || [],
      pc: out?.pc,
      conf: out?.conf,
      poor: out?.poor,
      missing: out?.missing
    };
    setCases(prev => {
      const updated = [savedLocal, ...prev.filter(c => c.id !== newCaseId)];
      try { localStorage.setItem("fuqaro_local_cases", JSON.stringify(updated)); } catch(e){}
      return updated;
    });

    showToast("✅ So'rovnomangiz qabul qilindi va MFY xodimi (Admin bot)ga yuborildi!", "success");

    // 6. Also forward to backend API if available
    try {
      fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          id: newCaseId,
          aiAnalysis,
          source: window.Telegram?.WebApp?.initData ? "telegram_webapp" : "web"
        })
      });
    } catch (e) {}
  };

  // Reseed cases
  const handleReseed = () => {
    const seeds = generateSeedCases(threshold);
    setCases(seeds);
    try { localStorage.setItem("fuqaro_local_cases", JSON.stringify(seeds)); } catch(e){}
    showToast("Namuna qabullar tiklandi!");
  };

  // Wipe cases
  const handleWipe = () => {
    setCases([]);
    try { localStorage.setItem("fuqaro_local_cases", JSON.stringify([])); } catch(e){}
    showToast("Arizalar ro'yxati tozalandi!");
  };

  // Update config
  const handleUpdateConfig = async (updates) => {
    if (updates.threshold != null) setThreshold(updates.threshold);
    try {
      fetch("/api/cfg", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
    } catch (err) {}
  };

  return (
    <div className="min-h-screen bg-bg text-ink pb-12">
      <div className="max-w-[960px] mx-auto px-4 sm:px-6">
        {/* Header */}
        <Header
          currentView={currentView}
          setCurrentView={setCurrentView}
          theme={theme}
          toggleTheme={toggleTheme}
          onOpenAdmin={() => setAdminModalOpen(true)}
        />

        {/* Global Toast Alert */}
        {toast && (
          <div
            className={`mb-5 p-4 rounded-xl border flex items-center justify-between text-xs md:text-sm font-medium shadow-md transition-all animate-in fade-in slide-in-from-top-2 ${
              toast.type === "success"
                ? "bg-ok-bg text-ok border-ok/30"
                : "bg-crit-bg text-crit border-crit/30"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-muted hover:text-ink font-bold ml-3 cursor-pointer"
            >
              ×
            </button>
          </div>
        )}

        {/* Telegram WebApp Mini App banner if detected */}
        {window.Telegram?.WebApp?.initData && (
          <div className="mb-4 bg-accent/10 border border-accent/30 rounded-xl p-3 flex items-center justify-between text-xs text-accent">
            <span className="flex items-center gap-2 font-semibold">
              <Bot className="w-4 h-4" />
              Telegram Mini App rejimi faol
            </span>
            <span className="text-[11px] text-muted">
              Foydalanuvchi: {window.Telegram.WebApp.initDataUnsafe?.user?.first_name || "Fuqaro"}
            </span>
          </div>
        )}

        {/* MAIN VIEWS */}
        <main>
          {/* 1. SO'ROVNOMA FORMASI */}
          {currentView === "intake" && (
            <div className="max-w-3xl mx-auto w-full">
              <IntakeForm
                onSubmit={handleIntakeSubmit}
                initialValues={currentCase?.p}
                threshold={threshold}
                onUpdateThreshold={(val) => {
                  setThreshold(val);
                  handleUpdateConfig({ threshold: val });
                }}
              />
            </div>
          )}

          {/* 2. TASDIQ VA DAVLAT DASTURLARI (FUQARO UCHUN) */}
          {currentView === "result" && (
            <ResultView
              currentCase={currentCase}
              onBackToIntake={() => setCurrentView("intake")}
            />
          )}
        </main>

        {/* Admin Dashboard & Excel Exporter Modal */}
        <AdminExportModal
          isOpen={adminModalOpen}
          onClose={() => setAdminModalOpen(false)}
          cases={cases}
          onReseed={handleReseed}
          onWipe={handleWipe}
        />
      </div>
    </div>
  );
}
