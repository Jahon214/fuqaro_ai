export const MFYS = [
  "Xovosobod",
  "Yettiguzar",
  "Karvonsaroy",
  "Bunyodkor",
  "Boshqa MFY"
];

export const TYPES = {
  ish: "Ish so'rab keldi",
  kambagal: "Kambag'allik / ijtimoiy yordam",
  nogiron: "Nogironlik bilan bog'liq",
  kredit: "Kredit olmoqchi",
  talim: "Ta'lim",
  uy: "Uy-joy",
  huquq: "Huquqiy maslahat",
  boshqa: "Boshqa"
};

export const REJECT_REASONS = [
  "Fuqaroga mos emas",
  "Shart bajarilmagan",
  "Fuqaro xohlamadi",
  "Ma'lumot yetarli emas",
  "Boshqa"
];

export const PRIORITY_LABELS = {
  3: "Yuqori",
  2: "O'rta",
  1: "Past"
};

export function fmt(n) {
  if (n == null || isNaN(n)) return "0";
  return new Intl.NumberFormat("uz-UZ").format(Math.round(n));
}

export function initials(n) {
  return (n || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase() + ".")
    .join("") || "—";
}

export function ageGroup(a) {
  if (a == null) return "Noma'lum";
  if (a < 18) return "18 dan kichik";
  if (a < 30) return "18–29";
  if (a < 50) return "30–49";
  return "50+";
}

/**
 * Client-side recommendation evaluation matching backend 1:1
 */
export function evaluate(p, cfg = { threshold: 1000000 }) {
  const thr = Number(cfg.threshold) || 1000000;
  const pc = (p.members && p.income != null) ? p.income / p.members : null;
  const poor = pc != null && pc < thr;
  const recs = [];

  const add = (id, title, pri, why, docs, where, steps) => {
    recs.push({ id, title, pri, why, docs, where, steps });
  };

  const adult = p.age != null && p.age >= 18;
  const working = p.age != null && p.age >= 18 && p.age <= 60;
  const pcTxt = pc != null ? `kishi boshiga oyiga ${fmt(pc)} so'm` : "";

  // 1. Bandlik
  if (p.work === "jobless" && adult && p.age <= 65) {
    add(
      "bandlik",
      "Bandlik xizmatida ro'yxatdan o'tish va ish tanlash",
      p.type === "ish" ? 3 : 2,
      ["Fuqaro ishsiz va mehnat yoshida"].concat(p.type === "ish" ? ["Murojaat sababi: ish qidirish"] : []),
      ["Pasport", "Mehnat daftarchasi yoki ish tajribasi haqida ma'lumot", "Ta'lim hujjati (bo'lsa)"],
      "Tumanning bandlik markazi yoki mahalla yettiligi",
      ["Hujjatlarni tayyorlash", "Bandlik markazida ro'yxatdan o'tish", "Mos bo'sh o'rinlar ro'yxatini olish"]
    );
  }

  // 2. Kasb-hunar
  if (working && (p.work === "jobless" || p.edu === "none" || p.edu === "school") && p.age <= 40) {
    add(
      "kasb",
      "Kasb-hunar kursiga yuborish",
      p.work === "jobless" ? 2 : 1,
      ["Yoshi 40 dan oshmagan", p.work === "jobless" ? "Ishsiz" : "Kasbiy ta'limi yo'q yoki o'rta ta'lim bilan cheklangan"],
      ["Pasport", "Ta'lim hujjati"],
      "Kasb-hunar o'quv markazi, bandlik markazi orqali",
      ["Qiziqish va mahalliy talab bo'yicha yo'nalish tanlash", "Kursga ro'yxatdan o'tish"]
    );
  }

  // 3. Tadbirkorlik
  if (working && (p.type === "ish" || p.type === "kredit" || p.work === "jobless" || p.work === "home")) {
    add(
      "tadbirkor",
      "O'zini o'zi band qilish va kichik tadbirkorlik bo'yicha maslahat",
      p.type === "kredit" || p.type === "ish" ? 2 : 1,
      ["Mehnat yoshida", "Murojaat ish yoki mablag' bilan bog'liq yoki fuqaro hozir bandligi yo'q"],
      ["Pasport", "Qisqa biznes-g'oya (1 sahifa)"],
      "Mahalla yettiligi, tadbirkorlikni qo'llab-quvvatlash markazi",
      ["Biznes g'oyani yozib olish", "Daromad va xarajatni taxmin qilish", "Moliyalashtirish yo'llarini ko'rib chiqish"]
    );
  }

  // 4. Ijtimoiy reestr
  if (poor) {
    add(
      "reestr",
      "Ijtimoiy reestrga kiritish masalasini ko'rib chiqish",
      3,
      [`Oila daromadi ${pcTxt}, belgilangan sinov chegarasidan (${fmt(thr)} so'm) past`],
      ["Oila a'zolari ro'yxati", "Daromad haqida ma'lumot", "Uy-joy holati bo'yicha ma'lumot"],
      "Mahalla yettiligi, ijtimoiy xodim",
      ["Oilaning holatini joyida tekshirish", "Yettilik yig'ilishida ko'rib chiqish", "Natijani fuqaroga xabar qilish"]
    );
  }

  // 5. Bolalar
  if (p.children >= 1 && poor) {
    add(
      "bolalar",
      "Bolalar uchun imtiyozlar va maktabgacha ta'lim imkoniyatini tekshirish",
      2,
      [`${p.children} nafar bolasi bor`, "Oila daromadi past"],
      ["Bola tug'ilganlik guvohnomasi", "Oila tarkibi ma'lumoti"],
      "Mahalla yettiligi, maktabgacha ta'lim bo'limi",
      ["Bolalarning yoshini aniqlash", "Mos imtiyoz turlarini tekshirish", "Ariza berishda yordam"]
    );
  }

  // 6. Ko'p bolali
  if (p.children >= 3) {
    add(
      "kopbola",
      "Ko'p bolali oilalar uchun yordam turlarini tekshirish",
      2,
      [`${p.children} nafar bolasi bor`],
      ["Barcha bolalar guvohnomasi", "Oila tarkibi ma'lumoti"],
      "Mahalla yettiligi, xotin-qizlar yetakchisi",
      ["Mavjud yordam turlarini ro'yxatdan tekshirish", "Hujjatlarni to'plash"]
    );
  }

  // 7. Nogironlik
  if (p.disab >= 1) {
    add(
      "reabil",
      "Reabilitatsiya va texnik vositalar bo'yicha murojaat",
      3,
      [`Nogironlik guruhi: ${["", "I", "II", "III"][p.disab] || p.disab}`],
      ["Nogironlik haqida ma'lumotnoma", "Pasport", "Individual reabilitatsiya dasturi (bo'lsa)"],
      "Tuman ijtimoiy himoya bo'limi, tibbiy-mehnat ekspertiza komissiyasi",
      ["Individual dastur holatini tekshirish", "Kerakli texnik vositani aniqlash", "Ariza berish"]
    );

    if (working && p.work === "jobless") {
      add(
        "moslish",
        "Moslashtirilgan ish o'rni va masofaviy ish imkoniyati",
        2,
        ["Nogironligi bor, mehnat yoshida va ishsiz"],
        ["Nogironlik ma'lumotnomasi", "Ta'lim hujjati"],
        "Bandlik markazi",
        ["Mehnat qobiliyati cheklovini aniqlash", "Mos ish o'rinlarini tanlash"]
      );
    }
  }

  // 8. Uyda ijtimoiy xizmat
  if (p.age != null && ((p.age >= 65 && p.members === 1) || (String(p.disab) === "1" || p.disab === 1))) {
    add(
      "uyda",
      "Uyda ijtimoiy xizmat ehtiyojini baholash",
      3,
      [p.age >= 65 && p.members === 1 ? "Yolg'iz yashovchi keksa" : "I guruh nogironligi"],
      ["Pasport", "Tibbiy ma'lumotnoma (bo'lsa)"],
      "Ijtimoiy xodim, tuman ijtimoiy xizmat bo'limi",
      ["Ijtimoiy xodimning uyga tashrifi", "Xizmat ehtiyojini baholash", "Ro'yxatga olish"]
    );
  }

  // 9. Kredit
  if (p.type === "kredit") {
    if (p.debt === "yes") {
      add(
        "qarz",
        "Mavjud qarz yukini baholash va moliyaviy maslahat",
        3,
        ["Fuqaroning kredit yoki qarzi bor", "Yangi kredit olishdan oldin to'lov qobiliyatini tekshirish kerak"],
        ["Mavjud kredit shartnomalari", "Daromad haqida ma'lumot"],
        "Bank maslahatchisi, mahalla yettiligi",
        ["Oylik to'lovlar va daromadni solishtirish", "Qarzni qayta rejalashtirish imkonini bank bilan muhokama qilish"]
      );
    }
    add(
      "kredit",
      "Imtiyozli kredit dasturlari bo'yicha maslahat",
      p.debt === "yes" ? 1 : 2,
      ["Murojaat kredit olish bilan bog'liq"].concat(poor ? ["Oila daromadi past, imtiyozli shartlar mos kelishi mumkin"] : []),
      ["Pasport", "Daromad yoki biznes-reja", "Kafillik yoki garov bo'yicha ma'lumot"],
      "Bank filiali, mahalla yettiligi",
      ["Kredit maqsadini aniqlash", "Mos dasturlar shartlarini solishtirish", "Hujjatlarni tayyorlash"]
    );
  }

  // 10. Uy-joy
  if (p.housing === "none" || p.housing === "bad" || p.type === "uy") {
    add(
      "uy",
      "Uy-joy dasturlari bo'yicha ro'yxatga olish va maslahat",
      p.housing === "none" ? 3 : 2,
      [p.housing === "none" ? "Uy-joyi yo'q" : p.housing === "bad" ? "Uy-joy sharoiti yomon" : "Murojaat uy-joy bilan bog'liq"],
      ["Pasport", "Oila tarkibi", "Uy-joy holati haqida ma'lumot"],
      "Mahalla yettiligi, tuman hokimligi",
      ["Uy-joy holatini joyida ko'rish", "Mos dasturlar shartlarini tekshirish", "Ariza berish"]
    );
  }

  // 11. Ta'lim
  if (p.type === "talim" && p.age != null && p.age <= 30) {
    add(
      "talim",
      "Ta'lim imkoniyatlari: grant, kontrakt, stipendiya bo'yicha maslahat",
      2,
      ["Murojaat ta'lim bilan bog'liq", "Yoshi 30 dan oshmagan"],
      ["Pasport", "Ta'lim hujjati", "Test natijasi (bo'lsa)"],
      "Yoshlar yetakchisi, ta'lim bo'limi",
      ["Ta'lim yo'nalishini aniqlash", "Qabul va moliyalashtirish shartlarini tekshirish"]
    );
  }

  // 12. Huquq
  if (p.type === "huquq") {
    add(
      "huquq",
      "Huquqiy maslahatga yo'naltirish",
      2,
      ["Murojaat huquqiy masala bo'yicha"],
      ["Masalaga oid hujjatlar nusxasi"],
      "Mahalla huquqiy maslahatchisi yoki tuman yuridik xizmati",
      ["Muammoni qisqa yozib olish", "Mutaxassis qabuliga yozdirish"]
    );
  }

  // 13. Tibbiy
  if (p.age != null && p.age >= 50) {
    add(
      "tibbiy",
      "Profilaktik tibbiy ko'rikdan o'tishni eslatish",
      1,
      ["Yoshi 50 dan oshgan"],
      ["Pasport"],
      "Oilaviy poliklinika",
      ["Ko'rik kunini kelishish"]
    );
  }

  // Fallback
  if (!recs.length) {
    add(
      "suhbat",
      "Mahalla yettiligi bilan suhbat o'tkazish",
      1,
      ["Berilgan ma'lumot bo'yicha aniq dastur topilmadi", "Ko'proq ma'lumot kiritilsa, tavsiya aniqroq bo'ladi"],
      [],
      "Mahalla yettiligi",
      ["Fuqaro bilan batafsil suhbat", "Ehtiyojni aniqlab, qayta kiritish"]
    );
  }

  recs.sort((a, b) => b.pri - a.pri);

  const req = [
    ["age", "yoshi"],
    ["members", "oila a'zolari"],
    ["income", "daromad"],
    ["work", "bandlik"],
    ["disab", "nogironlik"],
    ["housing", "uy-joy"],
    ["debt", "qarz"],
    ["edu", "ta'lim"]
  ];
  const missing = req.filter(([k]) => p[k] == null || p[k] === "").map(r => r[1]);
  const conf = Math.round(100 * (1 - missing.length / req.length));

  return {
    recs: recs.slice(0, 6),
    pc,
    conf,
    missing,
    poor
  };
}
