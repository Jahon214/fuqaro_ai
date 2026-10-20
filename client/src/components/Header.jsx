import React, { useState } from "react";
import { Moon, Sun, Sparkles, FileText, BarChart3, Menu, X } from "lucide-react";

export function Header({ currentView, setCurrentView, currentCase, totalCases, theme, toggleTheme }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNav = (view) => {
    setCurrentView(view);
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-surface/90 border-b border-line shadow-xs mb-5 transition-colors">
      <div className="max-w-[1080px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 md:h-16 gap-3">
          {/* Brand */}
          <div 
            onClick={() => handleNav("intake")}
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white grid place-items-center font-display font-bold text-base md:text-lg shadow-sm shadow-emerald-500/20 shrink-0">
              X
            </div>
            <div>
              <h1 className="text-base md:text-lg font-display font-bold text-ink tracking-tight leading-tight">
                Xovos Fuqaro AI
              </h1>
              <p className="text-[10px] md:text-[11px] text-muted font-medium hidden sm:flex items-center gap-1.5 leading-none mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                MFY va Davlat xizmatlari intellektual yordamchisi
              </p>
            </div>
          </div>

          {/* Desktop Inline Navigation */}
          <nav className="hidden md:flex items-center p-1 rounded-xl bg-surface-raised/90 border border-line/80 gap-1" role="tablist">
            <button
              role="tab"
              aria-selected={currentView === "intake"}
              onClick={() => handleNav("intake")}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-semibold text-xs rounded-lg transition-all cursor-pointer ${
                currentView === "intake"
                  ? "bg-surface text-ink shadow-xs font-bold"
                  : "text-muted hover:text-ink hover:bg-surface/50"
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-accent shrink-0" />
              <span>Yangi qabul</span>
            </button>

            <button
              role="tab"
              aria-selected={currentView === "result"}
              onClick={() => handleNav("result")}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-semibold text-xs rounded-lg transition-all cursor-pointer relative ${
                currentView === "result"
                  ? "bg-surface text-ink shadow-xs font-bold"
                  : "text-muted hover:text-ink hover:bg-surface/50"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-accent shrink-0" />
              <span>Tavsiyalar & AI</span>
              {currentCase && (
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
              )}
            </button>

            <button
              role="tab"
              aria-selected={currentView === "log"}
              onClick={() => handleNav("log")}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-semibold text-xs rounded-lg transition-all cursor-pointer ${
                currentView === "log"
                  ? "bg-surface text-ink shadow-xs font-bold"
                  : "text-muted hover:text-ink hover:bg-surface/50"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-accent shrink-0" />
              <span>Jurnal</span>
              {totalCases > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-surface-raised border border-line text-muted font-bold font-mono">
                  {totalCases}
                </span>
              )}
            </button>
          </nav>

          {/* Right Action Icons: Theme Toggle & 3-line Hamburger Menu */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl border border-line bg-surface hover:bg-surface-raised text-muted hover:text-ink grid place-items-center transition cursor-pointer shadow-xs"
              title={theme === "dark" ? "Yorug' rejim" : "Qorong'i rejim"}
              aria-label="Rejimni o'zgartirish"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* 3-line Hamburger Menu Button */}
            <button
              onClick={() => setMenuOpen(prev => !prev)}
              className={`w-9 h-9 rounded-xl border border-line bg-surface hover:bg-surface-raised text-muted hover:text-ink grid place-items-center transition cursor-pointer shadow-xs ${
                menuOpen ? "bg-accent/15 text-accent border-accent/40" : ""
              }`}
              title="Menyu (3 ta chiziq)"
              aria-label="Menyuni ochish"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Hamburger Dropdown Drawer (Mobile and Desktop) */}
        {menuOpen && (
          <div className="py-3 border-t border-line animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="space-y-1">
              <button
                onClick={() => handleNav("intake")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                  currentView === "intake"
                    ? "bg-accent text-accent-ink font-bold shadow-xs"
                    : "text-ink hover:bg-surface-raised"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4" />
                  Yangi qabul (So'rovnoma)
                </span>
                <span className="text-[11px] opacity-70">MFY xatlovi</span>
              </button>

              <button
                onClick={() => handleNav("result")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                  currentView === "result"
                    ? "bg-accent text-accent-ink font-bold shadow-xs"
                    : "text-ink hover:bg-surface-raised"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4" />
                  Tavsiyalar & AI Maslahatchisi
                </span>
                {currentCase && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                )}
              </button>

              <button
                onClick={() => handleNav("log")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                  currentView === "log"
                    ? "bg-accent text-accent-ink font-bold shadow-xs"
                    : "text-ink hover:bg-surface-raised"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <BarChart3 className="w-4 h-4" />
                  Qabullar Jurnali va Tahlil
                </span>
                {totalCases > 0 && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface/80 border border-line font-mono font-bold">
                    {totalCases} ta
                  </span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
