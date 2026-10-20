import { Bot, InlineKeyboard, InputFile } from "grammy";
import { db } from "../db.js";
import { TYPES, REJECT_REASONS, fmt, PRIORITY_LABELS } from "../engine.js";

export function createAdminBot(token) {
  if (!token) return null;

  const bot = new Bot(token);

  // Helper to ensure https URL for Telegram buttons
  const getPublicUrl = () => {
    const url = db.cfg.webAppUrl || process.env.WEBAPP_URL || "";
    if (url && url.startsWith("https://")) return url;
    return "https://remarkable-sunburst-3f3466.netlify.app";
  };

  // Helper to ensure admin chat ID is saved
  const ensureAdmin = (chatId) => {
    const list = db.cfg.adminChatIds || [];
    if (!list.includes(chatId)) {
      list.push(chatId);
      db.saveConfig({ adminChatIds: list });
    }
  };

  // /start command
  bot.command("start", async (ctx) => {
    const chatId = ctx.chat.id;
    ensureAdmin(chatId);

    const welcome = `👋 <b>Assalomu alaykum, Xovos tumani MFY Mas'ul Xodimi!</b>\n\n` +
      `Siz <b>Xovos Fuqaro AI</b> tizimi admin botiga muvaffaqiyatli ulandingiz.\n` +
      `Sizning Telegram ID: <code>${chatId}</code>\n\n` +
      `📥 Endi har bir yangi fuqaro so'rovnomasi to'ldirilganda, barcha ma'lumotlar va AI tavsiyalari shu yerga kelib tushadi.\n\n` +
      `<b>Mavjud buyruqlar:</b>\n` +
      `• /stats — Umumiy statistika va qabullar tahlili\n` +
      `• /cases — Oxirgi qabullar ro'yxati\n` +
      `• /export — Qabullar jurnalini CSV formatida yuklab olish\n` +
      `• /help — Botdan foydalanish bo'yicha yo'riqnoma`;

    await ctx.reply(welcome, { parse_mode: "HTML" });
  });

  // /stats command
  bot.command("stats", async (ctx) => {
    const stats = db.getStats();

    let text = `📊 <b>Xovos Fuqaro AI — Tahliliy hisobot</b>\n\n` +
      `📌 <b>Jami qabullar soni:</b> ${stats.total} ta\n` +
      `📈 <b>Qabulga o'rtacha tavsiya:</b> ${stats.avgRecs} ta\n` +
      `✅ <b>Xodim tasdiqlagan tavsiyalar:</b> ${stats.acceptanceRate}%\n` +
      `🧪 <b>Namuna qabullar:</b> ${stats.exampleCount} ta\n\n` +
      `<b>📋 Murojaat turlari bo'yicha:</b>\n`;

    stats.byType.slice(0, 5).forEach((t, i) => {
      text += `${i + 1}. ${t.name}: <b>${t.count} ta</b>\n`;
    });

    text += `\n<b>📍 Eng ko'p qabulli MFYlar:</b>\n`;
    stats.fairness.byMfy.slice(0, 4).forEach((m, i) => {
      text += `• ${m.group}: <b>${m.count} ta</b> (${m.approvalRate != null ? m.approvalRate + "% tasdiqlangan" : "—"})\n`;
    });

    await ctx.reply(text, { parse_mode: "HTML" });
  });

  // /cases command
  bot.command("cases", async (ctx) => {
    const cases = db.getAllCases().slice(0, 5);

    if (cases.length === 0) {
      return ctx.reply("Hali hech qanday qabul mavjud emas.");
    }

    let text = `📑 <b>Oxirgi 5 ta qabul:</b>\n\n`;
    cases.forEach((c, idx) => {
      const date = new Date(c.ts).toLocaleDateString("uz-UZ");
      const decs = Object.values(c.decisions || {});
      const okCount = decs.filter(d => d.d === "ok").length;
      const status = decs.length > 0
        ? (okCount > 0 ? `✅ ${okCount}/${decs.length} tasdiqlandi` : "❌ Rad etilgan")
        : "⏳ Ko'rib chiqilmagan";

      text += `<b>${idx + 1}. #${c.id}</b> — ${c.name || c.ini} (${c.age} yosh)\n`;
      text += `📍 MFY: ${c.mfy} | Murojaat: ${TYPES[c.type] || c.type}\n`;
      text += `📅 Sana: ${date} | Holat: ${status}\n\n`;
    });

    text += `<i>Batafsil boshqarish uchun veb-dashboarddan foydalaning.</i>`;

    await ctx.reply(text, { parse_mode: "HTML" });
  });

  // /export command: sends CSV file
  bot.command("export", async (ctx) => {
    try {
      const cases = db.getAllCases();
      const rows = [["raqam", "sana", "fuqaro_ism", "yosh", "jins", "mfy", "murojaat", "daromad", "tavsiyalar_soni", "tasdiqlangan"]];

      cases.forEach(c => {
        const ds = Object.values(c.decisions || {});
        rows.push([
          c.id,
          new Date(c.ts).toISOString().slice(0, 10),
          c.name || c.ini,
          c.age,
          c.gender || "",
          c.mfy,
          TYPES[c.type] || c.type,
          c.income || 0,
          (c.recs || []).length,
          ds.filter(d => d.d === "ok").length
        ]);
      });

      const csvContent = rows
        .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
        .join("\n");

      const buffer = Buffer.from("\uFEFF" + csvContent, "utf-8"); // UTF-8 BOM for Excel
      const inputFile = new InputFile(buffer, `fuqaro_ai_qabullar_${Date.now()}.csv`);

      await ctx.replyWithDocument(inputFile, {
        caption: `📄 <b>Xovos Fuqaro AI Qabullar jurnali</b>\nJami: ${cases.length} ta yozuv`,
        parse_mode: "HTML"
      });
    } catch (e) {
      console.error("Export error in admin bot:", e);
      await ctx.reply("CSV faylni eksport qilishda xatolik yuz berdi.");
    }
  });

  // /help command
  bot.command("help", async (ctx) => {
    const text = `📖 <b>Admin Bot qo'llanmasi</b>\n\n` +
      `Ushbu bot mahalla yettiligi va MFY mas'ullari uchun mo'ljallangan.\n\n` +
      `<b>Funksiyalar:</b>\n` +
      `1. <b>Real vaqt xabarnomalari:</b> Sayt yoki fuqarolar boti orqali ariza topshirilganda, barcha tavsiyalar bilan birga botga xabar keladi.\n` +
      `2. <b>Bir tugma bilan qaror qabul qilish:</b> «✅ Tasdiqlash» yoki «❌ Rad etish» orqali to'g'ridan-to'g'ri Telegramdan qaror qabul qilasiz.\n` +
      `3. <b>Hisobotlar:</b> /stats va /export buyruqlari orqali xolislik va tavsiyalar statistikasi hamda CSV ro'yxatini yuklab olasiz.`;

    await ctx.reply(text, { parse_mode: "HTML" });
  });

  // Callback query handlers
  bot.on("callback_query:data", async (ctx) => {
    const data = ctx.callbackQuery.data;
    await ctx.answerCallbackQuery();

    // 1. Approve all recommendations: adm_ok_<caseId>
    if (data.startsWith("adm_ok_")) {
      const caseId = data.replace("adm_ok_", "");
      const c = db.getCaseById(caseId);
      if (!c) {
        return ctx.reply("Qabul topilmadi.");
      }

      const decisions = {};
      (c.recs || []).forEach(r => {
        decisions[r.id] = { d: "ok", reason: "" };
      });
      db.updateCaseDecisions(caseId, decisions);

      const adminName = ctx.from.first_name || "Admin";
      const updatedText = ctx.callbackQuery.message.text + `\n\n✅ <b>Barcha tavsiyalar TASDIQLANDI</b> (Xodim: ${adminName})`;

      try {
        await ctx.editMessageText(updatedText, {
          parse_mode: "HTML",
          reply_markup: new InlineKeyboard()
            .text("👁 To'liq ko'rish", `adm_details_${caseId}`)
            .url("🌐 Web-panel", getPublicUrl())
        });
      } catch (err) {
        console.error("Error editing message:", err);
      }
      return;
    }

    // 2. Reject options: adm_no_<caseId>
    if (data.startsWith("adm_no_")) {
      const caseId = data.replace("adm_no_", "");
      const kb = new InlineKeyboard();
      REJECT_REASONS.forEach((reason, idx) => {
        kb.text(reason, `adm_rsn_${caseId}_${idx}`).row();
      });
      kb.text("⬅️ Ortga", `adm_back_${caseId}`);

      try {
        await ctx.editMessageText(
          ctx.callbackQuery.message.text + "\n\n❌ <b>Rad etish sababini tanlang:</b>",
          {
            parse_mode: "HTML",
            reply_markup: kb
          }
        );
      } catch (err) {
        console.error("Error showing reasons:", err);
      }
      return;
    }

    // 3. Confirm rejection with reason: adm_rsn_<caseId>_<reasonIdx>
    if (data.startsWith("adm_rsn_")) {
      const parts = data.replace("adm_rsn_", "").split("_");
      const caseId = parts[0];
      const reasonIdx = parseInt(parts[1], 10);
      const reason = REJECT_REASONS[reasonIdx] || "Boshqa";

      const c = db.getCaseById(caseId);
      if (!c) return ctx.reply("Qabul topilmadi.");

      const decisions = {};
      (c.recs || []).forEach(r => {
        decisions[r.id] = { d: "no", reason };
      });
      db.updateCaseDecisions(caseId, decisions);

      const adminName = ctx.from.first_name || "Admin";
      const updatedText = ctx.callbackQuery.message.text.split("\n\n❌")[0] +
        `\n\n❌ <b>RAD ETILDI</b>\nSabab: <i>${reason}</i> (Xodim: ${adminName})`;

      try {
        await ctx.editMessageText(updatedText, {
          parse_mode: "HTML",
          reply_markup: new InlineKeyboard()
            .text("👁 To'liq ko'rish", `adm_details_${caseId}`)
            .url("🌐 Web-panel", getPublicUrl())
        });
      } catch (err) {
        console.error("Error updating rejection:", err);
      }
      return;
    }

    // 4. View Details: adm_details_<caseId>
    if (data.startsWith("adm_details_")) {
      const caseId = data.replace("adm_details_", "");
      const c = db.getCaseById(caseId);
      if (!c) return ctx.reply("Qabul topilmadi.");

      let details = `📋 <b>Batafsil ma'lumot (#${c.id})</b>\n\n` +
        `👤 <b>Fuqaro:</b> ${c.name || c.ini} (${c.age} yosh, ${c.gender || "—"})\n` +
        `📍 <b>MFY:</b> ${c.mfy}\n` +
        `📌 <b>Murojaat turi:</b> ${TYPES[c.type] || c.type}\n` +
        `👨‍👩‍👦 <b>Oila tarkibi:</b> ${c.members || "—"} kishi (18 yoshgacha bolalar: ${c.children || 0})\n` +
        `💰 <b>Oylik daromad:</b> ${c.income != null ? fmt(c.income) + " so'm" : "—"} (kishi boshiga: ${c.pc != null ? fmt(c.pc) + " so'm" : "—"})\n` +
        `💼 <b>Bandlik:</b> ${c.work || "—"}\n` +
        `🎓 <b>Ta'lim:</b> ${c.edu || "—"}\n` +
        `♿️ <b>Nogironlik guruhi:</b> ${c.disab ? c.disab + "-guruh" : "Yo'q"}\n` +
        `💳 <b>Kredit/Qarz:</b> ${c.debt === "yes" ? "Bor" : "Yo'q"}\n` +
        `🏠 <b>Uy-joy holati:</b> ${c.housing || "—"}\n`;

      if (c.notes) {
        details += `💬 <b>Fuqaro so'zi bilan:</b> <i>"${c.notes}"</i>\n`;
      }

      details += `\n🎯 <b>Tavsiyalar tafsiloti:</b>\n`;
      (c.recs || []).forEach((r, idx) => {
        const pLabel = PRIORITY_LABELS[r.pri] || "O'rta";
        const dec = (c.decisions || {})[r.id];
        const status = dec ? (dec.d === "ok" ? " [✅ Tasdiqlangan]" : ` [❌ Rad etilgan: ${dec.reason}]`) : " [⏳ Kutilmoqda]";

        details += `\n<b>${idx + 1}. ${r.title}</b> (${pLabel})${status}\n`;
        details += `• <b>Sabab:</b> ${r.why.join("; ")}\n`;
        details += `• <b>Joy:</b> ${r.where}\n`;
        if (r.docs.length) details += `• <b>Hujjatlar:</b> ${r.docs.join(", ")}\n`;
        if (r.steps.length) details += `• <b>Qadamlar:</b> ${r.steps.join("; ")}\n`;
      });

      await ctx.reply(details, { parse_mode: "HTML" });
      return;
    }

    // 5. AI Advisor details: adm_ai_<caseId>
    if (data.startsWith("adm_ai_")) {
      const caseId = data.replace("adm_ai_", "");
      const c = db.getCaseById(caseId);
      if (!c) return ctx.reply("Qabul topilmadi.");

      const ai = c.aiAnalysis;
      if (!ai) {
        return ctx.reply("Ushbu qabul bo'yicha AI tahlili mavjud emas yoki yangilanmoqda.");
      }

      let aiMsg = `🤖 <b>XOVOS FUQARO AI — ADMIN MASLAHATCHISI (#${c.id})</b>\n\n` +
        `👤 <b>Fuqaro:</b> ${c.name || c.ini} (${c.age} yosh, ${c.mfy} MFY)\n` +
        `📌 <b>Murojaat turi:</b> ${TYPES[c.type] || c.type}\n\n` +
        `📊 <b>Ijtimoiy-Iqtisodiy Tahlil:</b>\n` +
        `<i>"${ai.summary}"</i>\n\n` +
        `⚠️ <b>Xavf Baholash (Risk Matrix):</b>\n` +
        `• <b>Kambag'allik xavfi:</b> ${ai.povertyRisk}\n` +
        `• <b>Qarz tangligi xavfi:</b> ${ai.debtRisk}\n` +
        `• <b>Ustuvorlik darajasi:</b> ${ai.priorityLevel}\n\n` +
        `📦 <b>Tavsiya qilinadigan davlat dasturi:</b>\n` +
        `<b>${ai.socialPackage}</b>\n\n` +
        `🎯 <b>MFY Xodimi (Hokim yordamchisi) uchun 3 ta asosiy harakat:</b>\n`;

      (ai.adminAdvice || []).forEach((adv, i) => {
        aiMsg += `<b>${i + 1}.</b> ${adv}\n`;
      });

      aiMsg += `\n⚖️ <b>Yakuniy AI tavsiyasi:</b> <b>${ai.recommendedAction}</b>\n` +
        `<i>Asos: ${ai.actionRationale}</i>\n\n` +
        `⚙️ <i>Tizim: ${ai.engine || "Xovos Fuqaro AI Smart Copilot"}</i>`;

      await ctx.reply(aiMsg, { parse_mode: "HTML" });
      return;
    }

    // 6. Back: adm_back_<caseId>
    if (data.startsWith("adm_back_")) {
      const caseId = data.replace("adm_back_", "");
      const cleanText = ctx.callbackQuery.message.text.split("\n\n❌")[0];
      const kb = new InlineKeyboard()
        .text("✅ Tasdiqlash", `adm_ok_${caseId}`)
        .text("❌ Rad etish", `adm_no_${caseId}`)
        .row()
        .text("🤖 AI Tahlil", `adm_ai_${caseId}`)
        .text("👁 To'liq", `adm_details_${caseId}`)
        .url("🌐 Web-panel", getPublicUrl());

      try {
        await ctx.editMessageText(cleanText, {
          parse_mode: "HTML",
          reply_markup: kb
        });
      } catch (e) {
        console.error(e);
      }
      return;
    }
  });

  return bot;
}

/**
 * Sends real-time notification to all registered Admin Chat IDs
 */
export async function notifyAdmins(bot, newCase) {
  if (!bot) return;

  const chatIds = new Set([
    ...(db.cfg.adminChatIds || []),
    ...(process.env.ADMIN_CHAT_ID ? [process.env.ADMIN_CHAT_ID] : [])
  ]);

  if (chatIds.size === 0) {
    console.log(`[Admin Bot] No registered admin chat IDs. Case #${newCase.id} saved in database.`);
    return;
  }

  const pcText = newCase.pc != null ? `${fmt(newCase.pc)} so'm/kishi` : "—";
  const publicUrl = (db.cfg.webAppUrl && db.cfg.webAppUrl.startsWith("https://")) 
    ? db.cfg.webAppUrl 
    : "https://remarkable-sunburst-3f3466.netlify.app";

  let msg = `🔔 <b>YANGI FUQARO QABULI! (#${newCase.id})</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 <b>Fuqaro:</b> ${newCase.name || newCase.ini} (${newCase.age} yosh, ${newCase.gender || "—"})\n` +
    `📍 <b>MFY:</b> ${newCase.mfy}\n` +
    `📌 <b>Murojaat turi:</b> ${TYPES[newCase.type] || newCase.type}\n` +
    `👨‍👩‍👦 <b>Oila:</b> ${newCase.members || "—"} kishi (bolalar: ${newCase.children || 0})\n` +
    `💰 <b>Daromad:</b> ${newCase.income != null ? fmt(newCase.income) + " so'm" : "—"} (${pcText})\n` +
    `📊 <b>Tavsiya ishonchliligi:</b> ${newCase.conf}%\n`;

  if (newCase.notes) {
    msg += `💬 <b>Fuqaro so'zi bilan:</b> <i>"${newCase.notes}"</i>\n`;
  }

  msg += `\n🎯 <b>Dastlabki AI tavsiyalari (${(newCase.recs || []).length} ta):</b>\n`;
  (newCase.recs || []).slice(0, 3).forEach((r, idx) => {
    const pEmoji = r.pri === 3 ? "🔴" : r.pri === 2 ? "🟡" : "🟢";
    msg += `${idx + 1}. ${pEmoji} <b>${r.title}</b> (${PRIORITY_LABELS[r.pri]})\n`;
  });

  // AI ADVISOR INSIGHTS FOR ADMIN
  if (newCase.aiAnalysis) {
    const ai = newCase.aiAnalysis;
    msg += `\n🤖 <b>AI MASLAHATCHI (Admin / MFY uchun):</b>\n`;
    msg += `📝 <i>"${ai.summary}"</i>\n`;
    msg += `• <b>Kambag'allik xavfi:</b> ${ai.povertyRisk} | <b>Qarz xavfi:</b> ${ai.debtRisk}\n`;
    msg += `• <b>Tavsiya etilgan paket:</b> <i>${ai.socialPackage}</i>\n`;
    msg += `\n🎯 <b>Xodim uchun 1-navbatdagi qadamlar:</b>\n`;
    (ai.adminAdvice || []).forEach((adv, i) => {
      msg += `  ${i + 1}) ${adv}\n`;
    });
    msg += `\n⚖️ <b>AI tavsiya etgan qaror:</b> <b>${ai.recommendedAction}</b> (${ai.actionRationale})\n`;
  }

  msg += `\n<i>Qaror qabul qiling:</i>`;

  const kb = new InlineKeyboard()
    .text("✅ Tasdiqlash", `adm_ok_${newCase.id}`)
    .text("❌ Rad etish", `adm_no_${newCase.id}`)
    .row()
    .text("🤖 To'liq AI Tahlil", `adm_ai_${newCase.id}`)
    .text("👁 Ma'lumot", `adm_details_${newCase.id}`)
    .row()
    .url("🌐 Web-panelda ochish", publicUrl);

  for (const chatId of chatIds) {
    try {
      await bot.api.sendMessage(chatId, msg, {
        parse_mode: "HTML",
        reply_markup: kb
      });
    } catch (e) {
      console.error(`Failed to send notification to admin ${chatId}:`, e.message);
    }
  }
}
