import React, { useState } from "react";
import { downloadCsv, downloadExcel } from "../services/excelExporter.js";
import { MFYS, TYPES, fmt } from "../constants.js";
import { FileSpreadsheet, Download, Lock, KeyRound, Search, X, CheckCircle2, ShieldCheck, Database, RefreshCw, Trash2, Filter } from "lucide-react";

export function AdminExportModal({ isOpen, onClose, cases = [], onReseed, onWipe }) {
  const [pin, setPin] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return sessionStorage.getItem("fuqaro_admin_session") === "unlocked";
  });
  const [pinError, setPinError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedMfy, setSelectedMfy] = useState("all");
  const [googleSheetUrl, setGoogleSheetUrl] = useState(() => {
    return localStorage.getItem("fuqaro_google_sheet_url") || "";
  });
  const [savedSheetSuccess, setSavedSheetSuccess] = useState(false);

  if (!isOpen) return null;

  const handleUnlock = (e) => {
    e.preventDefault();
    // Default PIN: 2060 (Admin Telegram ID prefix) or 7777 or admin
    if (pin === "2060" || pin === "admin" || pin === "7777" || pin === "xovos2026") {
      setIsUnlocked(true);
      sessionStorage.setItem("fuqaro_admin_session", "unlocked");
      setPinError("");
    } else {
      setPinError("Noto'g'ri PIN kod. (Standart kod: 2060)");
    }
  };

  const handleSaveSheetUrl = () => {
    localStorage.setItem("fuqaro_google_sheet_url", googleSheetUrl.trim());
    setSavedSheetSuccess(true);
    setTimeout(() => setSavedSheetSuccess(false), 3000);
  };

  const filteredCases = cases.filter(c => {
    const p = c.p || c;
    if (selectedMfy !== "all" && p.mfy !== selectedMfy) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    const name = (p.name || p.ini || "").toLowerCase();
    const mfy = (p.mfy || "").toLowerCase();
    const type = (TYPES[p.type] || p.type || "").toLowerCase();
    const id = (c.id || "").toLowerCase();
    return name.includes(q) || mfy.includes(q) || type.includes(q) || id.includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-surface border border-line rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-150">
        
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-line flex items-center justify-between gap-3 bg-surface-raised/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-accent grid place-items-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base sm:text-lg text-ink flex items-center gap-2">
                MFY Mas'ul Xodimi (Admin) Paneli
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/30 font-bold">
                  Excel & Baza
                </span>
              </h3>
              <p className="text-[11px] text-muted">Arizalarni Excel formatida yuklab olish va markaziy ro'yxat</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl border border-line bg-surface hover:bg-surface-raised text-muted hover:text-ink grid place-items-center transition cursor-pointer"
            title="Yopish"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        {!isUnlocked ? (
          /* PIN Verification Screen */
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center max-w-sm mx-auto my-auto space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-surface-raised border border-line grid place-items-center text-accent shadow-xs">
              <Lock className="w-6 h-6" />
            </div>

            <div>
              <h4 className="font-display font-bold text-lg text-ink">Xodim identifikatsiyasi</h4>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Fuqarolar shaxsiy ma'lumotlari himoyalangan. Excel jadvalini yuklab olish uchun MFY xodimi PIN kodini kiriting.
              </p>
            </div>

            <form onSubmit={handleUnlock} className="w-full space-y-3">
              <div>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setPinError("");
                  }}
                  placeholder="PIN kodni kiriting (Standart: 2060)"
                  className="w-full text-center tracking-widest font-mono text-base bg-bg border border-line rounded-xl px-4 py-2.5 text-ink focus:outline-accent"
                  autoFocus
                />
                {pinError && (
                  <p className="text-xs text-crit mt-1 font-semibold">{pinError}</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-accent text-accent-ink font-bold text-xs cursor-pointer shadow-xs hover:opacity-95 transition"
              >
                Kirish
              </button>
            </form>
          </div>
        ) : (
          /* Unlocked Admin Dashboard & Excel Exporter */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            
            {/* Top Excel Download Hero Banner */}
            <div className="bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-surface-raised border border-emerald-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">Excel Eksport</span>
                <h4 className="text-base sm:text-lg font-display font-bold text-ink mt-0.5">
                  Barcha Fuqarolar So'rovnomasi Jadvali
                </h4>
                <p className="text-xs text-muted mt-0.5">
                  Jami arizalar soni: <b className="text-ink font-mono">{cases.length} ta</b> (Barcha 22 ta mezon va AI tahlili bilan)
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => downloadExcel(cases)}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 cursor-pointer transition active:scale-98"
                >
                  <Download className="w-4 h-4" />
                  Excel (.xls) yuklab olish
                </button>

                <button
                  type="button"
                  onClick={() => downloadCsv(cases)}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-surface border border-line hover:bg-surface-raised text-ink font-semibold text-xs sm:text-sm cursor-pointer transition"
                >
                  <FileSpreadsheet className="w-4 h-4 text-accent" />
                  CSV yuklab olish
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Ism, ariza ID yoki kalit so'z bilan qidirish..."
                  className="w-full bg-surface-raised border border-line rounded-xl pl-9 pr-3.5 py-2 text-xs text-ink focus:outline-accent"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedMfy}
                  onChange={(e) => setSelectedMfy(e.target.value)}
                  className="bg-surface-raised border border-line rounded-xl px-3 py-2 text-xs text-ink focus:outline-accent"
                >
                  <option value="all">Barcha mahallalar ({MFYS.length})</option>
                  {MFYS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>

                <span className="text-xs text-muted font-mono whitespace-nowrap">
                  {filteredCases.length} ta ariza
                </span>
              </div>
            </div>

            {/* Cases Data Table */}
            <div className="border border-line rounded-xl overflow-hidden bg-surface">
              <div className="overflow-x-auto max-h-[420px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-surface-raised/95 backdrop-blur-xs border-b border-line text-muted z-10">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">№</th>
                      <th className="py-2.5 px-3 font-semibold">ID</th>
                      <th className="py-2.5 px-3 font-semibold">Fuqaro F.I.Sh.</th>
                      <th className="py-2.5 px-3 font-semibold">Yoshi</th>
                      <th className="py-2.5 px-3 font-semibold">Mahalla (MFY)</th>
                      <th className="py-2.5 px-3 font-semibold">Murojaat turi</th>
                      <th className="py-2.5 px-3 font-semibold">Daromad</th>
                      <th className="py-2.5 px-3 font-semibold">AI Xavf</th>
                      <th className="py-2.5 px-3 font-semibold">AI Tavsiya Paketi</th>
                      <th className="py-2.5 px-3 font-semibold">Hokim yordamchisi uchun 3 qadam</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {filteredCases.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-8 text-center text-muted">
                          Hech qanday ariza topilmadi.
                        </td>
                      </tr>
                    ) : (
                      filteredCases.map((c, i) => {
                        const p = c.p || c;
                        const ai = c.aiAnalysis || {};
                        const pc = p.income != null && p.members ? Math.round(p.income / p.members) : (c.pc || 0);

                        return (
                          <tr key={c.id || i} className="hover:bg-surface-raised/50 transition">
                            <td className="py-2.5 px-3 font-mono text-muted">{i + 1}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-accent">{c.id}</td>
                            <td className="py-2.5 px-3 font-semibold text-ink whitespace-nowrap">{p.name || p.ini}</td>
                            <td className="py-2.5 px-3">{p.age} yosh</td>
                            <td className="py-2.5 px-3 whitespace-nowrap">{p.mfy}</td>
                            <td className="py-2.5 px-3 whitespace-nowrap text-muted">{TYPES[p.type] || p.type}</td>
                            <td className="py-2.5 px-3 font-mono whitespace-nowrap">{pc ? `${fmt(pc)} UZS` : "—"}</td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                ai.povertyRisk === "Yuqori"
                                  ? "bg-crit-bg text-crit"
                                  : ai.povertyRisk === "O'rta"
                                  ? "bg-warn-bg text-warn"
                                  : "bg-ok-bg text-ok"
                              }`}>
                                {ai.povertyRisk || "O'rta"}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-medium text-ink whitespace-nowrap">{ai.socialPackage || "Davlat paketi"}</td>
                            <td className="py-2.5 px-3 text-muted max-w-xs truncate" title={(ai.adminAdvice || []).join("; ")}>
                              {(ai.adminAdvice || []).slice(0, 1).join("")}...
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Optional Google Sheets Live Webhook Integration */}
            <div className="p-4 rounded-xl border border-line bg-surface-raised/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-accent" />
                  Google Sheets (Jonli Google Jadval) bilan avtomatik ulash (Ixtiyoriy)
                </span>
                {savedSheetSuccess && (
                  <span className="text-[11px] text-ok font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Saqlandi!
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted leading-relaxed">
                Har bir so'rovnoma to'ldirilganda to'g'ridan-to'g'ri o'zingizning Google Jadvalingizga ham tushishi uchun Google Apps Script Webhook URL manzilini kiriting:
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={googleSheetUrl}
                  onChange={(e) => setGoogleSheetUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="flex-1 bg-surface border border-line rounded-xl px-3 py-1.5 text-xs text-ink focus:outline-accent font-mono"
                />
                <button
                  type="button"
                  onClick={handleSaveSheetUrl}
                  className="px-3.5 py-1.5 rounded-xl bg-accent text-accent-ink font-bold text-xs cursor-pointer shadow-xs"
                >
                  Saqlash
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
