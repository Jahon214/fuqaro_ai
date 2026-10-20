import React, { useState } from "react";
import { TYPES, PRIORITY_LABELS, REJECT_REASONS, fmt } from "../constants.js";
import { AiAdvisorCard } from "./AiAdvisorCard.jsx";
import { CheckCircle2, AlertTriangle, XCircle, ArrowLeft, Save, Send, Sparkles, Building, FileCheck, ArrowRight, UserCheck } from "lucide-react";

export function ResultView({ currentCase, onBackToIntake, onSaveCase, onDecisionChange, onUpdateAiAnalysis }) {
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);

  if (!currentCase) {
    return (
      <div className="bg-surface border border-line rounded-2xl p-12 text-center text-muted">
        <Sparkles className="w-8 h-8 text-accent mx-auto mb-3" />
        <p className="text-base font-semibold text-ink">Hali qabul kiritilmagan.</p>
        <p className="text-xs text-muted mt-1">Avval «Yangi qabul» bo'limida fuqaro ma'lumotlarini to'ldiring.</p>
        <button
          onClick={onBackToIntake}
          className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-accent-ink font-semibold text-xs cursor-pointer shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Yangi qabulga o'tish
        </button>
      </div>
    );
  }

  const { p, out, decisions = {}, aiAnalysis } = currentCase;
  const recs = out?.recs || [];
  const doneCount = Object.keys(decisions).length;

  const handleDecisionClick = (recId, action) => {
    const cur = decisions[recId];
    let newDecisions = { ...decisions };

    if (cur && cur.d === action) {
      delete newDecisions[recId];
    } else {
      newDecisions[recId] = { d: action, reason: cur?.reason || "" };
    }
    onDecisionChange(newDecisions);
    setSaveError("");
  };

  const handleReasonChange = (recId, reason) => {
    const cur = decisions[recId] || { d: "no", reason: "" };
    const newDecisions = {
      ...decisions,
      [recId]: { ...cur, reason }
    };
    onDecisionChange(newDecisions);
    setSaveError("");
  };

  const handleSave = async () => {
    setSaveError("");
    setSaving(true);
    try {
      await onSaveCase();
    } finally {
      setSaving(false);
    }
  };

  // Telegram WebApp direct submit handler
  const handleTelegramSendData = () => {
    if (window.Telegram?.WebApp) {
      const payload = {
        ...p,
        decisions,
        aiAnalysis,
        savedAt: Date.now()
      };
      window.Telegram.WebApp.sendData(JSON.stringify(payload));
    }
  };

  return (
    <div className="space-y-6">
      {/* Real-time Telegram Delivery Banner */}
      <div className="bg-ok-bg border border-ok/30 rounded-2xl p-4 sm:p-5 flex items-center gap-3.5 shadow-xs">
        <div className="w-10 h-10 rounded-xl bg-ok text-white grid place-items-center shrink-0">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div>
          <h4 className="font-bold text-sm sm:text-base text-ok">
            So'rovnoma muvaffaqiyatli qabul qilindi!
          </h4>
          <p className="text-xs sm:text-sm text-ok/80 mt-0.5">
            Barcha ma'lumotlar va sun'iy intellekt xulosasi MFY mas'ul xodimi (Admin Telegram boti)ga yuborildi.
          </p>
        </div>
      </div>

      {/* 1. AI ADVISOR CARD FOR ADMIN (PRIMARY NEW FEATURE) */}
      {aiAnalysis && (
        <AiAdvisorCard
          aiAnalysis={aiAnalysis}
          citizenName={p.name}
          onReanalyze={onUpdateAiAnalysis}
        />
      )}

      {/* 2. CITIZEN PROFILE SUMMARY CARD */}
      <div className="bg-surface border border-line rounded-2xl p-5 md:p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-line">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl font-display font-bold text-ink">{p.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface-raised border border-line text-muted">
                {p.gender || "Ko'rsatilmagan"}
              </span>
            </div>
            <p className="text-xs md:text-sm text-muted mt-1">
              📍 <b>{p.mfy} MFY</b> · Murojaat: <span className="text-accent font-semibold">{TYPES[p.type] || p.type}</span>
            </p>
          </div>
          <button
            onClick={onBackToIntake}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-line bg-surface hover:bg-surface-raised text-accent text-xs font-semibold transition cursor-pointer shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Ma'lumotni o'zgartirish
          </button>
        </div>

        {/* Bento Numbers Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
          <div className="bg-surface-raised rounded-xl p-3.5 border border-line/60">
            <span className="block text-[11px] font-bold text-muted uppercase tracking-wider">Yoshi</span>
            <span className="text-base font-bold text-ink mt-0.5 block">{p.age} yosh</span>
          </div>

          <div className="bg-surface-raised rounded-xl p-3.5 border border-line/60">
            <span className="block text-[11px] font-bold text-muted uppercase tracking-wider">Oila</span>
            <span className="text-base font-bold text-ink mt-0.5 block">
              {p.members != null ? `${p.members} kishi` : "—"}
              {p.children ? `, ${p.children} bola` : ""}
            </span>
          </div>

          <div className="bg-surface-raised rounded-xl p-3.5 border border-line/60">
            <span className="block text-[11px] font-bold text-muted uppercase tracking-wider">Daromad</span>
            <span className="text-base font-bold text-ink mt-0.5 block font-mono">
              {out.pc != null ? `${fmt(out.pc)} UZS` : "—"}
            </span>
            <span className="text-[10px] text-muted">kishi boshiga</span>
          </div>

          <div className="bg-surface-raised rounded-xl p-3.5 border border-line/60">
            <span className="block text-[11px] font-bold text-muted uppercase tracking-wider">Ishonchlilik</span>
            <span className="text-base font-bold text-ink mt-0.5 block">{out.conf}%</span>
            <div className="h-1.5 w-full bg-line rounded-full overflow-hidden mt-1.5">
              <div
                className="h-full bg-accent rounded-full transition-all duration-400"
                style={{ width: `${out.conf}%` }}
              />
            </div>
          </div>
        </div>

        {out.missing && out.missing.length > 0 && (
          <div className="mt-4 bg-amber-500/10 text-amber-700 dark:text-amber-300 rounded-xl p-3 text-xs leading-relaxed border border-amber-500/20">
            Eslatma: <b>{out.missing.join(", ")}</b> ko'rsatilmagan. Ushbu maydonlar to'ldirilsa, AI tahlili yanada aniqroq bo'ladi.
          </div>
        )}
      </div>

      {/* 3. RECOMMENDATIONS & STAFF DECISIONS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-lg text-ink flex items-center gap-2">
            Mos Davlat Yordam Dasturlari va Xodim Qarorlari
          </h3>
          <span className="text-xs text-muted font-medium">
            Jami: {recs.length} ta dastur
          </span>
        </div>

        {recs.map((r, i) => {
          const dec = decisions[r.id] || {};
          const isOk = dec.d === "ok";
          const isEdit = dec.d === "edit";
          const isNo = dec.d === "no";

          const borderCls = isOk
            ? "border-ok bg-ok/5"
            : isNo
            ? "border-crit bg-crit/5"
            : isEdit
            ? "border-warn bg-warn/5"
            : "border-line bg-surface";

          const pTagCls =
            r.pri === 3
              ? "bg-crit-bg text-crit border-crit/20"
              : r.pri === 2
              ? "bg-warn-bg text-warn border-warn/20"
              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";

          return (
            <article
              key={r.id}
              className={`border-2 rounded-2xl p-5 md:p-6 transition-all shadow-xs ${borderCls}`}
            >
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h4 className="font-display font-bold text-base md:text-lg text-ink">
                  {i + 1}. {r.title}
                </h4>
                <span className={`text-xs font-bold rounded-full px-3 py-1 border whitespace-nowrap ${pTagCls}`}>
                  {PRIORITY_LABELS[r.pri]} ustuvorlik
                </span>
              </div>

              {/* Why */}
              <div className="mt-3">
                <span className="text-xs font-semibold text-muted block mb-1">Tavsiya asosi (Nima uchun):</span>
                <ul className="list-disc pl-5 text-xs md:text-sm text-ink/90 space-y-0.5">
                  {r.why.map((w, wi) => (
                    <li key={wi}>{w}</li>
                  ))}
                </ul>
              </div>

              {/* Institution, Docs, Steps */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-3 border-t border-line/60 text-xs">
                <div className="p-3 rounded-xl bg-surface-raised/70 border border-line/60">
                  <span className="text-[11px] font-bold text-muted flex items-center gap-1 mb-1">
                    <Building className="w-3.5 h-3.5 text-accent" />
                    Mas'ul idora / Joy
                  </span>
                  <p className="font-semibold text-ink leading-snug">{r.where}</p>
                </div>

                <div className="p-3 rounded-xl bg-surface-raised/70 border border-line/60">
                  <span className="text-[11px] font-bold text-muted flex items-center gap-1 mb-1">
                    <FileCheck className="w-3.5 h-3.5 text-accent" />
                    Kerakli hujjatlar
                  </span>
                  <p className="text-ink leading-snug">
                    {r.docs && r.docs.length ? r.docs.join(", ") : "Hozircha kerak emas"}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-surface-raised/70 border border-line/60">
                  <span className="text-[11px] font-bold text-muted flex items-center gap-1 mb-1">
                    <ArrowRight className="w-3.5 h-3.5 text-accent" />
                    Amaliy qadamlar
                  </span>
                  <p className="text-ink leading-snug">
                    {r.steps.map((s, si) => `${si + 1}) ${s}`).join("; ")}
                  </p>
                </div>
              </div>

              {/* Staff Decision Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-line">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-muted mr-1">Xodim qarori:</span>

                  <button
                    type="button"
                    onClick={() => handleDecisionClick(r.id, "ok")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                      isOk
                        ? "bg-ok text-white border-ok shadow-xs"
                        : "bg-surface text-ink border-line hover:border-ok/50"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Tasdiqlash
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDecisionClick(r.id, "edit")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                      isEdit
                        ? "bg-warn text-white border-warn shadow-xs"
                        : "bg-surface text-ink border-line hover:border-warn/50"
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    O'zgartirish
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDecisionClick(r.id, "no")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                      isNo
                        ? "bg-crit text-white border-crit shadow-xs"
                        : "bg-surface text-ink border-line hover:border-crit/50"
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Rad etish
                  </button>
                </div>

                {/* Reason Dropdown */}
                {(isNo || isEdit) && (
                  <select
                    value={dec.reason || ""}
                    onChange={(e) => handleReasonChange(r.id, e.target.value)}
                    className="bg-surface border border-line rounded-xl px-3 py-1.5 text-xs text-ink focus:outline-accent"
                  >
                    <option value="">Sababni tanlang</option>
                    {REJECT_REASONS.map(rsn => (
                      <option key={rsn} value={rsn}>{rsn}</option>
                    ))}
                  </select>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* 4. BOTTOM SAVE ACTION BAR */}
      <div className="bg-surface border border-line rounded-2xl p-5 md:p-6 shadow-md flex flex-wrap items-center justify-between gap-4 sticky bottom-4 z-30 backdrop-blur-md">
        <div>
          <span className="text-xs md:text-sm text-ink font-semibold flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-accent" />
            {doneCount} / {recs.length} tavsiya bo'yicha qaror belgilandi
          </span>
          {saveError && (
            <p className="text-xs text-crit mt-1 font-medium">{saveError}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {window.Telegram?.WebApp?.initData && (
            <button
              type="button"
              onClick={handleTelegramSendData}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-ok text-white font-bold text-xs hover:opacity-95 cursor-pointer shadow-xs"
            >
              <Send className="w-4 h-4" />
              Telegramga yuborish
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs transition-all shadow-md shadow-emerald-600/20 active:scale-98 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saqlanmoqda..." : "Qabulni Saqlash va Adminga Yuborish"}
          </button>
        </div>
      </div>
    </div>
  );
}
