import { TYPES, fmt } from "../constants.js";

const ADMIN_BOT_TOKEN = "8816434488:AAHnsPRhLZ7CBj3nAjIYQOonasYkoufeKMc";
const ADMIN_CHAT_ID = "2060481412";
const getAppUrl = () => {
  if (typeof window !== "undefined" && window.location?.origin && window.location.origin.startsWith("http")) {
    return window.location.origin;
  }
  return "https://fuqaroxovosai.vercel.app";
};

/**
 * Sends real-time notification with full AI analysis directly to Admin Telegram Bot.
 * Works 100% reliably from Vercel, Telegram Mini App, mobile or desktop.
 */
export async function sendCaseToAdminBot(caseData, aiAnalysis) {
  const p = caseData.p || caseData;
  const ai = aiAnalysis || caseData.aiAnalysis;
  const caseId = caseData.id || "Q-" + Math.floor(1000 + Math.random() * 9000);

  const WORK_LABELS = {
    jobless: "Ishsiz",
    employed: "Ishlaydi",
    self: "O'zini o'zi band qilgan",
    student: "Talaba / o'quvchi",
    home: "Uy bekasi",
    retired: "Pensioner"
  };

  const HOUSING_LABELS = {
    own: "O'z uyi, qoniqarli",
    bad: "O'z uyi, yomon sharoitda",
    rent: "Ijarada",
    none: "Uy-joyi yo'q"
  };

  const pc = p.income != null && p.members ? Math.round(p.income / p.members) : null;
  const pcText = pc != null ? `${fmt(pc)} so'm/kishi` : "—";
  const typeLabel = TYPES[p.type] || p.type || "Ko'rsatilmagan";
  const workLabel = WORK_LABELS[p.work] || p.work || "Ko'rsatilmagan";
  const housingLabel = HOUSING_LABELS[p.housing] || p.housing || "Ko'rsatilmagan";

  let msg = `🔔 <b>YANGI FUQARO SO'ROVNOMASI! (#${caseId})</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 <b>Fuqaro:</b> ${p.name || p.ini || "Noma'lum"} (${p.age || "—"} yosh, ${p.gender || "—"})\n` +
    `📍 <b>MFY:</b> ${p.mfy || "Xovosobod"}\n` +
    `📌 <b>Murojaat turi:</b> ${typeLabel}\n` +
    `👨‍👩‍👦 <b>Oila:</b> ${p.members || 1} kishi (18 yoshgacha bolalar: ${p.children || 0})\n` +
    `💰 <b>Daromad:</b> ${p.income != null ? fmt(p.income) + " so'm" : "—"} (${pcText})\n` +
    `💼 <b>Bandlik:</b> ${workLabel}\n` +
    `🏠 <b>Uy-joy:</b> ${housingLabel}\n` +
    `💳 <b>Qarzdorlik:</b> ${p.debt === "yes" ? "Bor" : "Yo'q"}\n`;

  if (p.notes) {
    msg += `📝 <b>Fuqaro so'zi:</b> <i>"${p.notes}"</i>\n`;
  }

  if (ai) {
    msg += `\n━━━━━━━━━━━━━━━━━━━━\n` +
      `🤖 <b>XOVOS FUQARO AI MASLAHATCHISI:</b>\n` +
      `• <b>Kambag'allik xavfi:</b> ${ai.povertyRisk || "—"}\n` +
      `• <b>Qarz tangligi:</b> ${ai.debtRisk || "—"}\n` +
      `• <b>Ustuvorlik darajasi:</b> ${ai.priorityLevel || "—"}\n` +
      `• <b>Tavsiya paketi:</b> <b>${ai.socialPackage || "Davlat ijtimoiy dasturi"}</b>\n\n` +
      `🎯 <b>MFY xodimi (Hokim yordamchisi) uchun 3 ta qadam:</b>\n`;

    (ai.adminAdvice || []).forEach((adv, i) => {
      msg += `<b>${i + 1}.</b> ${adv}\n`;
    });

    msg += `\n⚖️ <b>Yakuniy AI tavsiyasi:</b> <b>${ai.recommendedAction || "Tasdiqlash"}</b>\n` +
      `<i>Asos: ${ai.actionRationale || "Mezonlarga mos"}</i>\n`;
  }

  const payload = {
    chat_id: ADMIN_CHAT_ID,
    parse_mode: "HTML",
    text: msg,
    reply_markup: {
      inline_keyboard: [
        [
          { text: "🌐 Web-panelda ochish", url: getAppUrl() }
        ]
      ]
    }
  };

  try {
    const res = await fetch(`https://api.telegram.org/bot${ADMIN_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    return result;
  } catch (err) {
    console.error("[telegramNotifier] Failed to send notification to Telegram:", err);
    return { ok: false, error: err.message };
  }
}
