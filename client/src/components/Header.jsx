import React from "react";
import { Moon, Sun, Bot, Sparkles, FileText, CheckSquare, BarChart3, Settings, ShieldAlert, Radio } from "lucide-react";

export function Header({ currentView, setCurrentView, currentCase, totalCases, botStatus, theme, toggleTheme }) {
  const adminOk = botStatus?.adminBot?.connected;
  const citizenOk = botStatus?.citizenBot?.connected;

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-surface/85 border-b border-line shadow-xs mb-8 transition-colors">
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4 py-3.5">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white grid place-items-center font-display font-bold text-xl shadow-md shadow-emerald-500/20 shrink-0">
              F
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-display font-bold text-ink tracking-tight">
                  Fuqaro AI
                </h1>
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-500/15 to-teal-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  PRO v2.4
                </span>
              </div>
              <p className="text-[11px] text-muted font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                MFY va Davlat xizmatlari intellektual yordamchisi
              </p>
            </div>
          </div>

          {/* System Status Indicators & Theme */}
          <div className="flex flex-wrap items-center gap-2">
            {/* AI Engine Status */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>AI Copilot: Faol</span>
            </div>

            {/* Telegram Bots Status Pill */}
            <button
              onClick={() => setCurrentView("telegram")}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-surface-raised hover:bg-line border border-line transition cursor-pointer"
              title="Telegram botlari holati"
            >
              <Bot className="w-3.5 h-3.5 text-accent" />
              <span className="text-muted hidden md:inline">Botlar:</span>
              <span className="flex items-center gap-1 font-semibold text-ink">
                <span className={`w-2 h-2 rounded-full ${adminOk && citizenOk ? "bg-ok" : "bg-warn"}`} />
                {adminOk && citizenOk ? "2 ta Faol" : "Standby"}
              </span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-xl border border-line bg-surface hover:bg-surface-raised text-muted hover:text-ink grid place-items-center transition cursor-pointer shadow-xs"
              title={theme === "dark" ? "Yorug' rejim" : "Qorong'i rejim"}
              aria-label="Rejimni o'zgartirish"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
          </div>
        </div>

        {/* Modern Segmented Navigation Tabs */}
        <div className="pb-3 pt-1 overflow-x-auto">
          <nav className="inline-flex p-1 rounded-xl bg-surface-raised/90 border border-line/80 gap-1" role="tablist">
            <button
              role="tab"
              aria-selected={currentView === "intake"}
              onClick={() => setCurrentView("intake")}
              className={`flex items-center gap-2 px-4 py-2 font-semibold text-xs md:text-sm rounded-lg transition-all cursor-pointer ${
                currentView === "intake"
                  ? "bg-surface text-ink shadow-xs font-bold"
                  : "text-muted hover:text-ink hover:bg-surface/50"
              }`}
            >
              <FileText className="w-4 h-4 text-accent" />
              Yangi qabul
            </button>

            <button
              role="tab"
              aria-selected={currentView === "result"}
              onClick={() => setCurrentView("result")}
              className={`flex items-center gap-2 px-4 py-2 font-semibold text-xs md:text-sm rounded-lg transition-all cursor-pointer relative ${
                currentView === "result"
                  ? "bg-surface text-ink shadow-xs font-bold"
                  : "text-muted hover:text-ink hover:bg-surface/50"
              }`}
            >
              <Sparkles className="w-4 h-4 text-accent" />
              Tavsiyalar & AI Tahlil
              {currentCase && (
                <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
              )}
            </button>

            <button
              role="tab"
              aria-selected={currentView === "log"}
              onClick={() => setCurrentView("log")}
              className={`flex items-center gap-2 px-4 py-2 font-semibold text-xs md:text-sm rounded-lg transition-all cursor-pointer ${
                currentView === "log"
                  ? "bg-surface text-ink shadow-xs font-bold"
                  : "text-muted hover:text-ink hover:bg-surface/50"
              }`}
            >
              <BarChart3 className="w-4 h-4 text-accent" />
              Jurnal va Tahlil
              {totalCases > 0 && (
                <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-surface-raised border border-line text-muted font-bold font-mono">
                  {totalCases}
                </span>
              )}
            </button>

            <button
              role="tab"
              aria-selected={currentView === "telegram"}
              onClick={() => setCurrentView("telegram")}
              className={`flex items-center gap-2 px-4 py-2 font-semibold text-xs md:text-sm rounded-lg transition-all cursor-pointer ${
                currentView === "telegram"
                  ? "bg-surface text-ink shadow-xs font-bold"
                  : "text-muted hover:text-ink hover:bg-surface/50"
              }`}
            >
              <Bot className="w-4 h-4 text-accent" />
              Telegram Botlar
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-accent/15 text-accent font-bold">
                2 ta bot
              </span>
            </button>

            <button
              role="tab"
              aria-selected={currentView === "settings"}
              onClick={() => setCurrentView("settings")}
              className={`flex items-center gap-2 px-4 py-2 font-semibold text-xs md:text-sm rounded-lg transition-all cursor-pointer ${
                currentView === "settings"
                  ? "bg-surface text-ink shadow-xs font-bold"
                  : "text-muted hover:text-ink hover:bg-surface/50"
              }`}
            >
              <Settings className="w-4 h-4 text-accent" />
              Sozlamalar
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
