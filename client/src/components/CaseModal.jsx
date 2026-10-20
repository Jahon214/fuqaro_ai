import React, { useState } from "react";
import { TYPES, PRIORITY_LABELS, REJECT_REASONS, fmt } from "../constants.js";
import { AiAdvisorCard } from "./AiAdvisorCard.jsx";
import { X, CheckCircle2, AlertTriangle, XCircle, User, Home, Briefcase, GraduationCap, DollarSign, Calendar, Sparkles } from "lucide-react";

export function CaseModal({ caseData, onClose, onUpdateDecision, onReanalyzeCase }) {
  const [reanalyzing, setReanalyzing] = useState(false);

  if (!caseData) return null;

  const dateStr = new Date(caseData.ts).toLocaleString("uz-UZ");
  const recs = caseData.recs || [];
  const decisions = caseData.decisions || {};

  const handleDecision = (recId, action, reason = "") => {
    const updated = {
      ...decisions,
      [recId]: { d: action, reason }
    };
    onUpdateDecision(caseData.id, updated);
  };

  const handleReanalyze = async () => {
    if (!onReanalyzeCase) return;
    setReanalyzing(true);
    try {
      await onReanalyzeCase(caseData.id);
    } finally {
      setReanalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-surface border border-line rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative my-8 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 w-9 h-9 rounded-full bg-surface-raised hover:bg-line text-muted hover:text-ink grid place-items-center transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="pr-12 pb-4 border-b border-line">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-accent/10 text-accent font-bold">
              #{caseData.id}
            </span>
            {caseData.example ? (
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-surface-raised text-muted font-medium">
                namuna qabul
              </span>
            ) : (
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-medium">
                haqiqiy ariza
              </span>
            )}
            <span className="text-xs text-muted flex items-center gap-1 ml-auto">
              <Calendar className="w-3.5 h-3.5" />
              {dateStr}
            </span>
          </div>

          <h3 className="font-display font-bold text-2xl text-ink">
            {caseData.name || caseData.ini}
          </h3>
          <p className="text-xs text-muted mt-1">
            📍 {caseData.mfy} MFY · <span className="text-accent font-semibold">{TYPES[caseData.type] || caseData.type}</span>
          </p>
        </div>

        {/* AI ADVISOR SECTION INSIDE MODAL */}
        <div className="my-5">
          {caseData.aiAnalysis ? (
            <AiAdvisorCard
              aiAnalysis={caseData.aiAnalysis}
              citizenName={caseData.name || caseData.ini}
              onReanalyze={handleReanalyze}
            />
          ) : (
            <div className="p-4 rounded-2xl bg-surface-raised border border-line flex items-center justify-between">
              <div>
                <span className="font-bold text-sm text-ink block">AI Tahlili hali kiritilmagan</span>
                <span className="text-xs text-muted">Ushbu fuqaro bo'yicha sun'iy intellekt xulosasini generatsiya qiling</span>
              </div>
              <button
                onClick={handleReanalyze}
                disabled={reanalyzing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-accent text-accent-ink font-semibold text-xs cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {reanalyzing ? "Generatsiya..." : "AI Tahlil qilish"}
              </button>
            </div>
          )}
        </div>

        {/* Demographic & Household Bento Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4 text-xs">
          <div className="bg-surface-raised p-3 rounded-xl border border-line/60 flex items-center gap-2.5">
            <User className="w-4 h-4 text-accent shrink-0" />
            <div>
              <span className="text-muted block text-[11px]">Yosh & Jins</span>
              <span className="font-bold text-ink">{caseData.age} yosh, {caseData.gender || "—"}</span>
            </div>
          </div>

          <div className="bg-surface-raised p-3 rounded-xl border border-line/60 flex items-center gap-2.5">
            <Home className="w-4 h-4 text-accent shrink-0" />
            <div>
              <span className="text-muted block text-[11px]">Oila tarkibi</span>
              <span className="font-bold text-ink">
                {caseData.members || "—"} kishi ({caseData.children || 0} bola)
              </span>
            </div>
          </div>

          <div className="bg-surface-raised p-3 rounded-xl border border-line/60 flex items-center gap-2.5">
            <DollarSign className="w-4 h-4 text-accent shrink-0" />
            <div>
              <span className="text-muted block text-[11px]">Kishi boshiga</span>
              <span className="font-bold text-ink font-mono">
                {caseData.pc != null ? `${fmt(caseData.pc)} so'm` : "—"}
              </span>
            </div>
          </div>

          <div className="bg-surface-raised p-3 rounded-xl border border-line/60 flex items-center gap-2.5">
            <Briefcase className="w-4 h-4 text-accent shrink-0" />
            <div>
              <span className="text-muted block text-[11px]">Bandlik</span>
              <span className="font-bold text-ink">{caseData.work || "—"}</span>
            </div>
          </div>

          <div className="bg-surface-raised p-3 rounded-xl border border-line/60 flex items-center gap-2.5">
            <GraduationCap className="w-4 h-4 text-accent shrink-0" />
            <div>
              <span className="text-muted block text-[11px]">Ta'limi</span>
              <span className="font-bold text-ink">{caseData.edu || "—"}</span>
            </div>
          </div>

          <div className="bg-surface-raised p-3 rounded-xl border border-line/60">
            <span className="text-muted block text-[11px]">Uy-joy holati</span>
            <span className="font-bold text-ink">{caseData.housing || "—"}</span>
          </div>
        </div>

        {caseData.notes && (
          <div className="bg-surface-raised border border-line rounded-xl p-3.5 text-xs mb-5">
            <span className="font-bold text-muted block mb-1">Fuqaro so'zi bilan murojaat:</span>
            <p className="text-ink italic leading-relaxed">"{caseData.notes}"</p>
          </div>
        )}

        {/* Recommendations list */}
        <div className="mt-5">
          <h4 className="font-display font-bold text-base text-ink mb-3">
            Tavsiyalar va Xodim Qarorlari ({recs.length} ta)
          </h4>

          <div className="space-y-3">
            {recs.map((r, idx) => {
              const dec = decisions[r.id] || {};
              const isOk = dec.d === "ok";
              const isEdit = dec.d === "edit";
              const isNo = dec.d === "no";

              return (
                <div
                  key={r.id}
                  className={`border-2 rounded-2xl p-4 text-xs ${
                    isOk ? "border-ok bg-ok/5" : isNo ? "border-crit bg-crit/5" : isEdit ? "border-warn bg-warn/5" : "border-line bg-surface"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-ink text-sm">
                      {idx + 1}. {r.title}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-surface-raised border border-line text-muted shrink-0">
                      {PRIORITY_LABELS[r.pri]} ustuvorlik
                    </span>
                  </div>

                  <p className="text-muted mt-1.5"><b>Idora:</b> {r.where}</p>
                  {r.docs && r.docs.length > 0 && (
                    <p className="text-muted mt-0.5"><b>Hujjatlar:</b> {r.docs.join(", ")}</p>
                  )}

                  {/* Decision toggles */}
                  <div className="flex flex-wrap items-center gap-2 mt-3 pt-2.5 border-t border-line/60">
                    <button
                      onClick={() => handleDecision(r.id, "ok")}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        isOk ? "bg-ok text-white shadow-xs" : "bg-surface-raised text-muted hover:text-ink"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Tasdiqlangan
                    </button>

                    <button
                      onClick={() => handleDecision(r.id, "edit", dec.reason || "Ma'lumot yetarli emas")}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        isEdit ? "bg-warn text-white shadow-xs" : "bg-surface-raised text-muted hover:text-ink"
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      O'zgartirish
                    </button>

                    <button
                      onClick={() => handleDecision(r.id, "no", dec.reason || "Fuqaroga mos emas")}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        isNo ? "bg-crit text-white shadow-xs" : "bg-surface-raised text-muted hover:text-ink"
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Rad etilgan
                    </button>

                    {(isNo || isEdit) && (
                      <select
                        value={dec.reason || ""}
                        onChange={(e) => handleDecision(r.id, dec.d, e.target.value)}
                        className="bg-surface border border-line rounded-lg px-2.5 py-1 text-xs text-ink"
                      >
                        {REJECT_REASONS.map(rsn => (
                          <option key={rsn} value={rsn}>{rsn}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-line flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-surface-raised hover:bg-line text-ink text-xs font-semibold cursor-pointer"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
}
