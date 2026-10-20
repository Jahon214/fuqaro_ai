import { Bot, InlineKeyboard, Keyboard } from "grammy";
import { db } from "../db.js";
import { evaluate, TYPES, MFYS, fmt, initials } from "../engine.js";

// Active user questionnaire sessions: userId -> session object
const sessions = new Map();

export function createCitizenBot(token, adminNotifier = null) {
  if (!token) return null;

  const bot = new Bot(token);

  // Helper to get webapp URL (Telegram requires https://)
  const getWebAppUrl = () => {
    const url = db.cfg.webAppUrl || process.env.WEBAPP_URL || "";
    if (url && url.startsWith("https://")) return url;
    return "https://xovos-fuqaroai-psi.vercel.app";
  };

  // Main menu keyboard
  const getMainMenu = () => {
    const webAppUrl = getWebAppUrl();
    const kb = new Keyboard();
    if (webAppUrl && webAppUrl.startsWith("https://")) {
      kb.webApp("📋 So'rovnoma to'ldirish (Mini App)", webAppUrl).row();
    }
    return kb
      .text("💬 Bot ichida to'ldirish")
      .text("📜 Mening arizalarim")
      .row()
      .text("ℹ️ Loyiha haqida")
      .resized();
  };

  // /start command
  bot.command("start", async (ctx) => {
    const name = ctx.from?.first_name || "Fuqaro";
    const webAppUrl = getWebAppUrl();
    const welcome = `Assalomu alaykum, <b>${name}</b>!\n\n` +
      `🏛 <b>Xovos Fuqaro AI</b> — Xovos tumani MFY va davlat xizmatlari bo'yicha ko'makchi platformasiga xush kelibsiz.\n\n` +
      `Ushbu bot orqali siz:\n` +
      `• Bandlik va ish o'rinlari\n` +
      `• Ijtimoiy daftarlar va moddiy yordam\n` +
      `• Imtiyozli kreditlar va subsidiya\n` +
      `• Kasb-hunar o'rganish kurslari\n` +
      `• Nogironlik va tibbiy ko'rik\n\n` +
      `bo'yicha o'zingizga mos dasturlar va aniq yo'riqnomalarni olishingiz mumkin.\n\n` +
      `Quyidagi tugma orqali yangi Vercel tizimida so'rovnomani to'ldiring:`;

    const inlineKb = new InlineKeyboard()
      .webApp("🚀 So'rovnoma to'ldirish (Mini App)", webAppUrl)
      .row()
      .url("🌐 Vercel havolasini ochish", webAppUrl);

    await ctx.reply(welcome, {
      parse_mode: "HTML",
      reply_markup: inlineKb
    });

    await ctx.reply("Yoki quyidagi menyu tugmalaridan foydalaning:", {
      reply_markup: getMainMenu()
    });
  });

  // Project Info
  bot.hears("ℹ️ Loyiha haqida", async (ctx) => {
    const text = `🏛 <b>Xovos Fuqaro AI tizimi haqida</b>\n\n` +
      `Ushbu platforma Xovos tumani fuqarolariga davlat yordam dasturlari, kasbiy ta'lim, imtiyozli kreditlar va ijtimoiy xizmatlarni xolis hamda tezkorlik bilan tavsiya qilish uchun ishlab chiqilgan.\n\n` +
      `🔹 <b>Xolislik:</b> Tavsiyalar qat'iy va shaffof ijtimoiy mezonlar asosida beriladi.\n` +
      `🔹 <b>To'g'ridan-to'g'ri MFY nazorati:</b> Har bir so'rovnoma MFY xodimlariga kelib tushadi va tasdiqlanadi.\n` +
      `🔹 <b>Xavfsizlik:</b> Shaxsiy ma'lumotlar faqatgina yordam ko'rsatish maqsadida ishlatiladi.`;

    await ctx.reply(text, { parse_mode: "HTML" });
  });

  // My Submissions
  bot.hears("📜 Mening arizalarim", async (ctx) => {
    const userId = ctx.from?.id;
    const cases = db.getAllCases().filter(c => c.telegramUserId === userId);

    if (cases.length === 0) {
      await ctx.reply(
        "Siz hali biron marta so'rovnoma to'ldirmagansiz.\n" +
        "«📋 So'rovnoma to'ldirish (Mini App)» yoki «💬 Bot ichida to'ldirish» tugmasini bosing.",
        { reply_markup: getMainMenu() }
      );
      return;
    }

    let msg = `📜 <b>Sizning arizalaringiz (${cases.length} ta):</b>\n\n`;
    cases.slice(0, 5).forEach((c, idx) => {
      const date = new Date(c.ts).toLocaleDateString("uz-UZ");
      const decs = Object.values(c.decisions || {});
      const okCount = decs.filter(d => d.d === "ok").length;
      const statusText = okCount > 0 ? `✅ ${okCount} ta tavsiya tasdiqlangan` : "⏳ Ko'rib chiqilmoqda";

      msg += `<b>${idx + 1}. Ariza #${c.id}</b> (${date})\n`;
      msg += `• Murojaat: ${TYPES[c.type] || c.type}\n`;
      msg += `• Holat: ${statusText}\n`;
      if (c.recs && c.recs[0]) {
        msg += `• Asosiy tavsiya: <i>${c.recs[0].title}</i>\n`;
      }
      msg += `\n`;
    });

    await ctx.reply(msg, { parse_mode: "HTML" });
  });

  // Handle Telegram WebApp submitted data
  bot.on("message:web_app_data", async (ctx) => {
    try {
      const dataStr = ctx.message.web_app_data.data;
      const payload = JSON.parse(dataStr);
      const user = ctx.from;

      const p = {
        name: payload.name || `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Noma'lum fuqaro",
        age: Number(payload.age) || null,
        gender: payload.gender || "",
        mfy: payload.mfy || "Xovosobod",
        type: payload.type || "ish",
        members: Number(payload.members) || null,
        children: Number(payload.children) || 0,
        income: Number(payload.income) || null,
        housing: payload.housing || "",
        work: payload.work || "",
        edu: payload.edu || "",
        disab: payload.disab != null && payload.disab !== "" ? Number(payload.disab) : null,
        debt: payload.debt || "",
        notes: payload.notes || "",
        consent: true
      };

      const out = evaluate(p, db.cfg);
      const caseId = "Q-" + String(Date.now()).slice(-6);

      const newCase = {
        id: caseId,
        ts: Date.now(),
        ini: initials(p.name),
        name: p.name,
        age: p.age,
        gender: p.gender,
        mfy: p.mfy,
        type: p.type,
        members: p.members,
        children: p.children,
        income: p.income,
        housing: p.housing,
        work: p.work,
        edu: p.edu,
        disab: p.disab,
        debt: p.debt,
        notes: p.notes,
        pc: out.pc,
        conf: out.conf,
        poor: out.poor,
        missing: out.missing,
        recs: out.recs,
        decisions: {},
        example: false,
        source: "webapp",
        telegramUserId: user.id,
        telegramUsername: user.username || null
      };

      db.addCase(newCase);

      // Reply to Citizen
      let replyMsg = `✅ <b>So'rovnomangiz qabul qilindi!</b>\n` +
        `🆔 <b>Ariza raqami:</b> <code>${caseId}</code>\n\n` +
        `👤 <b>Fuqaro:</b> ${p.name}\n` +
        `📍 <b>MFY:</b> ${p.mfy}\n` +
        `📊 <b>Tavsiya ishonchliligi:</b> ${out.conf}%\n\n` +
        `🎯 <b>Siz uchun dastlabki tavsiyalar:</b>\n`;

      out.recs.forEach((r, idx) => {
        const pBadge = r.pri === 3 ? "🔴 Yuqori" : r.pri === 2 ? "🟡 O'rta" : "🟢 Past";
        replyMsg += `\n<b>${idx + 1}. ${r.title}</b> [${pBadge}]\n`;
        replyMsg += `🏢 <b>Qayerga:</b> ${r.where}\n`;
        if (r.docs.length) {
          replyMsg += `📄 <b>Hujjatlar:</b> ${r.docs.join(", ")}\n`;
        }
      });

      replyMsg += `\n<i>Ma'lumotlaringiz MFY xodimlariga yuborildi. Rasmiy ko'rib chiqilgach natija yuboriladi.</i>`;

      await ctx.reply(replyMsg, { parse_mode: "HTML" });

      // Notify Admin
      if (adminNotifier) {
        adminNotifier(newCase);
      }
    } catch (e) {
      console.error("Error processing web_app_data:", e);
      await ctx.reply("Ma'lumotni qabul qilishda xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.");
    }
  });

  // Step-by-Step in-chat questionnaire
  bot.hears("💬 Bot ichida to'ldirish", async (ctx) => {
    const userId = ctx.from.id;
    sessions.set(userId, { step: "name", data: {} });

    await ctx.reply(
      "📝 <b>Fuqaro so'rovnomasi (1/13-qadam)</b>\n\n" +
      "Iltimos, to'liq ism va familiyangizni yozing:\n" +
      "<i>(Masalan: Aziza Karimova)</i>",
      {
        parse_mode: "HTML",
        reply_markup: new Keyboard().text("❌ Bekor qilish").resized()
      }
    );
  });

  // Cancel in-chat survey
  bot.hears("❌ Bekor qilish", async (ctx) => {
    sessions.delete(ctx.from.id);
    await ctx.reply("So'rovnoma bekor qilindi.", { reply_markup: getMainMenu() });
  });

  // Text message handler for conversational steps
  bot.on("message:text", async (ctx) => {
    const userId = ctx.from.id;
    const session = sessions.get(userId);
    if (!session) return;

    const text = ctx.message.text.trim();
    if (text === "❌ Bekor qilish") {
      sessions.delete(userId);
      return;
    }

    // Step: Name
    if (session.step === "name") {
      session.data.name = text;
      session.step = "age";
      return ctx.reply("🎂 <b>2/13-qadam: Yoshingizni kiriting:</b>\n<i>(Masalan: 34)</i>", {
        parse_mode: "HTML"
      });
    }

    // Step: Age
    if (session.step === "age") {
      const age = parseInt(text, 10);
      if (isNaN(age) || age < 14 || age > 120) {
        return ctx.reply("Iltimos, to'g'ri yosh kiriting (14 dan 120 gacha):");
      }
      session.data.age = age;
      session.step = "gender";

      const kb = new InlineKeyboard()
        .text("👩 Ayol", "gen_Ayol")
        .text("👨 Erkak", "gen_Erkak");

      return ctx.reply("⚧ <b>3/13-qadam: Jinsingizni tanlang:</b>", {
        parse_mode: "HTML",
        reply_markup: kb
      });
    }

    // Step: Members
    if (session.step === "members") {
      const m = parseInt(text, 10);
      if (isNaN(m) || m < 1 || m > 30) {
        return ctx.reply("Iltimos, oila a'zolari sonini to'g'ri kiriting (1 dan 30 gacha):");
      }
      session.data.members = m;
      session.step = "children";
      return ctx.reply(
        "👶 <b>7/13-qadam: Shundan 18 yoshgacha bolalar soni:</b>\n<i>(Agar bola bo'lmasa 0 kiriting)</i>",
        { parse_mode: "HTML" }
      );
    }

    // Step: Children
    if (session.step === "children") {
      const ch = parseInt(text, 10);
      if (isNaN(ch) || ch < 0 || ch >= session.data.members) {
        return ctx.reply(
          `Bolalar soni 0 dan ${session.data.members - 1} gacha bo'lishi kerak. Iltimos qaytadan kiriting:`
        );
      }
      session.data.children = ch;
      session.step = "income";
      return ctx.reply(
        "💵 <b>8/13-qadam: Oilaning oylik umumiy daromadi (so'mda):</b>\n<i>(Masalan: 3200000 yoki 0)</i>",
        { parse_mode: "HTML" }
      );
    }

    // Step: Income
    if (session.step === "income") {
      const cleaned = text.replace(/\s+/g, "");
      const inc = parseInt(cleaned, 10);
      if (isNaN(inc) || inc < 0) {
        return ctx.reply("Iltimos, daromadni raqamlarda kiriting (masalan: 3500000):");
      }
      session.data.income = inc;
      session.step = "housing";

      const kb = new InlineKeyboard()
        .text("🏡 O'z uyi, qoniqarli", "house_own")
        .row()
        .text("🏚 O'z uyi, yomon sharoit", "house_bad")
        .row()
        .text("🏢 Ijarada", "house_rent")
        .row()
        .text("❌ Uy-joyi yo'q", "house_none");

      return ctx.reply("🏠 <b>9/13-qadam: Uy-joyingiz holati:</b>", {
        parse_mode: "HTML",
        reply_markup: kb
      });
    }

    // Step: Notes
    if (session.step === "notes") {
      session.data.notes = text === "O'tkazib yuborish" ? "" : text;
      // Complete questionnaire
      return finishInChatSurvey(ctx, session.data, adminNotifier);
    }
  });

  // Callback query handler for inline button choices
  bot.on("callback_query:data", async (ctx) => {
    const userId = ctx.from.id;
    const session = sessions.get(userId);
    const data = ctx.callbackQuery.data;

    await ctx.answerCallbackQuery();

    if (!session) return;

    // Gender callback
    if (data.startsWith("gen_") && session.step === "gender") {
      session.data.gender = data.replace("gen_", "");
      session.step = "mfy";

      const kb = new InlineKeyboard();
      MFYS.forEach(m => {
        kb.text(m, `mfy_${m}`).row();
      });

      await ctx.editMessageText("📍 <b>4/13-qadam: Qaysi mahallada yashaysiz? (MFY):</b>", {
        parse_mode: "HTML",
        reply_markup: kb
      });
      return;
    }

    // MFY callback
    if (data.startsWith("mfy_") && session.step === "mfy") {
      session.data.mfy = data.replace("mfy_", "");
      session.step = "type";

      const kb = new InlineKeyboard();
      Object.entries(TYPES).forEach(([k, v]) => {
        kb.text(v, `type_${k}`).row();
      });

      await ctx.editMessageText("📌 <b>5/13-qadam: Asosiy murojaat sababi:</b>", {
        parse_mode: "HTML",
        reply_markup: kb
      });
      return;
    }

    // Type callback
    if (data.startsWith("type_") && session.step === "type") {
      session.data.type = data.replace("type_", "");
      session.step = "members";

      await ctx.editMessageText(
        `✅ Murojaat turi: <b>${TYPES[session.data.type]}</b> qabul qilindi.\n\n` +
        "👨‍👩‍👦 <b>6/13-qadam: Oilada necha kishi yashaysiz? (Oila a'zolari soni):</b>\n<i>(Masalan: 5)</i>",
        { parse_mode: "HTML" }
      );
      return;
    }

    // Housing callback
    if (data.startsWith("house_") && session.step === "housing") {
      session.data.housing = data.replace("house_", "");
      session.step = "work";

      const kb = new InlineKeyboard()
        .text("❌ Ishsiz", "work_jobless")
        .row()
        .text("💼 Ishlaydi", "work_employed")
        .row()
        .text("🛠 O'zini o'zi band qilgan", "work_self")
        .row()
        .text("🎓 Talaba / O'quvchi", "work_student")
        .row()
        .text("🏠 Uy bekasi", "work_home")
        .row()
        .text("👵 Pensioner", "work_retired");

      await ctx.editMessageText("💼 <b>10/13-qadam: Hozirgi bandlik holatingiz:</b>", {
        parse_mode: "HTML",
        reply_markup: kb
      });
      return;
    }

    // Work callback
    if (data.startsWith("work_") && session.step === "work") {
      session.data.work = data.replace("work_", "");
      session.step = "edu";

      const kb = new InlineKeyboard()
        .text("Maktabni tugatmagan", "edu_none")
        .row()
        .text("O'rta maktab", "edu_school")
        .row()
        .text("O'rta maxsus / Kollej / Litsey", "edu_college")
        .row()
        .text("Oliy ta'lim", "edu_uni");

      await ctx.editMessageText("🎓 <b>11/13-qadam: Ta'lim darajangiz:</b>", {
        parse_mode: "HTML",
        reply_markup: kb
      });
      return;
    }

    // Edu callback
    if (data.startsWith("edu_") && session.step === "edu") {
      session.data.edu = data.replace("edu_", "");
      session.step = "disab";

      const kb = new InlineKeyboard()
        .text("Yo'q", "disab_0")
        .text("I guruh", "disab_1")
        .row()
        .text("II guruh", "disab_2")
        .text("III guruh", "disab_3");

      await ctx.editMessageText("♿️ <b>12/13-qadam: Nogironlik guruhi:</b>", {
        parse_mode: "HTML",
        reply_markup: kb
      });
      return;
    }

    // Disability callback
    if (data.startsWith("disab_") && session.step === "disab") {
      session.data.disab = parseInt(data.replace("disab_", ""), 10);
      session.step = "debt";

      const kb = new InlineKeyboard()
        .text("Yo'q", "debt_no")
        .text("Bor", "debt_yes");

      await ctx.editMessageText("💳 <b>13/13-qadam: Kredit yoki qarzingiz bormi?</b>", {
        parse_mode: "HTML",
        reply_markup: kb
      });
      return;
    }

    // Debt callback
    if (data.startsWith("debt_") && session.step === "debt") {
      session.data.debt = data.replace("debt_", "");
      session.step = "notes";

      await ctx.editMessageText(
        "✍️ <b>Ixtiyoriy qo'shimcha izoh:</b>\n" +
        "Nima yordam kerakligi haqida qisqacha yozing yoki pastdagi tugmani bosing:",
        {
          parse_mode: "HTML"
        }
      );

      await ctx.reply("Qo'shimcha izoh:", {
        reply_markup: new Keyboard().text("O'tkazib yuborish").text("❌ Bekor qilish").resized()
      });
      return;
    }
  });

  // Finish in-chat survey helper
  async function finishInChatSurvey(ctx, data, notifier) {
    const userId = ctx.from.id;
    sessions.delete(userId);

    const p = {
      name: data.name,
      age: data.age,
      gender: data.gender,
      mfy: data.mfy,
      type: data.type,
      members: data.members,
      children: data.children,
      income: data.income,
      housing: data.housing,
      work: data.work,
      edu: data.edu,
      disab: data.disab,
      debt: data.debt,
      notes: data.notes || "",
      consent: true
    };

    const out = evaluate(p, db.cfg);
    const caseId = "Q-" + String(Date.now()).slice(-6);

    const newCase = {
      id: caseId,
      ts: Date.now(),
      ini: initials(p.name),
      name: p.name,
      age: p.age,
      gender: p.gender,
      mfy: p.mfy,
      type: p.type,
      members: p.members,
      children: p.children,
      income: p.income,
      housing: p.housing,
      work: p.work,
      edu: p.edu,
      disab: p.disab,
      debt: p.debt,
      notes: p.notes,
      pc: out.pc,
      conf: out.conf,
      poor: out.poor,
      missing: out.missing,
      recs: out.recs,
      decisions: {},
      example: false,
      source: "telegram_chat",
      telegramUserId: userId,
      telegramUsername: ctx.from.username || null
    };

    db.addCase(newCase);

    let resultMsg = `🎉 <b>Rahmat! So'rovnomangiz muvaffaqiyatli qabul qilindi.</b>\n` +
      `🆔 <b>Ariza raqami:</b> <code>${caseId}</code>\n\n` +
      `👤 <b>Fuqaro:</b> ${p.name} (${p.age} yosh)\n` +
      `📍 <b>MFY:</b> ${p.mfy}\n` +
      `👨‍👩‍👧‍👦 <b>Oila daromadi:</b> ${p.members} kishi, kishi boshiga: ${fmt(out.pc)} so'm\n` +
      `📊 <b>Tavsiya ishonchliligi:</b> ${out.conf}%\n\n` +
      `✨ <b>Siz uchun mos yordam dasturlari (${out.recs.length} ta):</b>\n`;

    out.recs.forEach((r, idx) => {
      const pBadge = r.pri === 3 ? "🔴 Yuqori" : r.pri === 2 ? "🟡 O'rta" : "🟢 Past";
      resultMsg += `\n<b>${idx + 1}. ${r.title}</b> [${pBadge}]\n`;
      resultMsg += `🏢 <b>Qayerga:</b> ${r.where}\n`;
      if (r.docs && r.docs.length) {
        resultMsg += `📄 <b>Hujjatlar:</b> ${r.docs.join(", ")}\n`;
      }
      if (r.steps && r.steps.length) {
        resultMsg += `🚶 <b>Qadamlar:</b> ${r.steps.join(" → ")}\n`;
      }
    });

    resultMsg += `\n<i>Ushbu ma'lumotlar MFY mas'ul xodimiga taqdim etildi.</i>`;

    await ctx.reply(resultMsg, {
      parse_mode: "HTML",
      reply_markup: getMainMenu()
    });

    // Notify Admin
    if (notifier) {
      notifier(newCase);
    }
  }

  return bot;
}
