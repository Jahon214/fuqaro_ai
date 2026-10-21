import React, { useState } from "react";
import { TYPES, fmt } from "../constants.js";
import { Download, RefreshCw, Trash2, Eye, Search, FileSpreadsheet, Sparkles, Filter, ChevronRight, BarChart2, CheckCircle2, AlertTriangle, Users } from "lucide-react";

export function JournalView({
  cases = [],
  stats,
  onReseed,
  onWipe,
  onSelectCase
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [csvText, setCsvText] = useState("");
  const [showCsvBox, setShowCsvBox] = useState(false);
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState("");

  const filteredCases = cases.filter(c => {
    // Type filter
    if (filterType !== "all" && c.type !== filterType) {
      return false;
    }

    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (c.id && c.id.toLowerCase().includes(term)) ||
      (c.name && c.name.toLowerCase().includes(term)) ||
      (c.ini && c.ini.toLowerCase().includes(term)) ||
      (c.mfy && c.mfy.toLowerCase().includes(term)) ||
      (c.type && (TYPES[c.type] || c.type).toLowerCase().includes(term))
    );
  });

  const maxTypeCount = Math.max(1, ...(stats?.byType || []).map(x => x.count));

  const generateCsvString = () => {
    const rows = [
      ["raqam", "sana", "fuqaro_ism", "yosh", "jins", "mfy", "murojaat", "daromad", "tavsiyalar", "tasdiqlangan", "jami_qaror"]
    ];

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

    return rows
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
  };

  const handleShowCsv = () => {
    const txt = generateCsvString();
    setCsvText(txt);
    setShowCsvBox(true);

    try {
      navigator.clipboard.writeText(txt).then(
        () => setCopiedMsg("Nusxa olindi!"),
        () => setCopiedMsg("Matn tanlandi, nusxa olish uchun Ctrl+C bosing.")
      );
    } catch {
      setCopiedMsg("Matn tanlandi, nusxa olish uchun Ctrl+C bosing.");
    }
  };

  const handleDownloadCsv = () => {
    const csvContent = "\uFEFF" + generateCsvString();
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `fuqaro_ai_qabullar_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleWipeClick = () => {
    if (confirmWipe) {
      onWipe();
      setConfirmWipe(false);
    } else {
      setConfirmWipe(true);
      setTimeout(() => setConfirmWipe(false), 5000);
    }
  };

  const renderFairnessTable = (title, rows = []) => (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-line text-muted">
            <th className="py-2.5 px-3 font-semibold">{title}</th>
            <th className="py-2.5 px-3 font-semibold">Qabullar</th>
            <th className="py-2.5 px-3 font-semibold">O'rtacha tavsiya</th>
            <th className="py-2.5 px-3 font-semibold">Tasdiqlangan ulush</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r, idx) => (
            <tr key={idx} className="hover:bg-surface-raised/50 transition">
              <td className="py-2.5 px-3 font-medium text-ink">{r.group}</td>
              <td className="py-2.5 px-3">
                {r.count}
                {r.isLowSample && <span className="text-warn text-[10px] ml-1.5 px-1 py-0.2 bg-warn-bg rounded border border-warn/20 font-semibold">(kam)</span>}
              </td>
              <td className="py-2.5 px-3 font-mono">{r.avgRecs}</td>
              <td className="py-2.5 px-3 font-mono font-medium">
                {r.approvalRate != null ? `${r.approvalRate}%` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 4 Premium SaaS KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface border border-line rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted font-bold uppercase tracking-wider">Jami Qabul</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-accent grid place-items-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <b className="font-display text-3xl font-bold text-ink block">{stats?.total || 0}</b>
          <span className="text-[11px] text-muted mt-1 block">Barcha qabullar soni</span>
        </div>

        <div className="bg-surface border border-line rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted font-bold uppercase tracking-wider">O'rtacha Tavsiya</span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 grid place-items-center">
              <BarChart2 className="w-4 h-4" />
            </div>
          </div>
          <b className="font-display text-3xl font-bold text-ink block">{stats?.avgRecs || "0"}</b>
          <span className="text-[11px] text-muted mt-1 block">Har bir fuqaroga dastur</span>
        </div>

        <div className="bg-surface border border-line rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted font-bold uppercase tracking-wider">Tasdiqlangan</span>
            <div className="w-8 h-8 rounded-xl bg-ok-bg text-ok grid place-items-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <b className="font-display text-3xl font-bold text-ink block">{stats?.acceptanceRate || 0}%</b>
          <span className="text-[11px] text-muted mt-1 block">Xodim tasdiqlash ulushi</span>
        </div>

        <div className="bg-surface border border-line rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted font-bold uppercase tracking-wider">Namuna Qabullar</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 grid place-items-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <b className="font-display text-3xl font-bold text-ink block">{stats?.exampleCount || 0}</b>
          <span className="text-[11px] text-muted mt-1 block">Sinov / namuna arizalari</span>
        </div>
      </div>

      {/* Murojaat turlari Bar Chart */}
      <div className="bg-surface border border-line rounded-2xl p-5 md:p-6 shadow-xs">
        <h3 className="font-display font-bold text-lg text-ink mb-1">Murojaat Turlari Bo'yicha Taqsimot</h3>
        <p className="text-xs text-muted mb-4">Fuqarolarning kelib tushgan asosiy ehtiyojlari va murojaat yo'nalishlari</p>
        <div className="space-y-3">
          {(stats?.byType || []).map((t, idx) => {
            const widthPct = Math.round((100 * t.count) / maxTypeCount);
            return (
              <div key={idx} className="grid grid-cols-[160px_minmax(0,1fr)_45px] items-center gap-3 text-xs">
                <span className="truncate text-ink font-semibold">{t.name}</span>
                <div className="h-3.5 bg-surface-raised rounded-full overflow-hidden p-0.5 border border-line/40">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-400"
                    style={{ width: `${Math.max(4, widthPct)}%` }}
                  />
                </div>
                <em className="not-italic font-mono font-bold text-right text-ink">{t.count} ta</em>
              </div>
            );
          })}
        </div>
      </div>

      {/* Xolislik Tekshiruvi (Fairness check) */}
      <div className="bg-surface border border-line rounded-2xl p-5 md:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-display font-bold text-lg text-ink">Xolislik va Adolat Tekshiruvi</h3>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-surface-raised border border-line text-muted font-medium">
            Algoritmik tekshiruv
          </span>
        </div>
        <p className="text-xs text-muted mb-4">
          Guruhlar o'rtasida katta farq chiqsa, dastur qoidalarini tekshirish kerak. 5 tadan kam qabulli guruh bo'yicha yakuniy xulosa chiqarilmaydi.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="border border-line rounded-xl p-3.5 bg-surface-raised/40">
            <h4 className="text-xs font-bold text-ink mb-2">Yosh guruhi bo'yicha</h4>
            {renderFairnessTable("Yosh", stats?.fairness?.byAge || [])}
          </div>

          <div className="border border-line rounded-xl p-3.5 bg-surface-raised/40">
            <h4 className="text-xs font-bold text-ink mb-2">Jins bo'yicha</h4>
            {renderFairnessTable("Jins", stats?.fairness?.byGender || [])}
          </div>

          <div className="border border-line rounded-xl p-3.5 bg-surface-raised/40">
            <h4 className="text-xs font-bold text-ink mb-2">MFYlar bo'yicha</h4>
            {renderFairnessTable("MFY", stats?.fairness?.byMfy || [])}
          </div>
        </div>
      </div>

      {/* Qabullar Jadvali */}
      <div className="bg-surface border border-line rounded-2xl p-5 md:p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-display font-bold text-lg text-ink">Qabullar Jurnali</h3>
            <p className="text-xs text-muted">Jami {filteredCases.length} ta yozuv ko'rsatilmoqda</p>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Qidirish (ism, MFY, raqam)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-bg border border-line rounded-xl pl-9 pr-3 py-2 text-xs text-ink focus:outline-accent"
            />
          </div>
        </div>

        {/* Filter Chips Bar */}
        <div className="flex flex-wrap gap-1.5 pb-4 border-b border-line">
          <button
            onClick={() => setFilterType("all")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition ${
              filterType === "all" ? "bg-accent text-accent-ink shadow-2xs" : "bg-surface-raised text-muted hover:text-ink"
            }`}
          >
            Barchasi
          </button>
          {Object.entries(TYPES).map(([k, v]) => (
            <button
              key={k}
              onClick={() => setFilterType(k)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition ${
                filterType === k ? "bg-accent text-accent-ink shadow-2xs" : "bg-surface-raised text-muted hover:text-ink"
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Modern Data Table */}
        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="py-3 px-3 font-semibold">Raqam</th>
                <th className="py-3 px-3 font-semibold">Sana</th>
                <th className="py-3 px-3 font-semibold">Fuqaro</th>
                <th className="py-3 px-3 font-semibold">MFY</th>
                <th className="py-3 px-3 font-semibold">Murojaat</th>
                <th className="py-3 px-3 font-semibold">AI Tahlil</th>
                <th className="py-3 px-3 font-semibold">Qaror</th>
                <th className="py-3 px-3 font-semibold text-right">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredCases.map((c) => {
                const ds = Object.values(c.decisions || {});
                const okCount = ds.filter(d => d.d === "ok").length;
                const dateStr = new Date(c.ts).toLocaleDateString("uz-UZ");

                return (
                  <tr key={c.id} className="hover:bg-surface-raised/60 transition">
                    <td className="py-3 px-3 font-mono font-bold text-ink whitespace-nowrap">
                      {c.id}
                      {c.example && (
                        <span className="text-[10px] text-muted ml-1 bg-surface-raised border border-line px-1.5 py-0.2 rounded font-sans">
                          namuna
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-muted whitespace-nowrap">{dateStr}</td>
                    <td className="py-3 px-3 font-bold text-ink whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold grid place-items-center text-xs">
                          {c.ini || "F"}
                        </div>
                        <div>
                          <span>{c.name || c.ini}</span>
                          <span className="text-[11px] text-muted font-normal block">{c.age} yosh, {c.gender || "—"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-ink font-medium whitespace-nowrap">{c.mfy}</td>
                    <td className="py-3 px-3 text-muted whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-surface-raised text-[11px] font-semibold text-ink">
                        {TYPES[c.type] || c.type}
                      </span>
                    </td>
                    <td className="py-3 px-3 max-w-[200px] truncate text-xs text-muted" title={c.aiAnalysis?.summary || "Tahlil qilingan"}>
                      {c.aiAnalysis ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                          <Sparkles className="w-3 h-3" />
                          {c.aiAnalysis.recommendedAction} ({c.aiAnalysis.povertyRisk} xavf)
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap font-medium text-ink">
                      {ds.length > 0 ? (
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${okCount > 0 ? "bg-ok-bg text-ok" : "bg-crit-bg text-crit"}`}>
                          {okCount} / {ds.length} tasdiqlandi
                        </span>
                      ) : (
                        <span className="text-warn text-[11px] font-semibold">Kutilmoqda</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => onSelectCase(c)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface border border-line hover:bg-surface-raised text-accent text-xs font-bold cursor-pointer shadow-2xs"
                        title="Batafsil ko'rish"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Ko'rish
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center gap-2.5 pt-5 mt-4 border-t border-line">
          <button
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-line bg-surface hover:bg-surface-raised text-accent text-xs font-bold transition cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            CSV yuklab olish
          </button>

          <button
            onClick={handleShowCsv}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-line bg-surface hover:bg-surface-raised text-muted hover:text-ink text-xs font-semibold transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            CSV matnini ko'rsatish
          </button>

          <button
            onClick={onReseed}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-line bg-surface hover:bg-surface-raised text-muted hover:text-ink text-xs font-semibold transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Namuna qabullarni tiklash
          </button>

          <button
            onClick={handleWipeClick}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ml-auto ${
              confirmWipe
                ? "bg-crit text-white hover:bg-crit/90 shadow-xs"
                : "border border-line bg-surface hover:bg-surface-raised text-crit"
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            {confirmWipe ? "Aniq tozalansinmi? Yana bosing" : "Jurnalni tozalash"}
          </button>
        </div>

        {/* CSV Textarea view */}
        {showCsvBox && (
          <div className="mt-4 p-4 border border-line rounded-2xl bg-surface-raised animate-in fade-in">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-ink">CSV matni:</span>
              <button
                onClick={() => setShowCsvBox(false)}
                className="text-xs text-muted hover:text-ink cursor-pointer font-bold"
              >
                Yopish
              </button>
            </div>
            <textarea
              readOnly
              value={csvText}
              rows={5}
              className="w-full font-mono text-[11px] p-3 rounded-xl bg-surface border border-line text-ink resize-y"
            />
            {copiedMsg && (
              <p className="text-xs text-ok mt-1.5 font-bold">{copiedMsg}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
