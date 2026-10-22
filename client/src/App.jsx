import React, { useState, useEffect, useRef } from "react";
import { MFYS, TYPES } from "./constants.js";
import { initials, runAiAnalysis } from "./services/aiService.js";
import { downloadCsv, downloadExcel, parseSections } from "./services/excelExporter.js";

const STORAGE_KEY = "fuqaroai.mobile.v1";
const THEME_KEY = "fuqaro_theme";

const ICONS = [
  // Document
  <path key="0" d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z M14 3v5h5M9 13h6M9 17h4" />,
  // Warning triangle
  <path key="1" d="M12 3l9 16H3z M12 10v4M12 17h.01" />,
  // Steps / Roadmap
  <g key="2"><circle cx="6" cy="19" r="2" /><circle cx="18" cy="5" r="2" /><path d="M8 19h6a3 3 0 000-6h-4a3 3 0 010-6h6" /></g>,
  // Alternative / Swap
  <path key="3" d="M7 7h11l-3-3M17 17H6l3 3" />
];

function getSectionIcon(i) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[i % ICONS.length]}
    </svg>
  );
}

// Markdown helper to render formatted text with strong, em, and lists
function renderMarkdownBlocks(text = "") {
  const inline = (s) => {
    return s
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>");
  };

  const lines = text.split("\n");
  const elements = [];
  let currentList = null; // { type: 'ul' | 'ol', items: [] }

  const flushList = (key) => {
    if (currentList) {
      if (currentList.type === "ul") {
        elements.push(
          <ul key={`ul-${key}`} className="list-disc pl-5 my-2 space-y-1">
            {currentList.items.map((item, idx) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: inline(item) }} />
            ))}
          </ul>
        );
      } else {
        elements.push(
          <ol key={`ol-${key}`} className="list-decimal pl-5 my-2 space-y-1">
            {currentList.items.map((item, idx) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: inline(item) }} />
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
      <p key={`p-${idx}`} className="my-1.5" dangerouslySetInnerHTML={{ __html: inline(cleanP) }} />
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
      if (!ageNum || ageNum < 16 || ageNum > 100) return "Yoshni 16 dan 100 gacha kiriting.";
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

  const stepTitles = ["Fuqaro", "Holati", "Maqsad"];

  return (
    <div className="app" id="app">
      {/* Topbar */}
      <header className="bar pad">
        <div className="logo" aria-hidden="true">F</div>
        <div>
          <h1>Fuqaro AI</h1>
          <small>Xovos tumani • MFY yettiligi</small>
        </div>
        <div className="spacer"></div>
        <button
          onClick={toggleTheme}
          title={theme === "dark" ? "Kunduzgi rejim" : "Tungi rejim"}
          aria-label="Rejimni o'zgartirish"
          className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white"
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
        <span className="test">Pilot</span>
      </header>

      {/* Main Content Area */}
      <main className="pad main-content" id="main" ref={mainRef}>
        {/* ================= SCREEN 1: QABUL ================= */}
        {view === "form" && (
          <section className="screen" id="s-form" aria-label="Yangi qabul">
            <div className="stephead">
              <h2 id="stepTitle">{stepTitles[step - 1]}</h2>
              <span id="stepNo">{step} / 3</span>
            </div>

            <div className="steps" aria-hidden="true">
              <i className={step >= 1 ? "on" : ""}></i>
              <i className={step >= 2 ? "on" : ""}></i>
              <i className={step >= 3 ? "on" : ""}></i>
            </div>

            <form id="form" className="card" onSubmit={handleNextStep} noValidate>
              {/* STEP 1: FUQARO */}
              {step === 1 && (
                <div className="fieldgrid" data-step="1">
                  <div className="f">
                    <label htmlFor="name">F.I.Sh.</label>
                    <input
                      type="text"
                      id="name"
                      autoComplete="off"
                      placeholder="Masalan: Valiyev Ali Oltiboy o'g'li"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    <span className="hint text-[12.5px] text-[var(--muted)]">
                      AI'ga to'liq ism yuborilmaydi, faqat bosh harflar.
                    </span>
                  </div>

                  <div className="row2">
                    <div className="f">
                      <label htmlFor="age">Yosh</label>
                      <input
                        type="number"
                        id="age"
                        min="16"
                        max="100"
                        inputMode="numeric"
                        placeholder="34"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      />
                    </div>

                    <div className="f">
                      <label htmlFor="mahalla">Mahalla (Hudud)</label>
                      <select
                        id="mahalla"
                        value={formData.mahalla}
                        onChange={(e) => setFormData({ ...formData, mahalla: e.target.value })}
                      >
                        <option value="">Tanlang</option>
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
                  <fieldset>
                    <legend>Ijtimoiy holati</legend>
                    <div className="chips">
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

                  <fieldset>
                    <legend>Bandlik holati</legend>
                    <div className="chips">
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

                  <fieldset>
                    <legend>Jismoniy holati</legend>
                    <div className="chips">
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
                  <div className="f">
                    <label htmlFor="goal">Murojaat masalasi (sohasi)</label>
                    <select
                      id="goal"
                      value={formData.goal}
                      onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                    >
                      <option value="">Tanlang</option>
                      {Object.entries(TYPES).map(([k, v]) => (
                        <option key={k} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>

                  <div className="f">
                    <label htmlFor="skills">Qabiliyat va qiziqishlari</label>
                    <textarea
                      id="skills"
                      placeholder="Masalan: qandolatchilik, IT, tikuvchilik, chorvachilik bo'yicha tajribasi bor"
                      value={formData.skills}
                      onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    ></textarea>
                  </div>

                  <label className="check">
                    <input
                      type="checkbox"
                      id="consent"
                      checked={formData.consent}
                      onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                    />
                    <span>Fuqaro ma'lumotlarini tavsiya olish uchun qayta ishlashga rozilik berdi.</span>
                  </label>
                </div>
              )}

              {/* Error Alert */}
              {formError && (
                <div className="err" id="err" role="alert" style={{ marginTop: "12px" }}>
                  {formError}
                </div>
              )}

              {/* Wizard Buttons */}
              <div className="btnrow" style={{ marginTop: "4px" }}>
                {step > 1 && (
                  <button type="button" className="btn ghost" id="prev" onClick={handlePrevStep}>
                    Orqaga
                  </button>
                )}
                <button type="submit" className="btn" id="next">
                  {step === 3 ? "AI tahlil qilish" : "Keyingi"}
                </button>
              </div>
            </form>

            <button
              type="button"
              className="btn ghost small"
              id="demo"
              style={{ alignSelf: "flex-start" }}
              onClick={handleFillDemo}
            >
              Namuna bilan to'ldirish
            </button>
          </section>
        )}

        {/* ================= SCREEN 2: TAHLIL ================= */}
        {view === "result" && (
          <section className="screen" id="s-result" aria-label="Tahlil">
            {!cur ? (
              <div className="empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 12l2 2 4-4" />
                  <circle cx="12" cy="12" r="9" />
                </svg>
                <p>
                  Hali tahlil yo'q.<br />
                  «Qabul» bo'limida fuqaro ma'lumotini kiriting.
                </p>
              </div>
            ) : (
              <>
                {/* Meta Card */}
                <div className="card">
                  <div className="who">
                    <div className="avatar">{cur.meta.ini.replace(/\./g, "")}</div>
                    <div>
                      <h2 style={{ fontSize: "18px" }}>{cur.meta.ini}, {cur.meta.age} yosh</h2>
                      <p style={{ color: "var(--muted)", fontSize: "13.5px" }}>{cur.meta.mahalla}</p>
                    </div>
                  </div>
                  <div className="meta">
                    <span>{cur.meta.goal}</span>
                    <span>{cur.meta.work}</span>
                    <span>{cur.meta.phys}</span>
                    <span>{cur.meta.social}</span>
                  </div>
                </div>

                {/* State: Loading */}
                {cur.state === "loading" && (
                  <>
                    <div className="card" aria-live="polite">
                      <p style={{ fontWeight: 600, marginBottom: "12px" }}>AI tahlil qilmoqda…</p>
                      <div className="skel" style={{ width: "90%" }}></div>
                      <div className="skel" style={{ width: "75%" }}></div>
                      <div className="skel" style={{ width: "85%" }}></div>
                      <div className="skel" style={{ width: "60%" }}></div>
                    </div>
                    <button className="btn ghost" id="cancel" onClick={handleCancelAnalysis}>
                      Bekor qilish
                    </button>
                  </>
                )}

                {/* State: Error */}
                {cur.state === "error" && (
                  <>
                    <div className="card" role="alert">
                      <p style={{ color: "var(--crit)", fontWeight: 600 }}>{cur.error}</p>
                    </div>
                    <div className="btnrow">
                      <button className="btn" id="retry" onClick={handleRetry}>
                        Qayta urinish
                      </button>
                      <button className="btn ghost" id="edit" onClick={() => goToView("form")}>
                        Ma'lumotni o'zgartirish
                      </button>
                    </div>
                  </>
                )}

                {/* State: Done */}
                {cur.state === "done" && (
                  <>
                    {parseSections(cur.text).map((s, i) => (
                      <article key={i} className="card sec">
                        <div className="head">
                          <span className="ic">{getSectionIcon(i)}</span>
                          <h3>{s.title}</h3>
                        </div>
                        <div className="body">
                          {renderMarkdownBlocks(s.body)}
                        </div>
                      </article>
                    ))}

                    <p className="note">
                      AI tavsiyasi yordamchi vosita. Dastur shartlari va hujjatlar rasmiy manbada tekshirilsin, qaror MFY xodimida qoladi.
                    </p>

                    <div className="btnrow">
                      <button className="btn" id="copy" onClick={handleCopyResult}>
                        {copySuccess ? "✓ Nusxa olindi" : "Nusxa olish"}
                      </button>
                      <button className="btn ghost" id="again" onClick={handleStartNew}>
                        Yangi qabul
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </section>
        )}

        {/* ================= SCREEN 3: TARIX ================= */}
        {view === "hist" && (
          <section className="screen" id="s-hist" aria-label="Tarix">
            {hist.length === 0 ? (
              <div className="empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
                <p>
                  Tarix bo'sh.<br />
                  Tahlil tugagach, shu yerda saqlanadi.
                </p>
              </div>
            ) : (
              <>
                <p className="note" style={{ background: "var(--soft)", color: "var(--ink)" }}>
                  Tarix faqat shu qurilmada, bosh harflar bilan saqlanadi ({hist.length} ta yozuv).
                </p>

                {/* Excel & CSV Export buttons */}
                <div className="flex gap-2 mb-1">
                  <button
                    onClick={() => downloadExcel(hist)}
                    className="flex-1 py-2 px-3 text-xs font-bold rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--accent)] flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                  >
                    <span>📥 Excel (.xls)</span>
                  </button>
                  <button
                    onClick={() => downloadCsv(hist)}
                    className="flex-1 py-2 px-3 text-xs font-bold rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--accent)] flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                  >
                    <span>📄 CSV yuklab olish</span>
                  </button>
                </div>

                {/* History Items List */}
                <div className="space-y-2">
                  {hist.map((h) => (
                    <button
                      key={h.id}
                      className="hist"
                      onClick={() => handleHistoryItemClick(h)}
                    >
                      <div className="avatar">{h.meta.ini.replace(/\./g, "")}</div>
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
                    </button>
                  ))}
                </div>

                {/* Wipe History Button */}
                <button
                  type="button"
                  className={wipeConfirm ? "btn danger small" : "btn ghost small"}
                  id="wipe"
                  style={{ alignSelf: "flex-start", marginTop: "8px" }}
                  onClick={handleWipeHistory}
                >
                  {wipeConfirm ? "Aniq tozalansinmi? Yana bosing" : "Tarixni tozalash"}
                </button>
              </>
            )}
          </section>
        )}
      </main>

      {/* ================= BOTTOM TABS ================= */}
      <nav className="tabs" role="tablist" aria-label="Bo'limlar">
        <button
          role="tab"
          id="t-form"
          aria-selected={view === "form"}
          onClick={() => goToView("form")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Qabul
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
          Tahlil
        </button>

        <button
          role="tab"
          id="t-hist"
          aria-selected={view === "hist"}
          onClick={() => goToView("hist")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
          Tarix
        </button>
      </nav>
    </div>
  );
}
