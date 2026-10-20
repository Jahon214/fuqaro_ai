import React, { useState, useEffect } from "react";
import { MFYS, TYPES, fmt } from "../constants.js";
import { Sparkles, RotateCcw, Send, User, Home, Briefcase, MessageSquare, Check, AlertCircle, Calculator } from "lucide-react";

export function IntakeForm({ onSubmit, initialValues = null, threshold = 1000000 }) {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    mfy: "",
    type: "",
    members: "",
    children: "",
    income: "",
    housing: "",
    work: "",
    edu: "",
    disab: "",
    debt: "",
    notes: "",
    consent: false
  });

  const [errorMsg, setErrorMsg] = useState("");

  // Check Telegram WebApp user
  useEffect(() => {
    if (initialValues) {
      setFormData(initialValues);
    } else if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
      const u = window.Telegram.WebApp.initDataUnsafe.user;
      const tgName = `${u.first_name || ""} ${u.last_name || ""}`.trim();
      if (tgName) {
        setFormData(prev => ({ ...prev, name: tgName, consent: true }));
      }
    }
  }, [initialValues]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleFillSample = () => {
    setFormData({
      name: "Aziza Karimova",
      age: "34",
      gender: "Ayol",
      mfy: "Xovosobod",
      type: "ish",
      members: "5",
      children: "3",
      income: "3200000",
      housing: "rent",
      work: "jobless",
      edu: "college",
      disab: "0",
      debt: "no",
      notes: "Kichik tikuvchilik sexi ochmoqchi, mahalla orqali subsidiya yoki imtiyozli kredit olmoqchi.",
      consent: true
    });
    setErrorMsg("");
  };

  const handleReset = () => {
    setFormData({
      name: "",
      age: "",
      gender: "",
      mfy: "",
      type: "",
      members: "",
      children: "",
      income: "",
      housing: "",
      work: "",
      edu: "",
      disab: "",
      debt: "",
      notes: "",
      consent: false
    });
    setErrorMsg("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const err = [];

    if (!formData.name.trim()) err.push("ism va familiya");
    if (formData.age === "" || isNaN(Number(formData.age))) err.push("yoshi");
    if (!formData.mfy) err.push("MFY");
    if (!formData.type) err.push("murojaat turi");

    if (err.length) {
      setErrorMsg("To'ldirilishi shart: " + err.join(", ") + ".");
      return;
    }

    if (!formData.consent) {
      setErrorMsg("Fuqaro ma'lumotlarini qayta ishlashga rozilikni belgilang.");
      return;
    }

    const membersNum = formData.members !== "" ? Number(formData.members) : null;
    const childrenNum = formData.children !== "" ? Number(formData.children) : null;

    if (membersNum != null && childrenNum != null && childrenNum >= membersNum) {
      setErrorMsg("Bolalar soni oila a'zolaridan kam bo'lishi kerak.");
      return;
    }

    setErrorMsg("");

    onSubmit({
      name: formData.name.trim(),
      age: Number(formData.age),
      gender: formData.gender,
      mfy: formData.mfy,
      type: formData.type,
      members: membersNum,
      children: childrenNum,
      income: formData.income !== "" ? Number(formData.income) : null,
      housing: formData.housing,
      work: formData.work,
      edu: formData.edu,
      disab: formData.disab === "" ? null : Number(formData.disab),
      debt: formData.debt,
      notes: formData.notes,
      consent: formData.consent
    });
  };

  // Live Per-Capita Income Calculation
  const membersCount = Number(formData.members) || 0;
  const incomeAmount = Number(formData.income) || 0;
  const perCapita = membersCount > 0 ? Math.round(incomeAmount / membersCount) : null;
  const isPovertyLevel = perCapita !== null && perCapita < threshold;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Top Banner Card */}
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-display font-bold text-ink flex items-center gap-2">
            Fuqaro Qabuli & So'rovnomasi
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Xatlov yoki sayyor qabul ma'lumotlarini kiriting. Tizim xolis tahlil qilib, MFY xodimi va fuqaro uchun eng mos dasturlarni aniqlaydi.
          </p>
        </div>

        <button
          type="button"
          onClick={handleFillSample}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-semibold text-xs transition cursor-pointer shadow-2xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          Namuna bilan to'ldirish
        </button>
      </div>

      {/* 1. FUQARO SHAXSIY MA'LUMOTLARI */}
      <div className="rounded-2xl border border-line bg-surface p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-line">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-accent grid place-items-center">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-ink">1. Fuqaro Shaxsiy Ma'lumotlari</h3>
            <p className="text-[11px] text-muted">Fuqaroni identifikatsiyalash va hududiy bog'lash</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="sm:col-span-2 md:col-span-3 flex flex-col gap-1.5">
            <label htmlFor="name" className="text-xs font-semibold text-ink">
              Ism va familiya <span className="text-crit">*</span>
            </label>
            <input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Masalan: Aziza Karimova"
              className="bg-bg border border-line rounded-xl px-3.5 py-2.5 text-sm text-ink focus:outline-accent focus:ring-1 focus:ring-accent"
              autoComplete="off"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="age" className="text-xs font-semibold text-ink">
              Yoshi <span className="text-crit">*</span>
            </label>
            <input
              id="age"
              name="age"
              type="number"
              min="0"
              max="110"
              value={formData.age}
              onChange={handleChange}
              placeholder="34"
              className="bg-bg border border-line rounded-xl px-3.5 py-2.5 text-sm text-ink focus:outline-accent focus:ring-1 focus:ring-accent"
              inputMode="numeric"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="gender" className="text-xs font-semibold text-ink">
              Jinsi <span className="text-[11px] font-normal text-muted">(xolislik uchun)</span>
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="bg-bg border border-line rounded-xl px-3.5 py-2.5 text-sm text-ink focus:outline-accent"
            >
              <option value="">Ko'rsatilmagan</option>
              <option value="Ayol">Ayol</option>
              <option value="Erkak">Erkak</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="mfy" className="text-xs font-semibold text-ink">
              Mahalla (MFY) <span className="text-crit">*</span>
            </label>
            <select
              id="mfy"
              name="mfy"
              value={formData.mfy}
              onChange={handleChange}
              className="bg-bg border border-line rounded-xl px-3.5 py-2.5 text-sm text-ink focus:outline-accent"
            >
              <option value="">Tanlang</option>
              {MFYS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 md:col-span-3 flex flex-col gap-1.5">
            <label htmlFor="type" className="text-xs font-semibold text-ink">
              Asosiy murojaat turi <span className="text-crit">*</span>
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="bg-bg border border-line rounded-xl px-3.5 py-2.5 text-sm text-ink focus:outline-accent"
            >
              <option value="">Tanlang</option>
              {Object.entries(TYPES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. OILA TARKIBI VA DAROMAD HOLATI */}
      <div className="rounded-2xl border border-line bg-surface p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-line">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-accent grid place-items-center">
              <Home className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-ink">2. Oila va Moliyaviy Ahvol</h3>
              <p className="text-[11px] text-muted">Daromad mezonlari va ijtimoiy reestr ko'rsatkichlari</p>
            </div>
          </div>

          {/* Live Per-Capita Indicator */}
          {perCapita !== null && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl bg-surface-raised border border-line text-xs font-mono">
              <Calculator className="w-3.5 h-3.5 text-accent" />
              <span>{fmt(perCapita)} UZS / kishi</span>
              <span className={`w-2 h-2 rounded-full ${isPovertyLevel ? "bg-crit" : "bg-ok"}`} />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="members" className="text-xs font-semibold text-ink">
              Oila a'zolari soni (birga yashovchilar)
            </label>
            <input
              id="members"
              name="members"
              type="number"
              min="1"
              max="30"
              value={formData.members}
              onChange={handleChange}
              placeholder="5"
              className="bg-bg border border-line rounded-xl px-3.5 py-2.5 text-sm text-ink focus:outline-accent"
              inputMode="numeric"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="children" className="text-xs font-semibold text-ink">
              Shundan 18 yoshgacha bolalar soni
            </label>
            <input
              id="children"
              name="children"
              type="number"
              min="0"
              max="20"
              value={formData.children}
              onChange={handleChange}
              placeholder="3"
              className="bg-bg border border-line rounded-xl px-3.5 py-2.5 text-sm text-ink focus:outline-accent"
              inputMode="numeric"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="income" className="text-xs font-semibold text-ink">
              Oilaning oylik umumiy daromadi (so'm)
            </label>
            <input
              id="income"
              name="income"
              type="number"
              min="0"
              step="50000"
              value={formData.income}
              onChange={handleChange}
              placeholder="3200000"
              className="bg-bg border border-line rounded-xl px-3.5 py-2.5 text-sm text-ink focus:outline-accent"
              inputMode="numeric"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="housing" className="text-xs font-semibold text-ink">
              Uy-joy sharoiti
            </label>
            <select
              id="housing"
              name="housing"
              value={formData.housing}
              onChange={handleChange}
              className="bg-bg border border-line rounded-xl px-3.5 py-2.5 text-sm text-ink focus:outline-accent"
            >
              <option value="">Ko'rsatilmagan</option>
              <option value="own">O'z uyi, qoniqarli</option>
              <option value="bad">O'z uyi, yomon sharoitda</option>
              <option value="rent">Ijarada</option>
              <option value="none">Uy-joyi yo'q</option>
            </select>
          </div>
        </div>

        {/* Dynamic calculation banner */}
        {perCapita !== null && (
          <div className="p-3 rounded-xl bg-surface-raised border border-line/70 text-xs flex items-center justify-between">
            <span className="text-muted">
              Kishi boshiga daromad: <b className="text-ink font-mono">{fmt(perCapita)} so'm/oy</b>
            </span>
            <span className={`font-semibold ${isPovertyLevel ? "text-crit" : "text-ok"}`}>
              {isPovertyLevel
                ? "⚠️ Belgilangan sinov chegarasidan past (Ijtimoiy reestr mezoniga mos)"
                : "✅ Chegaradan yuqori"}
            </span>
          </div>
        )}
      </div>

      {/* 3. BANDLIK, TA'LIM VA SOG'LIQ */}
      <div className="rounded-2xl border border-line bg-surface p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-line">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-accent grid place-items-center">
            <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-ink">3. Bandlik, Ta'lim va Salomatlik</h3>
            <p className="text-[11px] text-muted">Mehnat qobiliyati, kasbiy ta'lim va imtiyozlar</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="work" className="text-xs font-semibold text-ink">
              Bandlik holati
            </label>
            <select
              id="work"
              name="work"
              value={formData.work}
              onChange={handleChange}
              className="bg-bg border border-line rounded-xl px-3.5 py-2.5 text-sm text-ink focus:outline-accent"
            >
              <option value="">Ko'rsatilmagan</option>
              <option value="jobless">Ishsiz</option>
              <option value="employed">Ishlaydi</option>
              <option value="self">O'zini o'zi band qilgan</option>
              <option value="student">Talaba / o'quvchi</option>
              <option value="home">Uy bekasi</option>
              <option value="retired">Pensioner</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="edu" className="text-xs font-semibold text-ink">
              Ta'lim darajasi
            </label>
            <select
              id="edu"
              name="edu"
              value={formData.edu}
              onChange={handleChange}
              className="bg-bg border border-line rounded-xl px-3.5 py-2.5 text-sm text-ink focus:outline-accent"
            >
              <option value="">Ko'rsatilmagan</option>
              <option value="none">Maktabni tugatmagan</option>
              <option value="school">O'rta maktab</option>
              <option value="college">O'rta maxsus / Kollej / Litsey</option>
              <option value="uni">Oliy ta'lim</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="disab" className="text-xs font-semibold text-ink">
              Nogironlik guruhi
            </label>
            <select
              id="disab"
              name="disab"
              value={formData.disab}
              onChange={handleChange}
              className="bg-bg border border-line rounded-xl px-3.5 py-2.5 text-sm text-ink focus:outline-accent"
            >
              <option value="">Ko'rsatilmagan</option>
              <option value="0">Yo'q</option>
              <option value="1">I guruh</option>
              <option value="2">II guruh</option>
              <option value="3">III guruh</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="debt" className="text-xs font-semibold text-ink">
              Kredit yoki qarzi bormi
            </label>
            <select
              id="debt"
              name="debt"
              value={formData.debt}
              onChange={handleChange}
              className="bg-bg border border-line rounded-xl px-3.5 py-2.5 text-sm text-ink focus:outline-accent"
            >
              <option value="">Ko'rsatilmagan</option>
              <option value="no">Yo'q</option>
              <option value="yes">Bor</option>
            </select>
          </div>

          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <label htmlFor="notes" className="text-xs font-semibold text-ink">
              Fuqaro so'zi bilan: aniq nima yordam kerak? <span className="font-normal text-muted">(ixtiyoriy)</span>
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={2}
              placeholder="Masalan: Tikuvchilik sexi ochmoqchi, subsidiya yoki imtiyozli kredit kerak..."
              className="bg-bg border border-line rounded-xl px-3.5 py-2.5 text-sm text-ink focus:outline-accent resize-y"
            />
          </div>
        </div>
      </div>

      {/* Consent & Submit */}
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-xs space-y-4">
        <label className="flex items-start gap-3 text-sm font-medium text-ink cursor-pointer">
          <input
            type="checkbox"
            name="consent"
            checked={formData.consent}
            onChange={handleChange}
            className="mt-1 w-4 h-4 rounded text-accent focus:ring-accent accent-accent cursor-pointer"
          />
          <span className="leading-relaxed">
            Fuqaro ma'lumotlarini dasturiy tavsiya olish va MFY xodimi tomonidan ko'rib chiqish maqsadida qayta ishlashga rozilik berdi.
          </span>
        </label>

        {errorMsg && (
          <div className="flex items-center gap-2 p-3 bg-crit-bg text-crit border border-crit/20 rounded-xl text-xs font-semibold" role="alert">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm transition-all shadow-md shadow-emerald-600/20 active:scale-98 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            AI Tavsiya va Xulosa Olish
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl border border-line bg-surface hover:bg-surface-raised text-muted font-semibold text-xs transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Tozalash
          </button>
        </div>
      </div>
    </form>
  );
}
