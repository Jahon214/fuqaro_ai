import React, { useState, useEffect } from "react";
import { Header } from "./components/Header.jsx";
import { IntakeForm } from "./components/IntakeForm.jsx";
import { SettingsAside } from "./components/SettingsAside.jsx";
import { ResultView } from "./components/ResultView.jsx";
import { JournalView } from "./components/JournalView.jsx";
import { CaseModal } from "./components/CaseModal.jsx";
import { TelegramTab } from "./components/TelegramTab.jsx";
import { SettingsTab } from "./components/SettingsTab.jsx";
import { evaluate, generateBuiltInAnalysis } from "./constants.js";
import { CheckCircle2, Bot, ArrowRight } from "lucide-react";

export default function App() {
  const [currentView, setCurrentView] = useState("intake");
  const [currentCase, setCurrentCase] = useState(null);
  const [cases, setCases] = useState([]);
  const [stats, setStats] = useState(null);
  const [config, setConfig] = useState({ threshold: 1000000, mfys: [], webAppUrl: "" });
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

  // Initial data loading from server
  const loadData = async () => {
    try {
      const [casesRes, statsRes, cfgRes, botRes] = await Promise.all([
        fetch("/api/cases").then(r => r.json()).catch(() => ({ cases: [] })),
        fetch("/api/stats").then(r => r.json()).catch(() => ({ stats: null })),
        fetch("/api/cfg").then(r => r.json()).catch(() => ({ cfg: { threshold: 1000000 } })),
        fetch("/api/bots/status").then(r => r.json()).catch(() => ({ status: null }))
      ]);

      if (casesRes.cases && casesRes.cases.length > 0) {
        setCases(casesRes.cases);
      } else {
        const local = localStorage.getItem("fuqaro_local_cases");
        if (local) {
          try { setCases(JSON.parse(local)); } catch(e) {}
        }
      }
      if (statsRes.stats) setStats(statsRes.stats);
      if (cfgRes.cfg) {
        setConfig(cfgRes.cfg);
        setThreshold(cfgRes.cfg.threshold || 1000000);
      }
      if (botRes.status) setBotStatus(botRes.status);
    } catch (err) {
      console.error("Error loading server data:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Intake Form submission with instant AI analysis
  const handleIntakeSubmit = async (formData) => {
    const out = evaluate(formData, { threshold });
    const instantAi = generateBuiltInAnalysis(formData, out, { threshold });
    
    // Set immediate case with instant AI analysis
    const initialCase = {
      p: formData,
      out,
      decisions: {},
      aiAnalysis: instantAi,
      saved: false
    };
    setCurrentCase(initialCase);
    setCurrentView("result");
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Try upgrading AI analysis in background via backend Gemini (if online)
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ p: formData, out })
      });
      const data = await res.json();
      if (data.success && data.aiAnalysis) {
        setCurrentCase(prev => (prev ? { ...prev, aiAnalysis: data.aiAnalysis } : null));
      }
    } catch (err) {
      // Offline or static Vercel mode: built-in AI already active
    }
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
      }
    } catch (err) {
      showToast("AI tahlilida xatolik: " + err.message, "error");
    }
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
      }
    } catch (err) {
      showToast("Xatolik: " + err.message, "error");
    }
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
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...currentCase.p,
          decisions: currentCase.decisions,
          source: window.Telegram?.WebApp?.initData ? "telegram_webapp" : "web"
        })
      });

      const data = await res.json();
      if (data.success) {
        showToast(
          "Qabul muvaffaqiyatli saqlandi va Admin Telegram botiga AI tahlili bilan yuborildi!",
          "success"
        );
        setCurrentCase(null);
        await loadData();
        setCurrentView("log");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    } catch (err) {
      console.warn("Server save error, falling back to local storage:", err);
    }

    // LocalStorage fallback for standalone Vercel / offline mode
    const newId = Date.now().toString(36);
    const savedLocal = {
      id: newId,
      ts: Date.now(),
      ...currentCase.p,
      decisions: currentCase.decisions,
      aiAnalysis: currentCase.aiAnalysis || generateBuiltInAnalysis(currentCase.p, currentCase.out, { threshold }),
      recs: currentCase.out?.recs || [],
      pc: currentCase.out?.pc
    };
    setCases(prev => {
      const updated = [savedLocal, ...prev];
      try { localStorage.setItem("fuqaro_local_cases", JSON.stringify(updated)); } catch(e){}
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
      const res = await fetch(`/api/cases/${caseId}/decisions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decisions })
      });
      const data = await res.json();
      if (data.success) {
        setCases(prev => prev.map(c => (c.id === caseId ? data.case : c)));
        if (selectedCaseForModal && selectedCaseForModal.id === caseId) {
          setSelectedCaseForModal(data.case);
        }
        await loadData();
      }
    } catch (err) {
      console.error("Error updating decision:", err);
    }
  };

  // Reseed sample cases
  const handleReseed = async () => {
    try {
      const res = await fetch("/api/cases/reseed", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        await loadData();
        showToast("Namuna qabullar tiklandi!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Wipe cases
  const handleWipe = async () => {
    try {
      const res = await fetch("/api/cases", { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        await loadData();
        showToast("Jurnal tozalandi!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Update config
  const handleUpdateConfig = async (updates) => {
    try {
      const res = await fetch("/api/cfg", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (data.success) {
        setConfig(data.cfg);
        if (updates.threshold != null) setThreshold(updates.threshold);
      }
    } catch (err) {
      console.error(err);
    }
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
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
              <IntakeForm
                onSubmit={handleIntakeSubmit}
                initialValues={currentCase?.p}
                threshold={threshold}
              />
              <SettingsAside
                threshold={threshold}
                setThreshold={setThreshold}
                onThresholdChange={(val) => handleUpdateConfig({ threshold: val })}
                onOpenTelegram={() => setCurrentView("telegram")}
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

          {/* 4. TELEGRAM BOTLAR */}
          {currentView === "telegram" && (
            <TelegramTab
              botStatus={botStatus}
              onRefreshStatus={loadData}
            />
          )}

          {/* 5. SOZLAMALAR */}
          {currentView === "settings" && (
            <SettingsTab
              config={config}
              onUpdateConfig={handleUpdateConfig}
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
