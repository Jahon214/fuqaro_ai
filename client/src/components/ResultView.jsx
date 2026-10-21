import React from "react";
import { TYPES, PRIORITY_LABELS, fmt } from "../constants.js";
import { CheckCircle2, Building, FileCheck, ArrowRight, PlusCircle, User, ShieldCheck } from "lucide-react";

export function ResultView({ currentCase, onBackToIntake }) {
  if (!currentCase) {
    return (
      <div className="bg-surface border border-line rounded-2xl p-12 text-center text-muted">
        <CheckCircle2 className="w-10 h-10 text-accent mx-auto mb-3" />
        <p className="text-base font-semibold text-ink">Hali so'rovnoma to'ldirilmagan.</p>
        <p className="text-xs text-muted mt-1">Avval so'rovnoma formasini to'ldiring.</p>
        <button
          onClick={onBackToIntake}
          className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-accent-ink font-semibold text-xs cursor-pointer shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          So'rovnomani to'ldirish
        </button>
      </div>
    );
  }

  const { p, out } = currentCase;
  const recs = out?.recs || [];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* 1. SUCCESS CONFIRMATION BANNER */}
      <div className="bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/5 border border-emerald-500/30 rounded-2xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white grid place-items-center shadow-md shadow-emerald-500/25 shrink-0">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              So'rovnoma muvaffaqiyatli qabul qilindi
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-ink">
              Rahmat, {p.name || "Fuqaro"}!
            </h2>
            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              Sizning so'rovnomangiz va sun'iy intellekt tahlili Xovos tumani <b>{p.mfy || "Xovosobod"} MFY</b> mas'ul xodimi (Hokim yordamchisi)ga yo'naltirildi. Mahalla mas'ullari arizangizni ko'rib chiqib, tez orada siz bilan bog'lanishadi.
            </p>
          </div>
        </div>
      </div>

      {/* 2. CITIZEN PROFILE SUMMARY */}
      <div className="bg-surface border border-line rounded-2xl p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-line">
          <div>
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">Fuqaro profili</span>
            <h3 className="text-lg font-display font-bold text-ink mt-0.5">{p.name}</h3>
            <p className="text-xs text-muted mt-0.5">
              📍 <b>{p.mfy} MFY</b> · Murojaat yo'nalishi: <span className="text-accent font-semibold">{TYPES[p.type] || p.type}</span>
            </p>
          </div>

          <button
            onClick={onBackToIntake}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-raised border border-line hover:border-accent text-accent text-xs font-semibold transition cursor-pointer shadow-2xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Yangi so'rovnoma
          </button>
        </div>

        {/* Bento Numbers Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-surface-raised rounded-xl p-3 border border-line/60">
            <span className="block text-[10px] font-bold text-muted uppercase tracking-wider">Yoshi</span>
            <span className="text-sm font-bold text-ink mt-0.5 block">{p.age} yosh ({p.gender || "—"})</span>
          </div>

          <div className="bg-surface-raised rounded-xl p-3 border border-line/60">
            <span className="block text-[10px] font-bold text-muted uppercase tracking-wider">Oila tarkibi</span>
            <span className="text-sm font-bold text-ink mt-0.5 block">
              {p.members != null ? `${p.members} kishi` : "—"}
              {p.children ? ` (${p.children} bola)` : ""}
            </span>
          </div>

          <div className="bg-surface-raised rounded-xl p-3 border border-line/60 col-span-2 sm:col-span-1">
            <span className="block text-[10px] font-bold text-muted uppercase tracking-wider">Kishi boshiga daromad</span>
            <span className="text-sm font-bold text-ink mt-0.5 block font-mono">
              {out.pc != null ? `${fmt(out.pc)} UZS/oy` : "Ko'rsatilmagan"}
            </span>
          </div>
        </div>
      </div>

      {/* 3. MATCHING GOVERNMENT PROGRAMS & CITIZEN GUIDANCE */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-base md:text-lg text-ink">
              Sizga Mos Keluvchi Davlat Yordam Dasturlari
            </h3>
            <p className="text-xs text-muted mt-0.5">
              Sun'iy intellekt tomonidan tahlil qilingan imkoniyatlar va kerakli hujjatlar
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-surface-raised border border-line text-muted font-bold">
            {recs.length} ta dastur
          </span>
        </div>

        {recs.map((r, i) => {
          const pTagCls =
            r.pri === 3
              ? "bg-crit-bg text-crit border-crit/20"
              : r.pri === 2
              ? "bg-warn-bg text-warn border-warn/20"
              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";

          return (
            <article
              key={r.id}
              className="bg-surface border border-line rounded-2xl p-5 md:p-6 transition-all shadow-xs space-y-3"
            >
              {/* Program Header */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h4 className="font-display font-bold text-base text-ink">
                  {i + 1}. {r.title}
                </h4>
                <span className={`text-xs font-bold rounded-full px-2.5 py-0.5 border whitespace-nowrap ${pTagCls}`}>
                  {PRIORITY_LABELS[r.pri]} ustuvorlik
                </span>
              </div>

              {/* Why */}
              <div>
                <span className="text-xs font-semibold text-muted block mb-1">Nima uchun mos keladi:</span>
                <ul className="list-disc pl-5 text-xs text-ink/90 space-y-0.5">
                  {r.why.map((w, wi) => (
                    <li key={wi}>{w}</li>
                  ))}
                </ul>
              </div>

              {/* Institution, Docs, Steps */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-line/60 text-xs">
                <div className="p-3 rounded-xl bg-surface-raised/70 border border-line/60">
                  <span className="text-[11px] font-bold text-muted flex items-center gap-1 mb-1">
                    <Building className="w-3.5 h-3.5 text-accent" />
                    Qayerga murojaat qilish kerak
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
                    Keyingi qadamlar
                  </span>
                  <p className="text-ink leading-snug">
                    {r.steps.map((s, si) => `${si + 1}) ${s}`).join("; ")}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Bottom Action */}
      <div className="p-5 rounded-2xl bg-surface border border-line shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div>
          <h4 className="font-bold text-sm text-ink">Boshqa murojaatingiz bormi?</h4>
          <p className="text-xs text-muted mt-0.5">Oilangizning boshqa a'zosi yoki yangi masala bo'yicha so'rovnoma to'ldirishingiz mumkin.</p>
        </div>
        <button
          onClick={onBackToIntake}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-accent-ink font-bold text-xs cursor-pointer shadow-xs hover:opacity-95 transition shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          Yangi so'rovnoma to'ldirish
        </button>
      </div>
    </div>
  );
}
