import React from "react";
import { Moon, Sun, Sparkles, FileText, BarChart3 } from "lucide-react";

export function Header({ currentView, setCurrentView, currentCase, totalCases, theme, toggleTheme }) {

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-surface/85 border-b border-line shadow-xs mb-8 transition-colors">
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4 py-3.5">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white grid place-items-center font-display font-bold text-xl shadow-md shadow-emerald-500/20 shrink-0">
              X
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-ink tracking-tight">
                Xovos Fuqaro AI
              </h1>
              <p className="text-[11px] text-muted font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Xovos tumani MFY va Davlat xizmatlari intellektual yordamchisi
              </p>
            </div>
          </div>

          {/* Theme Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl border border-line bg-surface hover:bg-surface-raised text-muted hover:text-ink grid place-items-center transition cursor-pointer shadow-xs"
              title={theme === "dark" ? "Yorug' rejim" : "Qorong'i rejim"}
              aria-label="Rejimni o'zgartirish"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
          </div>
        </div>

        {/* Modern Segmented Navigation Tabs */}
        <div className="pb-3 pt-1 overflow-x-auto no-scrollbar">
          <nav className="flex w-full sm:w-auto p-1 rounded-xl bg-surface-raised/90 border border-line/80 gap-1" role="tablist">
            <button
              role="tab"
              aria-selected={currentView === "intake"}
              onClick={() => setCurrentView("intake")}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-4 py-2 font-semibold text-xs md:text-sm rounded-lg transition-all cursor-pointer ${
                currentView === "intake"
                  ? "bg-surface text-ink shadow-xs font-bold"
                  : "text-muted hover:text-ink hover:bg-surface/50"
              }`}
            >
              <FileText className="w-4 h-4 text-accent shrink-0" />
              <span>Yangi qabul</span>
            </button>

            <button
              role="tab"
              aria-selected={currentView === "result"}
              onClick={() => setCurrentView("result")}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-4 py-2 font-semibold text-xs md:text-sm rounded-lg transition-all cursor-pointer relative ${
                currentView === "result"
                  ? "bg-surface text-ink shadow-xs font-bold"
                  : "text-muted hover:text-ink hover:bg-surface/50"
              }`}
            >
              <Sparkles className="w-4 h-4 text-accent shrink-0" />
              <span>Tavsiyalar & AI</span>
              {currentCase && (
                <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
              )}
            </button>

            <button
              role="tab"
              aria-selected={currentView === "log"}
              onClick={() => setCurrentView("log")}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-4 py-2 font-semibold text-xs md:text-sm rounded-lg transition-all cursor-pointer ${
                currentView === "log"
                  ? "bg-surface text-ink shadow-xs font-bold"
                  : "text-muted hover:text-ink hover:bg-surface/50"
              }`}
            >
              <BarChart3 className="w-4 h-4 text-accent shrink-0" />
              <span>Jurnal</span>
              {totalCases > 0 && (
                <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-surface-raised border border-line text-muted font-bold font-mono">
                  {totalCases}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
