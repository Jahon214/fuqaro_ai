import React, { useState, useEffect } from "react";
import { Header } from "./components/Header.jsx";
import { IntakeForm } from "./components/IntakeForm.jsx";
import { ResultView } from "./components/ResultView.jsx";
import { JournalView } from "./components/JournalView.jsx";
import { CaseModal } from "./components/CaseModal.jsx";
import { evaluate, generateBuiltInAnalysis, generateSeedCases, calculateStats } from "./constants.js";
import { sendCaseToAdminBot } from "./services/telegramNotifier.js";
import { CheckCircle2, Bot } from "lucide-react";

export default function App() {
  const [currentView, setCurrentView] = useState("intake");
  const [currentCase, setCurrentCase] = useState(null);
  const [cases, setCases] = useState([]);
  const [stats, setStats] = useState(null);
  const [config, setConfig] = useState({ threshold: 1000000, mfys: [], webAppUrl: "https://fuqaroxovosai.vercel.app" });
  const [threshold, setThreshold] = useState(1000000);
  const [botStatus, setBotStatus] = useState(null);
  const [selectedCaseForModal, setSelectedCaseForModal] = useState(null);
  const [toast, setToast] = useState(null);
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
      const [casesRes, statsRes, cfgRes, botRes] = await Promise.all([
        fetch("/api/cases").then(r => r.json()).catch(() => ({ cases: [] })),
        fetch("/api/stats").then(r => r.json()).catch(() => ({ stats: null })),
        fetch("/api/cfg").then(r => r.json()).catch(() => ({ cfg: { threshold: 1000000 } })),
        fetch("/api/bots/status").then(r => r.json()).catch(() => ({ status: null }))
      ]);

      if (cfgRes?.cfg) {
        setConfig(cfgRes.cfg);
        if (cfgRes.cfg.threshold) {
          currentThreshold = cfgRes.cfg.threshold;
          setThreshold(cfgRes.cfg.threshold);
        }
      }
      if (botRes?.status) setBotStatus(botRes.status);

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
        // If still empty (first time visit on Vercel), populate with the 10 reference seed cases
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
      console.warn("Loading fallback data:", err);
      const fallback = generateSeedCases(currentThreshold);
      setCases(fallback);
      setStats(calculateStats(fallback));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Intake Form submission with instant AI analysis & real-time Admin Bot notification
  const handleIntakeSubmit = async (formData) => {
    const out = evaluate(formData, { threshold });
    const instantAi = generateBuiltInAnalysis(formData, out, { threshold });
    const newCaseId = "Q-" + Math.floor(1000 + Math.random() * 9000);
    
    // Set immediate case with instant AI analysis
    const initialCase = {
      id: newCaseId,
      ts: Date.now(),
      p: formData,
      out,
      decisions: {},
      aiAnalysis: instantAi,
      saved: true
    };
    setCurrentCase(initialCase);
    setCurrentView("result");
    window.scrollTo({ top: 0, behavior: "smooth" });

    // 1. Immediately send notification with full AI analysis to Admin Telegram Bot!
    sendCaseToAdminBot(initialCase, instantAi);

    // 2. If inside Telegram WebApp, send data back to Telegram
    if (window.Telegram?.WebApp?.sendData) {
      try {
        window.Telegram.WebApp.sendData(JSON.stringify({
          ...formData,
          aiAnalysis: instantAi,
          source: "telegram_webapp"
        }));
      } catch (e) {
        console.warn("Telegram WebApp sendData error:", e);
      }
    }

    // 3. Save to state and localStorage immediately
    const savedLocal = {
      id: newCaseId,
      ts: Date.now(),
      ...formData,
      decisions: {},
      aiAnalysis: instantAi,
      recs: out?.recs || [],
      pc: out?.pc,
      conf: out?.conf,
      poor: out?.poor,
      missing: out?.missing
    };
    setCases(prev => {
      const updated = [savedLocal, ...prev.filter(c => c.id !== newCaseId)];
      try { localStorage.setItem("fuqaro_local_cases", JSON.stringify(updated)); } catch(e){}
      setStats(calculateStats(updated));
      return updated;
    });

    showToast("✅ So'rovnoma qabul qilindi va MFY xodimi (Admin bot)ga yuborildi!", "success");

    // 4. Also forward to backend API if available
    try {
      fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          id: newCaseId,
          decisions: {},
          source: window.Telegram?.WebApp?.initData ? "telegram_webapp" : "web"
        })
      });
    } catch (e) {}
  };

  // Re-analyze current case with AI
  const handleUpdateAiAnalysis = async () => {
    if (!currentCase) return;
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ p: currentCase.p, out: currentCase.out })
      });
      const data = await res.json();
      if (data.success && data.aiAnalysis) {
        setCurrentCase(prev => ({ ...prev, aiAnalysis: data.aiAnalysis }));
        showToast("AI tahlili muvaffaqiyatli yangilandi!");
        return;
      }
    } catch (err) {}
    // Client fallback re-analysis
    const instantAi = generateBuiltInAnalysis(currentCase.p, currentCase.out, { threshold });
    setCurrentCase(prev => ({ ...prev, aiAnalysis: instantAi }));
    showToast("AI tahlili yangilandi!");
  };

  // Re-analyze past case from database (Modal)
  const handleReanalyzeCase = async (caseId) => {
    try {
      const res = await fetch(`/api/cases/${caseId}/re-analyze`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setCases(prev => prev.map(c => (c.id === caseId ? data.case : c)));
        if (selectedCaseForModal && selectedCaseForModal.id === caseId) {
          setSelectedCaseForModal(data.case);
        }
        showToast("Fuqaro bo'yicha AI xulosasi generatsiya qilindi!");
        return;
      }
    } catch (err) {}
    // Client fallback re-analysis
    setCases(prev => {
      const updated = prev.map(c => {
        if (c.id === caseId) {
          const evalOut = { recs: c.recs, pc: c.pc, conf: c.conf, poor: c.poor, missing: c.missing };
          const ai = generateBuiltInAnalysis(c, evalOut, { threshold });
          const newC = { ...c, aiAnalysis: ai };
          if (selectedCaseForModal && selectedCaseForModal.id === caseId) {
            setSelectedCaseForModal(newC);
          }
          return newC;
        }
        return c;
      });
      try { localStorage.setItem("fuqaro_local_cases", JSON.stringify(updated)); } catch(e){}
      return updated;
    });
    showToast("AI xulosasi yangilandi!");
  };

  // Handle Decisions change in Result view
  const handleDecisionChange = (newDecisions) => {
    if (!currentCase) return;
    setCurrentCase(prev => ({
      ...prev,
      decisions: newDecisions
    }));
  };

  // Save current case
  const handleSaveCurrentCase = async () => {
    if (!currentCase) return;

    // Telegram Mini App direct submission
    if (window.Telegram?.WebApp?.sendData) {
      try {
        window.Telegram.WebApp.sendData(JSON.stringify({
          ...currentCase.p,
          decisions: currentCase.decisions,
          source: "telegram_webapp"
        }));
      } catch (e) {
        console.warn("Telegram WebApp sendData error:", e);
      }
    }

    try {
      fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...currentCase.p,
          id: currentCase.id,
          decisions: currentCase.decisions,
          source: window.Telegram?.WebApp?.initData ? "telegram_webapp" : "web"
        })
      });
    } catch (err) {}

    // LocalStorage fallback for standalone Vercel / offline mode
    const newCaseItem = {
      id: currentCase.id || ("Q-" + Math.floor(1000 + Math.random() * 9000)),
      ts: currentCase.ts || Date.now(),
      ...currentCase.p,
      decisions: currentCase.decisions,
      aiAnalysis: currentCase.aiAnalysis || generateBuiltInAnalysis(currentCase.p, currentCase.out, { threshold }),
      recs: currentCase.out?.recs || [],
      pc: currentCase.out?.pc,
      conf: currentCase.out?.conf,
      poor: currentCase.out?.poor,
      missing: currentCase.out?.missing
    };

    setCases(prev => {
      const updated = [newCaseItem, ...prev.filter(c => c.id !== newCaseItem.id)];
      try { localStorage.setItem("fuqaro_local_cases", JSON.stringify(updated)); } catch(e){}
      setStats(calculateStats(updated));
      return updated;
    });

    showToast("Qabul muvaffaqiyatli saqlandi!", "success");
    setCurrentCase(null);
    setCurrentView("log");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Update decision from Modal
  const handleUpdateModalDecision = async (caseId, decisions) => {
    try {
      fetch(`/api/cases/${caseId}/decisions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decisions })
      });
    } catch (err) {}

    setCases(prev => {
      const updated = prev.map(c => (c.id === caseId ? { ...c, decisions: { ...c.decisions, ...decisions } } : c));
      try { localStorage.setItem("fuqaro_local_cases", JSON.stringify(updated)); } catch(e) {}
      setStats(calculateStats(updated));
      if (selectedCaseForModal && selectedCaseForModal.id === caseId) {
        setSelectedCaseForModal(prevModal => ({ ...prevModal, decisions: { ...prevModal.decisions, ...decisions } }));
      }
      return updated;
    });
  };

  // Reseed sample cases
  const handleReseed = async () => {
    try {
      const res = await fetch("/api/cases/reseed", { method: "POST" });
      const data = await res.json();
      if (data.success && data.cases) {
        setCases(data.cases);
        setStats(calculateStats(data.cases));
        try { localStorage.setItem("fuqaro_local_cases", JSON.stringify(data.cases)); } catch(e) {}
        showToast("Namuna qabullar tiklandi!");
        return;
      }
    } catch (err) {}

    // Standalone / Vercel fallback
    const seeds = generateSeedCases(threshold);
    setCases(seeds);
    setStats(calculateStats(seeds));
    try { localStorage.setItem("fuqaro_local_cases", JSON.stringify(seeds)); } catch(e) {}
    showToast("Namuna qabullar tiklandi!");
  };

  // Wipe cases
  const handleWipe = async () => {
    try {
      fetch("/api/cases", { method: "DELETE" });
    } catch (err) {}

    setCases([]);
    setStats(calculateStats([]));
    try { localStorage.setItem("fuqaro_local_cases", JSON.stringify([])); } catch(e) {}
    showToast("Jurnal tozalandi!");
  };

  // Update config
  const handleUpdateConfig = async (updates) => {
    if (updates.threshold != null) setThreshold(updates.threshold);
    try {
      const res = await fetch("/api/cfg", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (data.success) {
        setConfig(data.cfg);
      }
    } catch (err) {}
  };

  return (
    <div className="min-h-screen bg-bg text-ink pb-12">
      <div className="max-w-[1080px] mx-auto px-4 sm:px-6">
        {/* Header */}
        <Header
          currentView={currentView}
          setCurrentView={setCurrentView}
          currentCase={currentCase}
          totalCases={cases.length}
          botStatus={botStatus}
          theme={theme}
          toggleTheme={toggleTheme}
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
          {/* 1. YANGI QABUL */}
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

          {/* 2. TAVSIYALAR */}
          {currentView === "result" && (
            <ResultView
              currentCase={currentCase}
              onBackToIntake={() => setCurrentView("intake")}
              onSaveCase={handleSaveCurrentCase}
              onDecisionChange={handleDecisionChange}
              onUpdateAiAnalysis={handleUpdateAiAnalysis}
            />
          )}

          {/* 3. JURNAL VA TAHLIL */}
          {currentView === "log" && (
            <JournalView
              cases={cases}
              stats={stats}
              onReseed={handleReseed}
              onWipe={handleWipe}
              onSelectCase={(c) => setSelectedCaseForModal(c)}
            />
          )}
        </main>

        {/* Case Details Modal */}
        {selectedCaseForModal && (
          <CaseModal
            caseData={selectedCaseForModal}
            onClose={() => setSelectedCaseForModal(null)}
            onUpdateDecision={handleUpdateModalDecision}
            onReanalyzeCase={handleReanalyzeCase}
          />
        )}
      </div>
    </div>
  );
}
