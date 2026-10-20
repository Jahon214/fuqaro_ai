import React from "react";
import { Sliders, HelpCircle, Bot, Sparkles, ExternalLink, ShieldCheck } from "lucide-react";

export function SettingsAside({ threshold, setThreshold, onThresholdChange, onOpenTelegram }) {
  return (
    <aside className="space-y-4">
      {/* 1. Qoidalar sozlamasi */}
      <div className="bg-surface border border-line rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-accent grid place-items-center">
            <Sliders className="w-3.5 h-3.5" />
          </div>
          <h3 className="font-display font-bold text-base text-ink">Qoidalar Sozlamasi</h3>
        </div>
        <p className="text-xs text-muted mb-3">
          Ijtimoiy mezonlar va AI tahlili chegaralari (hokimlik mutaxassisi qiymati).
        </p>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="thr" className="text-xs font-semibold text-ink">
            Kam ta'minlanganlik chegarasi (so'm, kishi boshiga oyiga)
          </label>
          <div className="relative">
            <input
              id="thr"
              type="number"
              min="0"
              step="50000"
              inputMode="numeric"
              value={threshold}
              onChange={(e) => {
                const val = Number(e.target.value);
                setThreshold(val);
                if (onThresholdChange) onThresholdChange(val);
              }}
              className="w-full bg-bg border border-line rounded-xl px-3.5 py-2 text-sm text-ink font-mono focus:outline-accent"
            />
            <span className="absolute right-3 top-2.5 text-xs text-muted font-semibold">UZS</span>
          </div>
        </div>
        <p className="text-[11px] text-muted mt-2">
          Agar kishi boshiga daromad ushbu miqdordan past bo'lsa, tizim "Ijtimoiy reestr" va bolalar nafaqasini ustuvor qilib belgilaydi.
        </p>
      </div>

      {/* 2. AI Copilot status card */}
      <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/25 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
            AI Maslahatchi Faol
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-white">
            BEPUL
          </span>
        </div>
        <p className="text-xs text-ink/80 leading-relaxed">
          Har bir to'ldirilgan so'rovnoma bo'yicha sun'iy intellekt avtomatik tahlil qilib, <b>MFY mas'ul xodimi uchun aniq qadam-baqadam tavsiyalar</b> ishlab chiqadi.
        </p>
      </div>

      {/* 3. Test rejimi qanday ishlaydi */}
      <div className="bg-surface border border-line rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <HelpCircle className="w-4 h-4 text-accent" />
          <h3 className="font-display font-bold text-base text-ink">Tizim qanday ishlaydi</h3>
        </div>
        <ul className="text-xs text-muted space-y-2 mt-3 list-disc pl-4 leading-relaxed">
          <li>Tavsiyalar shaffof qoidalar va neyrotahlil vositasida avtomatik hisoblanadi.</li>
          <li>Hech qanday tashqi ma'lumotlar oshkor etilmaydi, ma'lumotlar xavfsiz saqlanadi.</li>
          <li>Jurnalda to'liq ism-familiya emas, bosh harflar saqlanadi.</li>
          <li>Yakuniy qaror faqat xodim (mahalla yettiligi) tomonidan qabul qilinadi.</li>
        </ul>
      </div>

      {/* 4. Telegram Quick Nav */}
      <div className="p-4 rounded-2xl border border-line bg-surface flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5">
          <Bot className="w-5 h-5 text-accent" />
          <div>
            <span className="font-bold text-xs text-ink block">Telegram Botlar</span>
            <span className="text-[11px] text-muted">Admin va Fuqaro botlari</span>
          </div>
        </div>
        <button
          onClick={onOpenTelegram}
          className="text-xs font-bold text-accent hover:underline flex items-center gap-1 cursor-pointer"
        >
          Sozlash <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
}
