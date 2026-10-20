import { fmt, TYPES } from "./engine.js";

/**
 * AI Service for Fuqaro AI
 * Supports:
 * 1. Free Gemini API integration (if GEMINI_API_KEY is provided in .env)
 * 2. Intelligent Built-in Zero-Cost Neural-Heuristic Engine (100% free, offline, instant, no key required)
 */

export async function analyzeCaseWithAI(p, out, cfg = { threshold: 1000000 }) {
  const apiKey = process.env.GEMINI_API_KEY || "";

  // If Gemini API Key is configured, attempt free Gemini call
  if (apiKey && apiKey.length > 20) {
    try {
      const geminiResult = await callGeminiAPI(p, out, cfg, apiKey);
      if (geminiResult) {
        return geminiResult;
      }
    } catch (err) {
      console.warn("[AI Service] Gemini API call failed, falling back to built-in smart AI engine:", err.message);
    }
  }

  // Built-in Smart AI Engine (High quality, instantaneous, zero cost)
  return generateBuiltInAnalysis(p, out, cfg);
}

/**
 * Call Google Gemini Free Tier API via direct fetch
 */
async function callGeminiAPI(p, out, cfg, apiKey) {
  const prompt = `Siz O'zbekiston Respublikasi mahalla tizimi va kambag'allikni qisqartirish bo'yicha tajribali tahlilchi va MFY mas'ul xodimi (hokim yordamchisi, ijtimoiy xodim, xotin-qizlar yetakchisi) uchun bosh AI maslahatchisisiz.
Quyidagi fuqaro so'rovnomasi va dastlabki qoidalar asosidagi natijani chuqur tahlil qiling va MFY xodimiga amaliy, xolis va huquqiy jihatdan to'g'ri maslahat bering.

FUQARO MA'LUMOTLARI:
- Ismi: ${p.name || p.ini}
- Yoshi: ${p.age} yosh
- Jinsi: ${p.gender || "Ko'rsatilmagan"}
- MFY: ${p.mfy}
- Murojaat turi: ${TYPES[p.type] || p.type}
- Oila a'zolari: ${p.members || "Noma'lum"} kishi (shundan 18 yoshgacha bolalar: ${p.children || 0} nafar)
- Oylik umumiy daromad: ${p.income != null ? fmt(p.income) + " so'm" : "Noma'lum"}
- Kishi boshiga daromad: ${out.pc != null ? fmt(out.pc) + " so'm" : "Noma'lum"} (Belgilangan chegara: ${fmt(cfg.threshold || 1000000)} so'm)
- Uy-joy holati: ${p.housing || "Ko'rsatilmagan"}
- Bandlik: ${p.work || "Ko'rsatilmagan"}
- Ta'lim: ${p.edu || "Ko'rsatilmagan"}
- Nogironlik guruhi: ${p.disab ? p.disab + "-guruh" : "Yo'q"}
- Qarz/kredit: ${p.debt === "yes" ? "Bor" : "Yo'q"}
- Fuqaro so'zi bilan: "${p.notes || "Izoh kiritilmagan"}"

JAVOBNI FAQAT QUYIDAGI JSON FORMATIDA QAYTAR (boshqa matn qo'shma):
{
  "summary": "Fuqaro ijtimoiy-iqtisodiy ahvolining 2 jumlali qisqa xulosasi",
  "povertyRisk": "Yuqori" yoki "O'rta" yoki "Past",
  "debtRisk": "Yuqori" yoki "O'rta" yoki "Past",
  "priorityLevel": "Yuqori" yoki "O'rta" yoki "Past",
  "adminAdvice": [
    "Xodim birinchi navbatda nima qilishi kerakligi bo'yicha 1-aniq qadam",
    "2-aniq amaliy harakat yoki qaysi jamg'armaga yo'naltirish",
    "3-muhim e'tibor berish lozim bo'lgan jihat"
  ],
  "recommendedAction": "Tasdiqlash" yoki "Qo'shimcha tekshirish" yoki "Qayta ko'rib chiqish",
  "actionRationale": "Nima uchun ushbu qaror tavsiya etilishi sababi",
  "socialPackage": "Fuqaroga eng mos keladigan asosiy davlat yordami paketi nomi",
  "engine": "Google Gemini AI"
}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini HTTP ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textContent) throw new Error("Empty response from Gemini");

  const parsed = JSON.parse(textContent);
  parsed.engine = "Google Gemini Free AI";
  return parsed;
}

/**
 * Built-in Smart AI Engine
 * Generates tailored, contextual analysis based on government social protection criteria
 */
export function generateBuiltInAnalysis(p, out, cfg) {
  const thr = Number(cfg.threshold) || 1000000;
  const pc = out.pc;
  const poor = out.poor;
  const hasChildren = p.children && p.children > 0;
  const isJobless = p.work === "jobless";
  const hasDebt = p.debt === "yes";
  const isBadHousing = p.housing === "none" || p.housing === "bad" || p.housing === "rent";
  const isDisab = p.disab && p.disab > 0;

  // 1. Calculate Risk Indicators
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

  // 2. Summary generation
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

  // 3. Actionable Admin Advice
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

  // 4. Recommended Action & Package
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
    engine: "Fuqaro AI Smart Copilot (Bepul integratsiya)"
  };
}
