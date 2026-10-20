import React, { useState } from "react";
import { Sparkles, ShieldAlert, CheckCircle, AlertTriangle, ArrowRight, RefreshCw, Cpu, BookOpen } from "lucide-react";

export function AiAdvisorCard({ aiAnalysis, onReanalyze, citizenName }) {
  const [reanalyzing, setReanalyzing] = useState(false);

  if (!aiAnalysis) return null;

  const handleReanalyze = async () => {
    if (!onReanalyze) return;
    setReanalyzing(true);
    try {
      await onReanalyze();
    } finally {
      setReanalyzing(false);
    }
  };

  const getRiskBadge = (level) => {
    if (level === "Yuqori") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-crit-bg text-crit border border-crit/20">
          <span className="w-1.5 h-1.5 rounded-full bg-crit animate-pulse" />
          Yuqori xavf
        </span>
      );
    }
    if (level === "O'rta") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-warn-bg text-warn border border-warn/20">
          <span className="w-1.5 h-1.5 rounded-full bg-warn" />
          O'rta xavf
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-ok-bg text-ok border border-ok/20">
        <span className="w-1.5 h-1.5 rounded-full bg-ok" />
        Past xavf
      </span>
    );
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-br from-surface via-surface to-emerald-950/5 dark:to-emerald-950/20 p-5 md:p-6 shadow-lg">
      {/* Decorative gradient blur */}
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-line">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white grid place-items-center shadow-md shadow-emerald-500/20">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-lg md:text-xl text-ink">
                AI Maslahatchi (Admin / MFY xodimi uchun)
              </h3>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <Cpu className="w-3 h-3" />
                {aiAnalysis.engine || "AI Copilot"}
              </span>
            </div>
            <p className="text-xs text-muted mt-0.5">
              {citizenName ? `${citizenName} bo'yicha ` : ""}chuqur tahliliy xulosa va MFY mas'ullari uchun yo'riqnoma
            </p>
          </div>
        </div>

        {onReanalyze && (
          <button
            type="button"
            onClick={handleReanalyze}
            disabled={reanalyzing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-surface hover:bg-surface-raised text-xs font-semibold text-ink transition cursor-pointer shadow-xs disabled:opacity-50"
            title="AI tahlilini qayta yangilash"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${reanalyzing ? "animate-spin text-accent" : ""}`} />
            {reanalyzing ? "Tahlil qilinmoqda..." : "Qayta tahlil"}
          </button>
        )}
      </div>

      {/* Summary Box */}
      <div className="mt-4 p-3.5 rounded-xl bg-surface-raised/70 border border-line/60">
        <span className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1">
          📌 Ijtimoiy-Iqtisodiy Holat Xulosasi:
        </span>
        <p className="text-sm font-medium text-ink leading-relaxed">
          "{aiAnalysis.summary}"
        </p>
      </div>

      {/* Risk Assessment Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
        <div className="p-3 rounded-xl bg-surface border border-line">
          <span className="text-[11px] font-semibold text-muted block mb-1">Kambag'allik xavfi</span>
          <div>{getRiskBadge(aiAnalysis.povertyRisk)}</div>
        </div>

        <div className="p-3 rounded-xl bg-surface border border-line">
          <span className="text-[11px] font-semibold text-muted block mb-1">Qarz tangligi xavfi</span>
          <div>{getRiskBadge(aiAnalysis.debtRisk)}</div>
        </div>

        <div className="p-3 rounded-xl bg-surface border border-line">
          <span className="text-[11px] font-semibold text-muted block mb-1">Tavsiya etilgan dastur</span>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 truncate block">
            {aiAnalysis.socialPackage || "Ijtimoiy yordam"}
          </span>
        </div>
      </div>

      {/* Actionable Advice List for Admin */}
      <div className="mt-2 space-y-2">
        <span className="text-xs font-bold text-ink flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-accent" />
          MFY Mas'ul Xodimi (Hokim yordamchisi) uchun 3 ta qat'iy harakat:
        </span>
        <div className="space-y-2">
          {(aiAnalysis.adminAdvice || []).map((step, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 p-2.5 rounded-lg bg-surface border border-line/70 text-xs md:text-sm text-ink/90 leading-relaxed"
            >
              <span className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] grid place-items-center shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span>{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Decision Banner */}
      <div className="mt-4 pt-3 border-t border-line flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-muted">AI tomonidan tavsiya etilgan qaror:</span>
          <span className="font-bold px-2.5 py-1 rounded-md bg-emerald-500 text-white text-xs">
            {aiAnalysis.recommendedAction || "Tasdiqlash"}
          </span>
        </div>
        {aiAnalysis.actionRationale && (
          <span className="text-muted italic text-[11.5px]">
            Asos: {aiAnalysis.actionRationale}
          </span>
        )}
      </div>
    </div>
  );
}
