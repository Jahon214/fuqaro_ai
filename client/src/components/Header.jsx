import React, { useState } from "react";
import { Moon, Sun, FileText, CheckCircle2, Menu, X, Info, ShieldCheck, Plus } from "lucide-react";

export function Header({ currentView, setCurrentView, theme, toggleTheme }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const handleStartNew = () => {
    setCurrentView("intake");
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <header className="sticky top-0 z-40 backdrop-blur-md bg-surface/90 border-b border-line shadow-xs mb-5 transition-colors">
        <div className="max-w-[960px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 md:h-16 gap-3">
            {/* Brand Logo & Name */}
            <div 
              onClick={handleStartNew}
              className="flex items-center gap-2.5 cursor-pointer select-none"
            >
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white grid place-items-center font-display font-bold text-base md:text-lg shadow-sm shadow-emerald-500/20 shrink-0">
                X
              </div>
              <div>
                <h1 className="text-base md:text-lg font-display font-bold text-ink tracking-tight leading-tight">
                  Xovos Fuqaro AI
                </h1>
                <p className="text-[10px] md:text-[11px] text-muted font-medium flex items-center gap-1.5 leading-none mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Xovos tumani fuqarolari uchun rasmiy so'rovnoma portali
                </p>
              </div>
            </div>

            {/* Desktop Quick Action */}
            <div className="hidden sm:flex items-center gap-2">
              {currentView === "result" ? (
                <button
                  onClick={handleStartNew}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-accent text-accent-ink font-semibold text-xs cursor-pointer shadow-xs hover:opacity-95 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Yangi so'rovnoma
                </button>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-raised border border-line text-[11px] font-semibold text-muted">
                  <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                  Qabul ochiq
                </div>
              )}
            </div>

            {/* Right Action Icons: Theme Toggle & Menu */}
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
                title="Menyu"
                aria-label="Menyuni ochish"
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Hamburger Dropdown Drawer */}
          {menuOpen && (
            <div className="py-3 border-t border-line animate-in fade-in slide-from-top-2 duration-150">
              <div className="space-y-1">
                <button
                  onClick={handleStartNew}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer hover:bg-surface-raised text-ink"
                >
                  <span className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-accent" />
                    So'rovnoma to'ldirish
                  </span>
                  <span className="text-[11px] opacity-70">MFY qabuli</span>
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setShowInfoModal(true);
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer hover:bg-surface-raised text-ink"
                >
                  <span className="flex items-center gap-2.5">
                    <Info className="w-4 h-4 text-accent" />
                    Portal haqida ma'lumot
                  </span>
                  <span className="text-[11px] opacity-70">Xovos AI</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs grid place-items-center p-4">
          <div className="bg-surface border border-line rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <h3 className="font-display font-bold text-base text-ink flex items-center gap-2">
                <Info className="w-4 h-4 text-accent" />
                Xovos Fuqaro AI Haqida
              </h3>
              <button
                onClick={() => setShowInfoModal(false)}
                className="text-muted hover:text-ink font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-muted leading-relaxed space-y-2.5">
              <p>
                <b>Xovos Fuqaro AI</b> — Xovos tumani fuqarolari uchun yaratilgan rasmiy sun'iy intellekt portali bo'lib, fuqarolarning murojaat va ehtiyojlarini qabul qiladi.
              </p>
              <p>
                Siz kiritgan barcha ma'lumotlar sun'iy intellekt tomonidan tahlil qilinib, O'zbekiston Respublikasi qonunchiligi asosida sizga eng mos keluvchi davlat yordam choralari bilan birga Xovos tumani mas'ul MFY xodimi (Hokim yordamchisi)ga yo'naltiriladi.
              </p>
            </div>

            <button
              onClick={() => setShowInfoModal(false)}
              className="w-full py-2.5 rounded-xl bg-accent text-accent-ink font-bold text-xs cursor-pointer shadow-xs"
            >
              Tushundim
            </button>
          </div>
        </div>
      )}
    </>
  );
}
