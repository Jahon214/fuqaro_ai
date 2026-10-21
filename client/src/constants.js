export const MFYS = [
  "Chamanzor MFY",
  "Istiqlol MFY",
  "Do‘stlik MFY",
  "Tinchlik MFY",
  "Karvonsaroy MFY",
  "Yetti guzar MFY",
  "Bunyodkor MFY",
  "Farhod MFY",
  "Obod turmush MFY",
  "Gulbahor SHFY",
  "Mustaqillikning 25 yilligi MFY",
  "Sohibkor QFY",
  "Sharqobod MFY",
  "Qayirma MFY",
  "Qora kum MFY",
  "Paxtakor QFY",
  "Oqchangal MFY",
  "Afrosiyob MFY",
  "O‘zb.to‘qimachiligi MFY",
  "Xovosobod MFY",
  "Yangiyer MFY",
  "Mustaqillik MFY",
  "Xusnobod MFY",
  "Qahramon MFY",
  "Bo‘ston MFY",
  "Binokor QFY",
  "Boshqa hudud"
];

export const TYPES = {
  davlat_idoralari: "Davlat va xo‘jalik idoralari ishlari",
  hokimiyat_ishlari: "Hokimiyat idoralarining ishlari",
  moliya_soliq_bojxona: "Moliya, soliq va bojxona masalasi",
  bank_kredit: "Bank, kredit masalalari",
  ish_bandlik: "Ish, ish haqi va imtiyozlar",
  nafaqa: "Nafaqa masalalari",
  moddiy_yordam: "Moddiy yordam masalalari",
  korxona_xususiylashtirish: "Korxona faoliyati va xususiylashtirish masalasi",
  tashqi_iqtisodiy: "Tashqi iqtisodiy aloqalar masalasi",
  tadbirkorlik: "Tadbirkorlikni rivojlantirish masalasi",
  fermer_xojalik: "Fermer xo‘jaliklari masalalari",
  agrosanoat: "Agrosanoat infrastrukturasi masalasi",
  istemol_tovarlar: "Iste’mol tovarlari ishlab chiqarish masalasi",
  bozor_savdo: "Bozor va savdo sohalari",
  uy_joy_yer: "Uy-joy va yer olish masalalari",
  uylarni_tamirlash: "Uylarni ta’mirlash masalalari",
  kommunal_xizmat: "Kommunal-xizmat sohasi",
  obodonlashtirish: "Obodonlashtirish masalalari",
  shirkat_uyjoy: "Xususiy uy-joy mulkdorlari shirkati",
  qurilish: "Qurilish masalalari",
  elektr_gaz: "Elektrlashtirish va gazlashtirish",
  transport: "Transport masalalari",
  yoqilgi_energetika: "Yoqilg‘i-energetika sohalari",
  mashinasozlik: "Mashinasozlik, avtomobil sanoati masalasi",
  xalq_talimi: "Xalq ta’limi masalalari",
  oliy_talim: "Oliy va o‘rta maxsus ta’lim",
  sogliqni_saqlash: "Sog‘liqni saqlash sohasi",
  madaniyat_sanat: "Madaniyat, matbuot va san’at ishlari",
  din_masalalari: "Din masalalari",
  mahalla_qfy: "Mahalla va QFY masalalari",
  oila_masalalari: "Oila masalalari",
  aloqa_it: "Aloqa va axborot texnologiyasi",
  sud: "Sud masalalari",
  prokuratura: "Prokuratura masalalari",
  adliya: "Adliya masalalari",
  ichki_ishlar: "Ichki ishlar masalalari",
  mudofaa: "Mudofaa masalalari",
  turli: "Turli masalalar",
  // Legacy aliases for backward compatibility
  ish: "Ish, ish haqi va imtiyozlar",
  kambagal: "Moddiy yordam masalalari",
  nogiron: "Sog‘liqni saqlash sohasi",
  kredit: "Bank, kredit masalalari",
  talim: "Xalq ta’limi masalalari",
  uy: "Uy-joy va yer olish masalalari",
  huquq: "Adliya masalalari",
  boshqa: "Turli masalalar"
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

  const t = String(p.type || "").toLowerCase();
  const isIsh = t === "ish" || t === "ish_bandlik" || t.includes("ish") || t.includes("bandlik");
  const isKredit = t === "kredit" || t === "bank_kredit" || t === "tadbirkorlik" || t === "fermer_xojalik" || t.includes("kredit") || t.includes("bank") || t.includes("tadbirkorlik") || t.includes("fermer");
  const isUy = t === "uy" || t === "uy_joy_yer" || t === "uylarni_tamirlash" || t === "shirkat_uyjoy" || t.includes("uy-joy") || t.includes("uylar") || t.includes("shirkati");
  const isTalim = t === "talim" || t === "xalq_talimi" || t === "oliy_talim" || t.includes("ta’lim") || t.includes("talim");
  const isHuquq = t === "huquq" || t === "sud" || t === "prokuratura" || t === "adliya" || t === "ichki_ishlar" || t.includes("sud") || t.includes("adliya") || t.includes("prokuratura") || t.includes("ichki ishlar");
  const isKommunal = t === "kommunal_xizmat" || t === "elektr_gaz" || t === "yoqilgi_energetika" || t.includes("kommunal") || t.includes("elektr") || t.includes("yoqilg‘i");
  const isSogliq = t === "nogiron" || t === "sogliqni_saqlash" || t.includes("sog‘liq") || t.includes("nogiron");
  const isModdiy = t === "kambagal" || t === "moddiy_yordam" || t === "nafaqa" || t.includes("moddiy") || t.includes("nafaqa");

  // 1. Bandlik
  if (p.work === "jobless" && adult && p.age <= 65) {
    add(
      "bandlik",
      "Bandlik xizmatida ro'yxatdan o'tish va ish tanlash",
      isIsh ? 3 : 2,
      ["Fuqaro ishsiz va mehnat yoshida"].concat(isIsh ? ["Murojaat sababi: ish va bandlik masalasi"] : []),
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
  if (working && (isIsh || isKredit || p.work === "jobless" || p.work === "home")) {
    add(
      "tadbirkor",
      "O'zini o'zi band qilish va kichik tadbirkorlik bo'yicha maslahat",
      isKredit || isIsh ? 2 : 1,
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
  if (isKredit) {
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
  if (p.housing === "none" || p.housing === "bad" || isUy) {
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
  if (isTalim && p.age != null && p.age <= 35) {
    add(
      "talim",
      "Ta'lim imkoniyatlari: grant, kontrakt, stipendiya bo'yicha maslahat",
      2,
      ["Murojaat ta'lim bilan bog'liq", "Ta'lim dasturlaridan foydalanish yoshida"],
      ["Pasport", "Ta'lim hujjati", "Test natijasi (bo'lsa)"],
      "Yoshlar yetakchisi, ta'lim bo'limi",
      ["Ta'lim yo'nalishini aniqlash", "Qabul va moliyalashtirish shartlarini tekshirish"]
    );
  }

  // 12. Huquq
  if (isHuquq) {
    add(
      "huquq",
      "Huquqiy maslahatga yo'naltirish",
      2,
      ["Murojaat huquqiy, sud yoki adliya masalalari bo'yicha"],
      ["Masalaga oid hujjatlar nusxasi"],
      "Mahalla huquqiy maslahatchisi yoki tuman yuridik xizmati",
      ["Muammoni qisqa yozib olish", "Mutaxassis qabuliga yozdirish"]
    );
  }

  // 13. Kommunal
  if (isKommunal) {
    add(
      "kommunal",
      "Kommunal va muhandislik xizmatlari bo'yicha amaliy yordam",
      2,
      ["Murojaat elektr, gaz, suv yoki infratuzilma bilan bog'liq"],
      ["Pasport", "Hisoblagich yoki shartnoma ma'lumoti"],
      "Mahalla yettiligi, tuman kommunal xizmatlari",
      ["Muammoni joyida o'rganish", "Tegishli soha mutaxassisini jalb qilish"]
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

/**
 * Client-Side Smart AI Copilot Engine
 * Generates instant AI analysis directly in the browser if backend is offline or on static Vercel
 */
export function generateBuiltInAnalysis(p, out, cfg = { threshold: 1000000 }) {
  const thr = Number(cfg.threshold) || 1000000;
  const pc = out.pc;
  const poor = out.poor;
  const hasChildren = p.children && p.children > 0;
  const isJobless = p.work === "jobless";
  const hasDebt = p.debt === "yes";
  const isBadHousing = p.housing === "none" || p.housing === "bad" || p.housing === "rent";
  const isDisab = p.disab && p.disab > 0;

  let povertyRisk = "Past";
  if (pc != null) {
    if (pc < thr * 0.7) povertyRisk = "Yuqori";
    else if (pc < thr) povertyRisk = "O'rta";
    else povertyRisk = "Past";
  } else if (poor || isJobless) {
    povertyRisk = "O'rta";
  }

  let debtRisk = "Past";
  if (hasDebt && (isJobless || poor)) {
    debtRisk = "Yuqori";
  } else if (hasDebt) {
    debtRisk = "O'rta";
  }

  let priorityLevel = "O'rta";
  if (povertyRisk === "Yuqori" || isDisab || (isJobless && hasChildren >= 3)) {
    priorityLevel = "Yuqori";
  } else if (povertyRisk === "Past" && !isJobless && !hasDebt) {
    priorityLevel = "Past";
  }

  let summary = "";
  if (povertyRisk === "Yuqori") {
    summary = `Fuqaroning oilasida kishi boshiga daromad belgilangan mezon (${fmt(thr)} so'm) dan sezilarli darajada past bo'lib, o'tkir moddiy ko'mak va bandlik choralariga muhtoj.`;
  } else if (isJobless) {
    summary = `Fuqaro mehnat yoshida bo'lib, ayni paytda doimiy daromad manbaiga ega emas. Asosiy e'tiborni kasbga yo'naltirish va doimiy ish o'rniga qaratish lozim.`;
  } else if (isDisab) {
    summary = `Fuqaroning ${p.disab}-guruh nogironligi mavjudligi tufayli reabilitatsiya, moslashtirilgan ijtimoiy xizmatlar va tibbiy ko'rik ustuvor ahamiyatga ega.`;
  } else {
    summary = `Fuqaro murojaati bo'yicha umumiy holat barqaror, individual tadbirkorlik va imtiyozli kredit dasturlari orqali daromadni oshirish tavsiya etiladi.`;
  }

  const adminAdvice = [];
  if (poor) {
    adminAdvice.push(
      `Fuqaroni "Ijtimoiy reestr" tizimiga kiritish uchun oilaning yashash sharoitini xatlovdan o'tkazish va moddiy yordam arizasini rasmiylashtirish.`
    );
  }
  if (isJobless) {
    adminAdvice.push(
      `Mahalla hokim yordamchisi bilan birgalikda tumandagi mavjud bo'sh ish o'rinlari yarmarkasiga jalb qilish yoki "Ishga marhamat" monomarkaziga kasbiy kursga yo'naltirish.`
    );
  }
  if (hasChildren && poor) {
    adminAdvice.push(
      `18 yoshgacha bo'lgan ${p.children} nafar farzand uchun bolalar nafaqasi va bog'cha to'lovlari bo'yicha imtiyozlarni tekshirib, hujjatlarni to'plashga yordam berish.`
    );
  }
  if (p.type === "kredit") {
    if (hasDebt) {
      adminAdvice.push(
        `Fuqaroning amaldagi qarz yukini tekshirish; yangi kredit berishdan oldin to'lov qobiliyati va qarz qoplash imkoniyatlarini bank mutaxassisi bilan hisob-kitob qilish.`
      );
    } else {
      adminAdvice.push(
        `Oilaviy tadbirkorlikni rivojlantirish dasturi (OTRD) doirasida 33 million so'mgacha imtiyozli kredit yoki subsidiya shartlarini tanishtirish.`
      );
    }
  }
  if (isBadHousing) {
    adminAdvice.push(
      `Uy-joy sharoiti to'g'risida mahalla yettiligining dalolatnomasini tuzish va subsidiya asosidagi arzon uy-joy dasturi navbatiga kiritish masalasini ko'rib chiqish.`
    );
  }
  if (isDisab) {
    adminAdvice.push(
      `Inson ijtimoiy xizmatlar markazi bilan bog'lanib, bepul protez-ortopediya va reabilitatsiya vositalariga bo'lgan ehtiyojni ro'yxatga olish.`
    );
  }
  if (adminAdvice.length === 0) {
    adminAdvice.push(`Fuqaro bilan mahalla binosida yuzma-yuz suhbat o'tkazib, uning reja va ehtiyojlarini aniqlash.`);
    adminAdvice.push(`Murojaat turi bo'yicha tegishli tuman mutaxassisi (yurist yoki bandlik xodimi) qabuliga yozdirish.`);
  }

  let recommendedAction = "Tasdiqlash";
  let actionRationale = "Kiritilgan barcha ma'lumotlar va qoidalar mezonlariga to'liq mos keladi.";
  if (out.missing && out.missing.length > 2) {
    recommendedAction = "Qo'shimcha tekshirish";
    actionRationale = `Ayrim muhim ma'lumotlar (${out.missing.join(", ")}) to'liq ko'rsatilmagan. Yakuniy qarordan oldin aniqlashtirish zarur.`;
  }

  let socialPackage = "Davlat ijtimoiy ko'mak paketi";
  if (poor && isJobless) socialPackage = "«Ijtimoiy himoya + Bandlik» integratsiyalashgan paketi";
  else if (p.type === "kredit") socialPackage = "«Kichik biznes va o'zini o'zi band qilish» mikromoliya paketi";
  else if (isDisab) socialPackage = "«Inson» ijtimoiy xizmatlar va reabilitatsiya paketi";
  else if (p.children >= 3) socialPackage = "«Ko'p bolali oilalarni qo'llab-quvvatlash» ijtimoiy yordami";

  return {
    summary,
    povertyRisk,
    debtRisk,
    priorityLevel,
    adminAdvice: adminAdvice.slice(0, 3),
    recommendedAction,
    actionRationale,
    socialPackage,
    engine: "Xovos Fuqaro AI Smart Copilot (Bepul integratsiya)"
  };
}

/**
 * Generate the 10 reference seed cases matching target specification
 */
export function generateSeedCases(threshold = 1000000) {
  const S = [
    ["A.K.", 34, "Ayol", "Xovosobod", "ish", { members: 5, children: 3, income: 3200000, housing: "rent", work: "jobless", edu: "college", disab: 0, debt: "no", fullName: "Aziza Karimova" }],
    ["B.R.", 52, "Erkak", "Yettiguzar", "nogiron", { members: 4, children: 1, income: 2100000, housing: "own", work: "jobless", edu: "school", disab: 2, debt: "no", fullName: "Baxtiyor Rahimov" }],
    ["S.T.", 27, "Ayol", "Karvonsaroy", "kredit", { members: 3, children: 1, income: 6500000, housing: "own", work: "self", edu: "uni", disab: 0, debt: "yes", fullName: "Shahnoza To'rayeva" }],
    ["M.Y.", 71, "Ayol", "Xovosobod", "kambagal", { members: 1, children: 0, income: 900000, housing: "bad", work: "retired", edu: "school", disab: 0, debt: "no", fullName: "Mastura Yusupova" }],
    ["J.N.", 22, "Erkak", "Bunyodkor", "talim", { members: 6, children: 2, income: 4800000, housing: "own", work: "student", edu: "school", disab: 0, debt: "no", fullName: "Javohir Nazarov" }],
    ["D.A.", 41, "Erkak", "Yettiguzar", "ish", { members: 4, children: 2, income: 7000000, housing: "own", work: "jobless", edu: "college", disab: 0, debt: "no", fullName: "Dilshod Aliyev" }],
    ["N.H.", 38, "Ayol", "Karvonsaroy", "kambagal", { members: 7, children: 5, income: 2600000, housing: "none", work: "home", edu: "school", disab: 0, debt: "no", fullName: "Nodira Hakimova" }],
    ["R.Q.", 58, "Erkak", "Bunyodkor", "huquq", { members: 3, children: 0, income: 5200000, housing: "own", work: "employed", edu: "uni", disab: 0, debt: "no", fullName: "Rustam Qodirov" }],
    ["Z.M.", 30, "Ayol", "Xovosobod", "nogiron", { members: 4, children: 2, income: 3000000, housing: "rent", work: "jobless", edu: "uni", disab: 3, debt: "no", fullName: "Zarina Mahmudova" }],
    ["O.B.", 46, "Erkak", "Karvonsaroy", "kredit", { members: 5, children: 3, income: 5500000, housing: "own", work: "self", edu: "college", disab: 0, debt: "no", fullName: "Otabek Boboyev" }]
  ];

  const day = 86400000;
  const now = Date.now();

  return S.map((s, i) => {
    const p = Object.assign({ age: s[1], gender: s[2], mfy: s[3], type: s[4], name: s[5].fullName }, s[5]);
    const out = evaluate(p, { threshold });
    const dec = {};

    out.recs.forEach((r, k) => {
      const v = (i * 7 + k * 3) % 10;
      dec[r.id] = v < 7
        ? { d: "ok", reason: "" }
        : v < 9
        ? { d: "edit", reason: "Ma'lumot yetarli emas" }
        : { d: "no", reason: "Fuqaro xohlamadi" };
    });

    const aiAnalysis = generateBuiltInAnalysis(p, out, { threshold });

    return {
      id: "N-" + (100 + i),
      ts: now - (i + 1) * day * 1.5,
      ini: s[0],
      name: s[5].fullName,
      age: s[1],
      gender: s[2],
      mfy: s[3],
      type: s[4],
      members: s[5].members,
      children: s[5].children,
      income: s[5].income,
      housing: s[5].housing,
      work: s[5].work,
      edu: s[5].edu,
      disab: s[5].disab,
      debt: s[5].debt,
      notes: "",
      pc: out.pc,
      conf: out.conf,
      poor: out.poor,
      missing: out.missing,
      recs: out.recs,
      decisions: dec,
      aiAnalysis,
      example: true,
      source: "seed",
      telegramUserId: null
    };
  });
}

export const SEED_CASES = generateSeedCases(1000000);

/**
 * Calculate client-side statistics matching JournalView requirements 1:1
 */
export function calculateStats(casesList = []) {
  const cases = casesList || [];
  const total = cases.length;
  const allDec = cases.flatMap(c => Object.values(c.decisions || {}));
  const approvedDec = allDec.filter(d => d.d === "ok").length;
  const acc = allDec.length ? Math.round((100 * approvedDec) / allDec.length) : 0;
  const avg = total ? (cases.reduce((s, c) => s + (c.recs ? c.recs.length : 0), 0) / total).toFixed(1) : "0";
  const exampleCount = cases.filter(c => c.example).length;

  // Type distribution
  const typeCounts = new Map();
  cases.forEach(c => {
    const label = TYPES[c.type] || c.type || "Boshqa";
    const g = typeCounts.get(label) || { n: 0, recs: 0, ok: 0, dec: 0 };
    g.n++;
    g.recs += (c.recs ? c.recs.length : 0);
    Object.values(c.decisions || {}).forEach(d => {
      g.dec++;
      if (d.d === "ok") g.ok++;
    });
    typeCounts.set(label, g);
  });

  const byType = [...typeCounts.entries()]
    .map(([name, g]) => ({
      name,
      count: g.n,
      recs: g.recs,
      approvalRate: g.dec ? Math.round((100 * g.ok) / g.dec) : null
    }))
    .sort((a, b) => b.count - a.count);

  // Grouping stats helper
  const groupStats = (keyFn) => {
    const m = new Map();
    cases.forEach(c => {
      const k = keyFn(c) || "Ko'rsatilmagan";
      const g = m.get(k) || { n: 0, recs: 0, ok: 0, dec: 0 };
      g.n++;
      g.recs += (c.recs ? c.recs.length : 0);
      Object.values(c.decisions || {}).forEach(d => {
        g.dec++;
        if (d.d === "ok") g.ok++;
      });
      m.set(k, g);
    });
    return [...m.entries()]
      .map(([group, g]) => ({
        group,
        count: g.n,
        avgRecs: g.n ? (g.recs / g.n).toFixed(1) : "0",
        approvalRate: g.dec ? Math.round((100 * g.ok) / g.dec) : null,
        isLowSample: g.n < 5
      }))
      .sort((a, b) => b.count - a.count);
  };

  return {
    total,
    avgRecs: avg,
    acceptanceRate: acc,
    exampleCount,
    byType,
    fairness: {
      byAge: groupStats(c => ageGroup(c.age)),
      byGender: groupStats(c => c.gender || "Ko'rsatilmagan"),
      byMfy: groupStats(c => c.mfy || "Ko'rsatilmagan")
    }
  };
}
