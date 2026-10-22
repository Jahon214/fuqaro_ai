import React, { useState, useEffect, useRef } from "react";
import { MFYS, TYPES } from "./constants.js";
import { initials, runAiAnalysis } from "./services/aiService.js";
import { downloadCsv, downloadExcel, parseSections } from "./services/excelExporter.js";

const STORAGE_KEY = "fuqaroai.mobile.v1";
const THEME_KEY = "fuqaro_theme";

// Section Icons
const SECTION_ICONS = [
  // 0: Summary / Document
  <path key="0" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8" />,
  // 1: Risk & Opportunity / Shield
  <path key="1" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M12 8v4 M12 16h.01" />,
  // 2: Steps / Action List
  <g key="2"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></g>,
  // 3: Alternative / Lightbulb
  <path key="3" d="M9 18h6 M10 22h4 M12 2a7 7 0 0 0-7 7c0 2.5 1.5 4.5 3 6h8c1.5-1.5 3-3.5 3-6a7 7 0 0 0-7-7z" />
];

function getSectionIcon(i) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {SECTION_ICONS[i % SECTION_ICONS.length]}
    </svg>
  );
}

// Markdown blocks parser for AI result text
function renderMarkdownBlocks(text = "") {
  const inline = (s) => {
    return s
      .replace(/\*\*([^*]+)\*\*/g, "<strong class='font-bold text-[var(--ink)]'>$1</strong>")
      .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>");
  };

  const lines = text.split("\n");
  const elements = [];
  let currentList = null;

  const flushList = (key) => {
    if (currentList) {
      if (currentList.type === "ul") {
        elements.push(
          <ul key={`ul-${key}`} className="my-2.5 space-y-1.5 pl-5 list-disc">
            {currentList.items.map((item, idx) => (
              <li key={idx} className="leading-relaxed" dangerouslySetInnerHTML={{ __html: inline(item) }} />
            ))}
          </ul>
        );
      } else {
        elements.push(
          <ol key={`ol-${key}`} className="my-2.5 space-y-2 pl-1 list-none">
            {currentList.items.map((item, idx) => (
              <li key={idx} className="flex gap-2.5 items-start leading-relaxed">
                <span className="w-5 h-5 rounded-full bg-[var(--soft)] border border-[var(--soft-border)] text-[var(--accent)] font-bold text-[11px] flex items-center justify-center flex-none mt-0.5">
                  {idx + 1}
                </span>
                <span className="flex-1" dangerouslySetInnerHTML={{ __html: inline(item) }} />
              </li>
            ))}
          </ol>
        );
      }
      currentList = null;
    }
  };

  lines.forEach((raw, idx) => {
    const l = raw.trim();
    if (!l) {
      flushList(idx);
      return;
    }

    const ulMatch = l.match(/^[-*•]\s+(.*)/);
    if (ulMatch) {
      if (!currentList || currentList.type !== "ul") {
        flushList(idx);
        currentList = { type: "ul", items: [] };
      }
      currentList.items.push(ulMatch[1]);
      return;
    }

    const olMatch = l.match(/^\d+[.)]\s+(.*)/);
    if (olMatch) {
      if (!currentList || currentList.type !== "ol") {
        flushList(idx);
        currentList = { type: "ol", items: [] };
      }
      currentList.items.push(olMatch[1]);
      return;
    }

    flushList(idx);
    const cleanP = l.replace(/^#+\s*/, "");
    elements.push(
      <p key={`p-${idx}`} className="my-1.5 leading-relaxed text-[var(--ink)]" dangerouslySetInnerHTML={{ __html: inline(cleanP) }} />
    );
  });

  flushList("end");
  return elements;
}

export default function App() {
  const [view, setView] = useState("form"); // "form" | "result" | "hist"
  const [step, setStep] = useState(1); // 1 | 2 | 3
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || "light");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    mahalla: "",
    social: "",
    work: "",
    phys: "",
    goal: "",
    skills: "",
    consent: false
  });

  const [formError, setFormError] = useState("");
  const [cur, setCur] = useState(null); // { meta, text, state: "loading" | "done" | "error", error, engine }
  const [hist, setHist] = useState(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      return v ? JSON.parse(v) : [];
    } catch (e) {
      return [];
    }
  });

  const [copySuccess, setCopySuccess] = useState(false);
  const [wipeConfirm, setWipeConfirm] = useState(false);
  const abortControllerRef = useRef(null);
  const mainRef = useRef(null);

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  // Persist history
  const persistHistory = (newHist) => {
    setHist(newHist);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHist.slice(0, 50)));
    } catch (e) {}
  };

  const scrollToTop = () => {
    if (mainRef.current) mainRef.current.scrollTop = 0;
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === "dark" ? "light" : "dark"));
  };

  const goToView = (v) => {
    setView(v);
    scrollToTop();
  };

  // Validation
  const validateStep = (s) => {
    if (s === 1) {
      if (!formData.name.trim()) return "F.I.Sh. kiriting.";
      const ageNum = Number(formData.age);
      if (!ageNum || ageNum < 16 || ageNum > 100) return "Yoshni 16 dan 100 gacha to'g'ri kiriting.";
      if (!formData.mahalla) return "Mahallani tanlang.";
    }
    if (s === 2) {
      if (!formData.social) return "Ijtimoiy holatini tanlang.";
      if (!formData.work) return "Bandlik holatini tanlang.";
      if (!formData.phys) return "Jismoniy holatini tanlang.";
    }
    if (s === 3) {
      if (!formData.goal) return "Murojaat masalasini tanlang.";
      if (!formData.skills.trim()) return "Qobiliyat va qiziqishlarini yozing.";
      if (!formData.consent) return "Fuqaro roziligini belgilang.";
    }
    return "";
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    const err = validateStep(step);
    if (err) {
      setFormError(err);
      return;
    }
    setFormError("");

    if (step < 3) {
      setStep(step + 1);
      scrollToTop();
      return;
    }

    // Step 3 completed -> run AI analysis
    startAnalysis(formData);
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setFormError("");
      setStep(step - 1);
      scrollToTop();
    }
  };

  // Start analysis
  const startAnalysis = async (data) => {
    const meta = {
      ini: initials(data.name),
      name: data.name.trim(),
      age: Number(data.age),
      mahalla: data.mahalla,
      social: data.social,
      work: data.work,
      phys: data.phys,
      goal: data.goal,
      skills: data.skills.trim(),
      ts: Date.now()
    };

    const newCur = {
      meta,
      text: "",
      state: "loading",
      error: "",
      engine: ""
    };

    setCur(newCur);
    goToView("result");

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const ac = new AbortController();
    abortControllerRef.current = ac;

    try {
      const res = await runAiAnalysis(data, ac.signal);
      const finishedCur = {
        meta,
        text: res.text,
        state: "done",
        error: "",
        engine: res.engine
      };
      setCur(finishedCur);

      // Add to history
      const newEntry = {
        id: String(meta.ts),
        meta,
        text: res.text,
        engine: res.engine
      };
      const updatedHist = [newEntry, ...hist.filter(h => h.id !== newEntry.id)];
      persistHistory(updatedHist);
    } catch (err) {
      if (err && err.name === "AbortError") return;
      setCur({
        meta,
        text: "",
        state: "error",
        error: "Tahlil qilib bo'lmadi. Internet ulanishingizni tekshirib, qayta urinib ko'ring.",
        engine: ""
      });
    }
  };

  const handleRetry = () => {
    if (cur && cur.meta) {
      startAnalysis({
        ...cur.meta,
        consent: true
      });
    }
  };

  const handleCancelAnalysis = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setCur(null);
    goToView("form");
  };

  const handleFillDemo = () => {
    setFormData({
      name: "Valiyev Ali Oltiboy o'g'li",
      age: 29,
      mahalla: "Xovosobod MFY",
      social: "Yoshlar daftari",
      work: "Ishsiz",
      phys: "Sog'lom",
      goal: "Tadbirkorlikni rivojlantirish masalasi",
      skills: "Qandolatchilik bo'yicha 3 yillik tajriba, uyda kichik pishiriq sexi ochmoqchi",
      consent: true
    });
    setFormError("");
    setStep(3);
  };

  const handleCopyResult = () => {
    if (!cur || !cur.text) return;
    const txt = `Fuqaro AI tavsiyasi (${cur.meta.ini}, ${cur.meta.age} yosh, ${cur.meta.mahalla})\nMurojaat masalasi: ${cur.meta.goal}\n\n${cur.text}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 1800);
      }).catch(() => {
        fallbackCopy(txt);
      });
    } else {
      fallbackCopy(txt);
    }
  };

  const fallbackCopy = (txt) => {
    const ta = document.createElement("textarea");
    ta.value = txt;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 1800);
  };

  const handleStartNew = () => {
    setCur(null);
    setFormData({
      name: "",
      age: "",
      mahalla: "",
      social: "",
      work: "",
      phys: "",
      goal: "",
      skills: "",
      consent: false
    });
    setFormError("");
    setStep(1);
    goToView("form");
  };

  const handleHistoryItemClick = (h) => {
    setCur({
      meta: h.meta,
      text: h.text,
      state: "done",
      error: "",
      engine: h.engine || "Fuqaro AI"
    });
    goToView("result");
  };

  const handleWipeHistory = () => {
    if (wipeConfirm) {
      persistHistory([]);
      setWipeConfirm(false);
    } else {
      setWipeConfirm(true);
      setTimeout(() => setWipeConfirm(false), 4000);
    }
  };

  const stepTitles = ["Fuqaro ma'lumotlari", "Ijtimoiy holati", "Murojaat va maqsad"];

  return (
    <div className="app" id="app">
      {/* Top Bar with Responsive Desktop Navigation */}
      <header className="bar pad">
        <div className="flex items-center gap-3">
          <div className="logo" aria-hidden="true">F</div>
          <div>
            <h1>Fuqaro AI</h1>
            <small>Xovos tumani • MFY yettiligi</small>
          </div>
        </div>

        {/* Center Desktop Navigation (hidden on mobile, visible on desktop md+) */}
        <div className="spacer hidden md:block"></div>
        <nav className="hidden md:flex items-center gap-1.5 bg-black/15 p-1 rounded-xl border border-white/20 backdrop-blur-md">
          <button
            onClick={() => goToView("form")}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              view === "form"
                ? "bg-white text-[var(--accent-dark)] shadow-sm"
                : "text-white/90 hover:text-white hover:bg-white/10"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>Qabul</span>
          </button>

          <button
            onClick={() => goToView("result")}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              view === "result"
                ? "bg-white text-[var(--accent-dark)] shadow-sm"
                : "text-white/90 hover:text-white hover:bg-white/10"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
              <path d="M9 12l2 2 4-4" />
              <circle cx="12" cy="12" r="9" />
            </svg>
            <span>Tahlil</span>
          </button>

          <button
            onClick={() => goToView("hist")}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              view === "hist"
                ? "bg-white text-[var(--accent-dark)] shadow-sm"
                : "text-white/90 hover:text-white hover:bg-white/10"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>Tarix</span>
            {hist.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                view === "hist" ? "bg-[var(--soft)] text-[var(--accent)]" : "bg-white/25 text-white"
              }`}>
                {hist.length}
              </span>
            )}
          </button>
        </nav>

        <div className="spacer"></div>
        
        {/* Dark/Light mode switcher */}
        <button
          onClick={toggleTheme}
          title={theme === "dark" ? "Kunduzgi rejim" : "Tungi rejim"}
          aria-label="Rejimni o'zgartirish"
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white border border-white/15 mr-1"
        >
          {theme === "dark" ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        {/* Live Status Pill */}
        <span className="test-pill">
          <span className="live-dot"></span>
          Pilot
        </span>
      </header>

      {/* Main Content Area */}
      <main className="pad main-content" id="main" ref={mainRef}>
        {/* ================= SCREEN 1: QABUL ================= */}
        {view === "form" && (
          <section className="screen" id="s-form" aria-label="Yangi qabul">
            {/* Desktop Responsive Grid: 4 cols sidebar + 8 cols form */}
            <div className="md:grid md:grid-cols-12 md:gap-8 items-start">
              
              {/* Desktop Left Sidebar (Stepper overview & Tips) */}
              <div className="hidden md:flex md:col-span-4 flex-col gap-4">
                {/* Stepper Card */}
                <div className="card-pro space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[var(--line-subtle)]">
                    <h3 className="font-bold text-base">Qabul bosqichlari</h3>
                    <span className="badge-counter">{step} / 3</span>
                  </div>

                  <div className="space-y-3">
                    {[
                      { num: 1, title: "Fuqaro ma'lumotlari", desc: "F.I.Sh., yoshi, mahallasi" },
                      { num: 2, title: "Ijtimoiy holati", desc: "Daftarlar, bandlik, salomatlik" },
                      { num: 3, title: "Murojaat va maqsad", desc: "Sohasi, qobiliyati, rozilik" }
                    ].map((st) => (
                      <div
                        key={st.num}
                        className={`p-3 rounded-xl border transition-all flex items-start gap-3 ${
                          step === st.num
                            ? "bg-[var(--soft)] border-[var(--soft-border)] text-[var(--ink)] shadow-sm"
                            : step > st.num
                            ? "bg-[var(--bg-subtle)] border-[var(--line)] text-[var(--muted)]"
                            : "border-transparent text-[var(--muted)] opacity-60"
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center flex-none mt-0.5 ${
                            step === st.num
                              ? "bg-[var(--accent)] text-white"
                              : step > st.num
                              ? "bg-emerald-500 text-white"
                              : "bg-[var(--line)] text-[var(--muted)]"
                          }`}
                        >
                          {step > st.num ? "✓" : st.num}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm leading-snug">{st.title}</p>
                          <p className="text-xs text-[var(--muted)] mt-0.5">{st.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Helpful Instruction Card */}
                <div className="p-4 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--line)] space-y-2">
                  <div className="flex items-center gap-2 text-[var(--accent)] font-bold text-xs uppercase tracking-wider">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    <span>MFY xodimi uchun</span>
                  </div>
                  <p className="text-xs text-[var(--muted)] leading-relaxed">
                    Ushbu tizim fuqaroni qabul qilish jarayonida <strong>Hokim yordamchisi</strong> va <strong>Ijtimoiy xodim</strong> uchun qonuniy mezonlar asosida avtomatik AI tavsiya shakllantirib beradi.
                  </p>
                </div>

                {/* Desktop Demo Button */}
                <button
                  type="button"
                  className="w-full py-3 px-4 rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--soft)] text-[var(--muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
                  onClick={handleFillDemo}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-[var(--accent)]">
                    <path d="M15 4V2 M15 16v-2 M8 9h2 M20 9h2 M17.8 11.8L19 13 M15 9h0 M17.8 6.2L19 5 M3 21l9-9" />
                  </svg>
                  <span>Namuna bilan to'ldirish (Demo)</span>
                </button>
              </div>

              {/* Right Column: Form Container */}
              <div className="md:col-span-8 space-y-4">
                {/* Mobile Stepper Header (hidden on desktop md+) */}
                <div className="stepper-wrap md:hidden">
                  <div className="stephead">
                    <h2>{stepTitles[step - 1]}</h2>
                    <span className="badge-counter">{step} / 3</span>
                  </div>

                  <div className="steps-bar" aria-hidden="true">
                    <i className={step >= 1 ? "on" : ""}></i>
                    <i className={step >= 2 ? "on" : ""}></i>
                    <i className={step >= 3 ? "on" : ""}></i>
                  </div>
                </div>

                <form id="form" className="card-pro" onSubmit={handleNextStep} noValidate>
                  {/* STEP 1: FUQARO */}
                  {step === 1 && (
                    <div className="fieldgrid" data-step="1">
                      <div className="f-pro">
                        <label htmlFor="name">
                          <span>Fuqaro F.I.Sh.</span>
                          <span className="text-[11.5px] font-normal text-[var(--muted)]">To'liq ism</span>
                        </label>
                        <input
                          type="text"
                          id="name"
                          className="input-pro"
                          autoComplete="off"
                          placeholder="Masalan: Valiyev Ali Oltiboy o'g'li"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                        <div className="flex items-center gap-1.5 text-[12px] text-[var(--muted)] mt-1">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 flex-none text-[var(--accent)]">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                          <span>AI tahliliga to'liq ism yuborilmaydi, faqat bosh harflar uzatiladi.</span>
                        </div>
                      </div>

                      <div className="row2">
                        <div className="f-pro">
                          <label htmlFor="age">Yosh</label>
                          <input
                            type="number"
                            id="age"
                            className="input-pro text-center font-semibold"
                            min="16"
                            max="100"
                            inputMode="numeric"
                            placeholder="34"
                            value={formData.age}
                            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                          />
                        </div>

                        <div className="f-pro">
                          <label htmlFor="mahalla">Mahalla (Hudud)</label>
                          <select
                            id="mahalla"
                            className="input-pro font-medium"
                            value={formData.mahalla}
                            onChange={(e) => setFormData({ ...formData, mahalla: e.target.value })}
                          >
                            <option value="">Mahallani tanlang</option>
                            {MFYS.map((m) => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: HOLATI */}
                  {step === 2 && (
                    <div className="fieldgrid" data-step="2">
                      <fieldset className="fset-pro">
                        <legend>Ijtimoiy daftarlar va reyestr</legend>
                        <div className="chips-pro">
                          {[
                            "Temir daftar",
                            "Ayollar daftari",
                            "Yoshlar daftari",
                            "Ijtimoiy himoya yagona reyestri",
                            "Reyestrda yo'q"
                          ].map((item) => (
                            <label key={item}>
                              <input
                                type="radio"
                                name="social"
                                value={item}
                                checked={formData.social === item}
                                onChange={(e) => setFormData({ ...formData, social: e.target.value })}
                              />
                              <span>{item === "Ijtimoiy himoya yagona reyestri" ? "Yagona reyestr" : item}</span>
                            </label>
                          ))}
                        </div>
                      </fieldset>

                      <fieldset className="fset-pro">
                        <legend>Bandlik holati</legend>
                        <div className="chips-pro">
                          {[
                            "Ishsiz",
                            "Norasmiy band",
                            "Talaba",
                            "Uy bekasi",
                            "Rasmiy band"
                          ].map((item) => (
                            <label key={item}>
                              <input
                                type="radio"
                                name="work"
                                value={item}
                                checked={formData.work === item}
                                onChange={(e) => setFormData({ ...formData, work: e.target.value })}
                              />
                              <span>{item}</span>
                            </label>
                          ))}
                        </div>
                      </fieldset>

                      <fieldset className="fset-pro">
                        <legend>Jismoniy va salomatlik holati</legend>
                        <div className="chips-pro">
                          {[
                            "Sog'lom",
                            "Nogironligi bor",
                            "Surunkali kasallik"
                          ].map((item) => (
                            <label key={item}>
                              <input
                                type="radio"
                                name="phys"
                                value={item}
                                checked={formData.phys === item}
                                onChange={(e) => setFormData({ ...formData, phys: e.target.value })}
                              />
                              <span>{item}</span>
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    </div>
                  )}

                  {/* STEP 3: MAQSAD */}
                  {step === 3 && (
                    <div className="fieldgrid" data-step="3">
                      <div className="f-pro">
                        <label htmlFor="goal">
                          <span>Murojaat masalasi (yo'nalishi)</span>
                          <span className="text-[11.5px] font-normal text-[var(--muted)]">38 ta yo'nalish</span>
                        </label>
                        <select
                          id="goal"
                          className="input-pro font-medium"
                          value={formData.goal}
                          onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                        >
                          <option value="">Yo'nalishni tanlang</option>
                          {Object.entries(TYPES).map(([k, v]) => (
                            <option key={k} value={v}>{v}</option>
                          ))}
                        </select>
                      </div>

                      <div className="f-pro">
                        <label htmlFor="skills">Qobiliyat, qiziqish va mutaxassisligi</label>
                        <textarea
                          id="skills"
                          className="input-pro"
                          placeholder="Masalan: qandolatchilik, IT dasturlash, tikuvchilik, chorvachilik yoki avto-ta'mirlash bo'yicha ko'nikmasi bor"
                          value={formData.skills}
                          onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                        ></textarea>
                      </div>

                      <label className="check-pro">
                        <input
                          type="checkbox"
                          id="consent"
                          checked={formData.consent}
                          onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                        />
                        <span>
                          Fuqaro ma'lumotlarini qonuniy tartibda tavsiya olish va MFY doirasida qayta ishlashga rozilik bildirdi.
                        </span>
                      </label>
                    </div>
                  )}

                  {/* Error Alert */}
                  {formError && (
                    <div className="p-3.5 rounded-xl bg-[var(--crit-bg)] border border-[var(--crit-border)] text-[var(--crit)] text-[13px] font-semibold flex items-center gap-2 mt-4">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 flex-none">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Navigation Buttons (Full Width) */}
                  <div className="flex gap-3 mt-6">
                    {step > 1 && (
                      <button
                        type="button"
                        className="btn-pro btn-ghost-pro flex-1"
                        id="prev"
                        onClick={handlePrevStep}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                          <polyline points="15 18 9 12 15 6" />
                        </svg>
                        Orqaga
                      </button>
                    )}
                    <button
                      type="submit"
                      className="btn-pro btn-primary-pro flex-1"
                      id="next"
                    >
                      {step === 3 ? (
                        <>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                          </svg>
                          AI tahlil qilish
                        </>
                      ) : (
                        <>
                          Keyingi
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Mobile Demo Button (hidden on desktop md+) */}
                <div className="md:hidden">
                  <button
                    type="button"
                    className="w-full py-3 px-4 rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--soft)] text-[var(--muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
                    id="demo"
                    onClick={handleFillDemo}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-[var(--accent)]">
                      <path d="M15 4V2 M15 16v-2 M8 9h2 M20 9h2 M17.8 11.8L19 13 M15 9h0 M17.8 6.2L19 5 M3 21l9-9" />
                    </svg>
                    <span>Namuna bilan to'ldirish (Tezkor Demo)</span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ================= SCREEN 2: TAHLIL ================= */}
        {view === "result" && (
          <section className="screen" id="s-result" aria-label="Tahlil">
            {!cur ? (
              /* Centered empty state card with full-width centered button */
              <div className="card-pro text-center py-16 px-6 flex flex-col items-center max-w-lg mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-[var(--soft)] text-[var(--accent)] border border-[var(--soft-border)] flex items-center justify-center mb-4 shadow-sm">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Hozircha tahlil yo'q</h3>
                <p className="text-[var(--muted)] text-sm max-w-sm mx-auto mb-6 leading-relaxed">
                  Fuqaroni qabul qilish va AI xulosasini ko'rish uchun «Qabul» bo'limida shaklni to'ldiring.
                </p>
                <div className="w-full max-w-xs">
                  <button
                    onClick={() => goToView("form")}
                    className="btn-pro btn-primary-pro w-full py-3.5 px-6 text-sm font-bold shadow-md"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>Qabulga o'tish</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Wide Bento Citizen Header Card */}
                <div className="card-pro">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex gap-4 items-center min-w-0">
                      <div className="avatar-pro" style={{ width: "52px", height: "52px", fontSize: "18px" }}>
                        {cur.meta.ini.replace(/\./g, "")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2.5">
                          <h2 className="text-xl font-bold tracking-tight truncate">{cur.meta.ini}, {cur.meta.age} yosh</h2>
                          {cur.engine && (
                            <span className="text-[11px] font-bold text-[var(--accent)] bg-[var(--soft)] border border-[var(--soft-border)] rounded-full px-3 py-1 whitespace-nowrap">
                              Gemini AI
                            </span>
                          )}
                        </div>
                        <p className="text-[13.5px] text-[var(--muted)] font-medium mt-0.5">{cur.meta.mahalla}</p>
                      </div>
                    </div>

                    {/* Quick Desktop Actions in Header */}
                    {cur.state === "done" && (
                      <div className="hidden md:flex items-center gap-2.5 flex-none">
                        <button
                          className="btn-pro btn-primary-pro py-2 px-4 text-xs font-bold"
                          onClick={handleCopyResult}
                        >
                          {copySuccess ? "✓ Nusxa olindi!" : "Nusxa olish"}
                        </button>
                        <button
                          className="btn-pro btn-ghost-pro py-2 px-4 text-xs font-bold"
                          onClick={handleStartNew}
                        >
                          Yangi qabul
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Citizen Tags */}
                  <div className="flex flex-wrap gap-2 mt-4 pt-3.5 border-t border-[var(--line-subtle)]">
                    <span className="tag-pill font-bold text-[var(--accent)] bg-[var(--soft)] border-[var(--soft-border)]">
                      {cur.meta.goal}
                    </span>
                    <span className="tag-pill">{cur.meta.work}</span>
                    <span className="tag-pill">{cur.meta.phys}</span>
                    <span className="tag-pill">{cur.meta.social}</span>
                  </div>
                </div>

                {/* State: Loading */}
                {cur.state === "loading" && (
                  <div className="card-pro space-y-3 py-8 max-w-xl mx-auto" aria-live="polite">
                    <div className="flex items-center gap-2.5 font-bold text-sm text-[var(--accent)]">
                      <svg className="animate-spin h-5 w-5 text-[var(--accent)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Google Gemini sun'iy intellekti tahlil qilmoqda…</span>
                    </div>
                    <div className="skel-pro" style={{ width: "95%" }}></div>
                    <div className="skel-pro" style={{ width: "80%" }}></div>
                    <div className="skel-pro" style={{ width: "88%" }}></div>
                    <div className="skel-pro" style={{ width: "65%" }}></div>

                    <div className="pt-3 max-w-xs mx-auto">
                      <button className="btn-pro btn-ghost-pro w-full text-xs" id="cancel" onClick={handleCancelAnalysis}>
                        Bekor qilish
                      </button>
                    </div>
                  </div>
                )}

                {/* State: Error */}
                {cur.state === "error" && (
                  <div className="card-pro space-y-4 max-w-lg mx-auto">
                    <div className="p-4 rounded-xl bg-[var(--crit-bg)] border border-[var(--crit-border)] text-[var(--crit)] flex items-start gap-2.5">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 flex-none mt-0.5">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <p className="text-sm font-semibold">{cur.error}</p>
                    </div>
                    <div className="flex gap-2.5">
                      <button className="btn-pro btn-primary-pro flex-1" id="retry" onClick={handleRetry}>
                        Qayta urinish
                      </button>
                      <button className="btn-pro btn-ghost-pro flex-1" id="edit" onClick={() => goToView("form")}>
                        O'zgartirish
                      </button>
                    </div>
                  </div>
                )}

                {/* State: Done -> 2x2 Desktop Bento Grid */}
                {cur.state === "done" && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                      {parseSections(cur.text).map((s, i) => (
                        <article key={i} className="sec-card">
                          <div className="sec-head">
                            <span className="sec-ic">{getSectionIcon(i)}</span>
                            <h3>{s.title}</h3>
                          </div>
                          <div className="sec-body">
                            {renderMarkdownBlocks(s.body)}
                          </div>
                        </article>
                      ))}
                    </div>

                    {/* Disclaimer Note */}
                    <div className="note-pro">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 flex-none mt-0.5">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                      <span>
                        AI tavsiyasi qaror qabul qilishni qo'llab-quvvatlovchi yordamchi vosita hisoblanadi. Yakuniy rasmiy hujjatlar va dastur shartlari MFY mas'ul xodimi (Hokim yordamchisi) tomonidan tasdiqlanadi.
                      </span>
                    </div>

                    {/* Action Buttons (Visible on mobile and desktop) */}
                    <div className="flex gap-3 pt-2">
                      <button
                        className="btn-pro btn-primary-pro flex-1 py-3.5"
                        id="copy"
                        onClick={handleCopyResult}
                      >
                        {copySuccess ? (
                          <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Nusxa olindi!
                          </>
                        ) : (
                          <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                            Nusxa olish
                          </>
                        )}
                      </button>

                      <button
                        className="btn-pro btn-ghost-pro flex-1 py-3.5"
                        id="again"
                        onClick={handleStartNew}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Yangi qabul
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </section>
        )}

        {/* ================= SCREEN 3: TARIX ================= */}
        {view === "hist" && (
          <section className="screen" id="s-hist" aria-label="Tarix">
            {hist.length === 0 ? (
              /* Centered empty state card with full-width centered button */
              <div className="card-pro text-center py-16 px-6 flex flex-col items-center max-w-lg mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-[var(--soft)] text-[var(--accent)] border border-[var(--soft-border)] flex items-center justify-center mb-4 shadow-sm">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
                    <circle cx="12" cy="12" r="9" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Tarix hozircha bo'sh</h3>
                <p className="text-[var(--muted)] text-sm max-w-sm mx-auto mb-6 leading-relaxed">
                  Qabul qilingan fuqarolar tahlili shu yerda avtomatik saqlanib boradi.
                </p>
                <div className="w-full max-w-xs">
                  <button
                    onClick={() => goToView("form")}
                    className="btn-pro btn-primary-pro w-full py-3.5 px-6 text-sm font-bold shadow-md"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>Yangi qabul boshlash</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Stats & Dual Export Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] animate-pulse"></span>
                    <div>
                      <p className="text-sm font-bold text-[var(--ink)]">Qurilmada saqlangan fuqarolar</p>
                      <p className="text-xs text-[var(--muted)]">Jami {hist.length} ta tahlil yozuvi</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => downloadExcel(hist)}
                      className="py-2.5 px-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-95 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-2 transition-all shadow-sm"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="8" y1="13" x2="16" y2="13" />
                        <line x1="8" y1="17" x2="16" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                      <span>Excel (.xls)</span>
                    </button>

                    <button
                      onClick={() => downloadCsv(hist)}
                      className="py-2.5 px-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] hover:border-[var(--accent)] active:scale-95 text-[var(--ink)] font-bold text-xs flex items-center gap-2 transition-all shadow-sm"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-[var(--accent)]">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      <span>CSV yuklab olish</span>
                    </button>
                  </div>
                </div>

                {/* History Items: 2-column grid on desktop! */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {hist.map((h) => (
                    <button
                      key={h.id}
                      className="hist-card"
                      onClick={() => handleHistoryItemClick(h)}
                    >
                      <div className="avatar-pro" style={{ width: "44px", height: "44px", fontSize: "15px", borderRadius: "12px" }}>
                        {h.meta.ini.replace(/\./g, "")}
                      </div>
                      <div className="t">
                        <b>{h.meta.ini}, {h.meta.age} yosh · {h.meta.goal}</b>
                        <small>
                          {h.meta.mahalla} · {new Date(h.meta.ts).toLocaleString("uz-UZ", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </small>
                      </div>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-[var(--muted)] flex-none">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  ))}
                </div>

                {/* Wipe Button */}
                <div className="pt-2 max-w-sm mx-auto">
                  <button
                    type="button"
                    className={wipeConfirm ? "btn-pro btn-danger-pro w-full text-xs" : "w-full py-2.5 px-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--crit)] hover:border-[var(--crit)] text-xs font-medium transition-colors"}
                    id="wipe"
                    onClick={handleWipeHistory}
                  >
                    {wipeConfirm ? "Aniq tozalansinmi? Tasdiqlash uchun yana bosing" : "Tarixni tozalash"}
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      {/* ================= BOTTOM TABS DOCK (Mobile only, hidden on desktop md+) ================= */}
      <nav className="tabs-dock md:hidden" role="tablist" aria-label="Bo'limlar">
        <button
          role="tab"
          id="t-form"
          aria-selected={view === "form"}
          onClick={() => goToView("form")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>Qabul</span>
        </button>

        <button
          role="tab"
          id="t-result"
          aria-selected={view === "result"}
          onClick={() => goToView("result")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 12l2 2 4-4" />
            <circle cx="12" cy="12" r="9" />
          </svg>
          <span>Tahlil</span>
        </button>

        <button
          role="tab"
          id="t-hist"
          aria-selected={view === "hist"}
          onClick={() => goToView("hist")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>Tarix</span>
        </button>
      </nav>
    </div>
  );
}
