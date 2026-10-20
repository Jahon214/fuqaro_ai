import React, { useState } from "react";
import { Sliders, MapPin, Globe, Save, CheckCircle2 } from "lucide-react";

export function SettingsTab({ config, onUpdateConfig }) {
  const [threshold, setThreshold] = useState(config?.threshold || 1000000);
  const [webAppUrl, setWebAppUrl] = useState(config?.webAppUrl || "http://localhost:5173");
  const [mfyList, setMfyList] = useState(config?.mfys || []);
  const [newMfy, setNewMfy] = useState("");
  const [savedMsg, setSavedMsg] = useState("");

  const handleAddMfy = () => {
    if (newMfy.trim() && !mfyList.includes(newMfy.trim())) {
      setMfyList([...mfyList, newMfy.trim()]);
      setNewMfy("");
    }
  };

  const handleRemoveMfy = (name) => {
    setMfyList(mfyList.filter(m => m !== name));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    await onUpdateConfig({
      threshold: Number(threshold),
      webAppUrl,
      mfys: mfyList
    });
    setSavedMsg("Sozlamalar muvaffaqiyatli saqlandi!");
    setTimeout(() => setSavedMsg(""), 3000);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="bg-surface border border-line rounded-xl p-5 md:p-6">
        <h2 className="text-xl md:text-2xl font-display font-bold text-ink mb-1">
          Tizim Sozlamalari
        </h2>
        <p className="text-xs md:text-sm text-muted mb-5">
          Tavsiya chegaralari, hududiy MFYlar va WebApp integratsiyasi parametrlari
        </p>

        <form onSubmit={handleSave} className="space-y-5">
          {/* 1. Kam ta'minlanganlik chegarasi */}
          <div className="space-y-1.5">
            <label htmlFor="cfg_thr" className="text-xs font-semibold text-ink flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-accent" />
              Kam ta'minlanganlik chegarasi (so'm, kishi boshiga)
            </label>
            <input
              id="cfg_thr"
              type="number"
              step="50000"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-accent"
            />
            <p className="text-[12px] text-muted">
              Standart qiymat: 1 000 000 so'm. Agar oilaning kishi boshiga daromadi ushbu qiymatdan past bo'lsa, Ijtimoiy reestr va imtiyozlar tavsiya qilinadi.
            </p>
          </div>

          {/* 2. WebApp URL */}
          <div className="space-y-1.5">
            <label htmlFor="cfg_url" className="text-xs font-semibold text-ink flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-accent" />
              Telegram WebApp (Mini App) URL manzili
            </label>
            <input
              id="cfg_url"
              type="text"
              value={webAppUrl}
              onChange={(e) => setWebAppUrl(e.target.value)}
              className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-accent"
              placeholder="https://remarkable-sunburst-3f3466.netlify.app"
            />
            <p className="text-[12px] text-muted">
              Telegram boti ichida "So'rovnoma to'ldirish" tugmasi bosilganda ochiladigan veb-havola.
            </p>
          </div>

          {/* 3. MFYlar ro'yxati */}
          <div className="space-y-2 pt-2 border-t border-line">
            <label className="text-xs font-semibold text-ink flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-accent" />
              Mahallalar (MFY) ro'yxati
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newMfy}
                onChange={(e) => setNewMfy(e.target.value)}
                placeholder="Yangi MFY nomi..."
                className="flex-1 bg-bg border border-line rounded-lg px-3 py-1.5 text-xs text-ink focus:outline-accent"
              />
              <button
                type="button"
                onClick={handleAddMfy}
                className="px-3 py-1.5 rounded-lg bg-accent text-accent-ink text-xs font-semibold cursor-pointer"
              >
                Qo'shish
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {mfyList.map((m) => (
                <span
                  key={m}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-bg border border-line text-xs text-ink font-medium"
                >
                  {m}
                  <button
                    type="button"
                    onClick={() => handleRemoveMfy(m)}
                    className="text-muted hover:text-crit text-xs ml-1 cursor-pointer font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {savedMsg && (
            <div className="p-3 bg-ok-bg text-ok border border-ok/20 rounded-lg text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {savedMsg}
            </div>
          )}

          <div className="pt-3">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-accent-ink font-semibold text-sm hover:opacity-95 cursor-pointer shadow-sm"
            >
              <Save className="w-4 h-4" />
              Saqlash
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
