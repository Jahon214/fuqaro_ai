import React, { useState } from "react";
import { Bot, CheckCircle2, AlertCircle, Send, Copy, ExternalLink, ShieldCheck, Users, Smartphone, Terminal } from "lucide-react";

export function TelegramTab({ botStatus, onRefreshStatus }) {
  const [testingNotification, setTestingNotification] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  const citizenConnected = botStatus?.citizenBot?.connected;
  const adminConnected = botStatus?.adminBot?.connected;

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSendTestNotify = async () => {
    setTestingNotification(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/bots/test-notify", { method: "POST" });
      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setTestingNotification(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-surface border border-line rounded-xl p-5 md:p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent grid place-items-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-display font-bold text-ink">
              Telegram Botlar Boshqaruvi
            </h2>
            <p className="text-xs md:text-sm text-muted">
              Loyiha uchun 2 ta Telegram bot integratsiyasi (Fuqarolar uchun va Admin uchun)
            </p>
          </div>
        </div>
      </div>

      {/* 2 Bots Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. FUQARO BOTI */}
        <div className="bg-surface border border-line rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-accent" />
                <h3 className="font-display font-bold text-lg text-ink">1. Fuqarolar Boti</h3>
              </div>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1 ${
                  citizenConnected
                    ? "bg-ok-bg text-ok border border-ok/30"
                    : "bg-warn-bg text-warn border border-warn/30"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${citizenConnected ? "bg-ok" : "bg-warn"}`} />
                {citizenConnected ? "Ulangan" : "Standby / Token kutilmoqda"}
              </span>
            </div>

            <p className="text-xs text-muted leading-relaxed mb-4">
              Hamma fuqarolar uchun mo'ljallangan bot. Fuqarolar Telegram orqali kirib saytni <b>Telegram Mini App (WebApp)</b> ko'rinishida ochishadi yoki to'g'ridan-to'g'ri bot ichida suhbatlashib so'rovnomani to'ldirishadi.
            </p>

            <div className="bg-bg rounded-lg p-3 text-xs space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-muted">Foydalanuvchi nomi:</span>
                <span className="font-mono font-semibold text-ink">
                  {botStatus?.citizenBot?.username ? `@${botStatus.citizenBot.username}` : "Kiritilmagan"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Mini App rejimi:</span>
                <span className="text-ok font-semibold">Faol (Vite WebApp)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Chat orqali to'ldirish:</span>
                <span className="text-ok font-semibold">13 ta qadamli interaktiv</span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            {citizenConnected && botStatus?.citizenBot?.username ? (
              <a
                href={`https://t.me/${botStatus.citizenBot.username}`}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-ink font-semibold text-xs hover:opacity-95 cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                Botni Telegramda ochish
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <p className="text-[11px] text-muted italic text-center">
                .env faylida <code>CITIZEN_BOT_TOKEN</code> kiritilgach faollashadi.
              </p>
            )}
          </div>
        </div>

        {/* 2. ADMIN BOTI */}
        <div className="bg-surface border border-line rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-accent" />
                <h3 className="font-display font-bold text-lg text-ink">2. Admin / MFY Boti</h3>
              </div>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1 ${
                  adminConnected
                    ? "bg-ok-bg text-ok border border-ok/30"
                    : "bg-warn-bg text-warn border border-warn/30"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${adminConnected ? "bg-ok" : "bg-warn"}`} />
                {adminConnected ? "Ulangan" : "Standby / Token kutilmoqda"}
              </span>
            </div>

            <p className="text-xs text-muted leading-relaxed mb-4">
              MFY mas'ul xodimi va adminlar uchun bot. Fuqarolar sayt yoki Fuqaro boti orqali so'rovnoma to'ldirganda, <b>barcha ma'lumotlar va AI tavsiyalari shu adminga real vaqtda kelib tushadi</b>. Admin bitta tugma bilan tasdiqlaydi yoki rad etadi.
            </p>

            <div className="bg-bg rounded-lg p-3 text-xs space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-muted">Foydalanuvchi nomi:</span>
                <span className="font-mono font-semibold text-ink">
                  {botStatus?.adminBot?.username ? `@${botStatus.adminBot.username}` : "Kiritilmagan"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Ulangan Adminlar soni:</span>
                <span className="font-semibold text-ink">{botStatus?.adminChatCount || 0} ta chat</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Qaror qabul qilish:</span>
                <span className="text-ok font-semibold">Inline tugmalar orqali</span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={handleSendTestNotify}
              disabled={testingNotification}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-surface border border-accent text-accent font-semibold text-xs hover:bg-accent/5 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {testingNotification ? "Yuborilmoqda..." : "🔔 Sinov xabarnomasini yuborish"}
            </button>

            {testResult && (
              <p className={`text-[11px] text-center font-medium ${testResult.success ? "text-ok" : "text-warn"}`}>
                {testResult.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Step-by-Step Setup Guide */}
      <div className="bg-surface border border-line rounded-xl p-5 md:p-6">
        <div className="flex items-center gap-2 mb-3">
          <Terminal className="w-5 h-5 text-accent" />
          <h3 className="font-display font-bold text-lg text-ink">
            Botlarni ulash bo'yicha qadam-baqadam yo'riqnoma
          </h3>
        </div>

        <div className="space-y-4 text-xs md:text-sm text-ink/90 leading-relaxed">
          {/* Step 1 */}
          <div className="border border-line rounded-lg p-4 bg-bg">
            <div className="font-bold text-ink mb-1 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-accent text-accent-ink text-xs grid place-items-center">1</span>
              Telegramda @BotFather orqali 2 ta bot oching:
            </div>
            <p className="text-muted text-xs pl-7">
              Telegramda <b>@BotFather</b> ni oching va <code>/newbot</code> buyrug'ini 2 marta bajaring:
              <br />• 1-bot: <b>Xovos Fuqaro Boti</b> (masalan: <code>@xovosfuqaro_aibot</code>)
              <br />• 2-bot: <b>Admin Boti</b> (masalan: <code>@fuqaro_adminbot</code>)
            </p>
          </div>

          {/* Step 2 */}
          <div className="border border-line rounded-lg p-4 bg-bg">
            <div className="font-bold text-ink mb-1 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-accent text-accent-ink text-xs grid place-items-center">2</span>
              Tokenlarni <code>.env</code> fayliga kiriting:
            </div>
            <p className="text-muted text-xs pl-7 mb-2">
              Loyihaning asosiy papkasidagi <code>.env</code> faylini oching va bot tokenlarini yozing:
            </p>
            <div className="pl-7">
              <pre className="bg-surface p-3 rounded-md font-mono text-[11px] border border-line overflow-x-auto text-ink relative">
                <code>{`CITIZEN_BOT_TOKEN=123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ\nADMIN_BOT_TOKEN=987654321:ZYXwvuTsrQPOnmlKJIhgfeDCBA\nADMIN_CHAT_ID=12345678\nWEBAPP_URL=http://localhost:5173`}</code>
                <button
                  onClick={() => handleCopy(`CITIZEN_BOT_TOKEN=\nADMIN_BOT_TOKEN=\nADMIN_CHAT_ID=`, "env")}
                  className="absolute right-2 top-2 p-1 rounded bg-bg text-muted hover:text-ink cursor-pointer"
                  title="Nusxa olish"
                >
                  {copiedKey === "env" ? <CheckCircle2 className="w-3.5 h-3.5 text-ok" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </pre>
            </div>
          </div>

          {/* Step 3 */}
          <div className="border border-line rounded-lg p-4 bg-bg">
            <div className="font-bold text-ink mb-1 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-accent text-accent-ink text-xs grid place-items-center">3</span>
              Admin botni faollashtirish:
            </div>
            <p className="text-muted text-xs pl-7">
              Telegramda Admin botingizga kiring va <b>/start</b> tugmasini bosing. Bot sizning Chat ID'ingizni avtomatik tarzda tizimga saqlab oladi va barcha so'rovnomalarni sizga yo'naltirishni boshlaydi!
            </p>
          </div>

          {/* Step 4 */}
          <div className="border border-line rounded-lg p-4 bg-bg">
            <div className="font-bold text-ink mb-1 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-accent text-accent-ink text-xs grid place-items-center">4</span>
              Fuqarolar boti uchun Telegram Menu Button (Mini App) o'rnatish:
            </div>
            <p className="text-muted text-xs pl-7">
              @BotFather ga <code>/setmenubutton</code> buyrug'ini yuboring, Fuqaro botingizni tanlang va sayt havolangizni (masalan Netlify yoki ngrok havolangizni) kiriting. Endi fuqarolar botni ochganda to'g'ridan-to'g'ri ekranning pastida «So'rovnoma» tugmasi chiqadi!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
