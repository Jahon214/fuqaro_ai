import { generateBuiltInAnalysis } from "../constants.js";

/**
 * Intelligent AI Service:
 * Uses Google Gemini 1.5 Flash if VITE_GEMINI_API_KEY is configured.
 * Automatically falls back to high-accuracy Built-In AI Copilot if no key or on network failure.
 */
export async function getAiAnalysis(formData, evaluation, cfg = { threshold: 1000000 }) {
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || "";

  // 1. If Gemini API Key is provided, call Google Gemini 1.5 Flash
  if (geminiApiKey && geminiApiKey.length > 20) {
    try {
      const prompt = `Siz O'zbekiston Respublikasi Xovos tumani hokim yordamchisi va MFY xodimi uchun maslahatchi sun'iy intellektsiz.
Quyidagi fuqaro so'rovnomasini tahlil qiling va MFY xodimi uchun O'zbekiston qonunchiligi hamda "Mahalla yettiligi" vakolatlari asosida 3 ta aniq amaliy qadam va baholash bering:

FUQARO MA'LUMOTLARI:
- Ism-familiya: ${formData.name || "Noma'lum"}
- Yoshi: ${formData.age || "—"}, Jinsi: ${formData.gender || "—"}
- Mahalla (MFY): ${formData.mfy || "Xovosobod"}
- Murojaat yo'nalishi: ${formData.type || "Umumiy"}
- Oila a'zolari: ${formData.members || 1} kishi (18 yoshgacha bolalar: ${formData.children || 0})
- Oylik daromad: ${formData.income != null ? formData.income + " so'm" : "Ko'rsatilmagan"} (Kishi boshiga: ${evaluation.pc != null ? Math.round(evaluation.pc) + " so'm" : "—"})
- Uy-joy holati: ${formData.housing || "Ko'rsatilmagan"}
- Bandlik: ${formData.work || "Ko'rsatilmagan"}
- Ta'lim: ${formData.edu || "Ko'rsatilmagan"}
- Nogironlik guruhi: ${formData.disab || "Yo'q"}
- Qarz / kredit yuki: ${formData.debt || "Yo'q"}
- Fuqaro so'zi bilan izoh: "${formData.notes || "Izoh yo'q"}"

Qat'iy faqat toza JSON formatida javob bering (hech qanday markdown \`\`\`json belgilarsiz):
{
  "summary": "1-2 jumlali qisqa tahliliy xulosa",
  "povertyRisk": "Yuqori" yoki "O'rta" yoki "Past",
  "debtRisk": "Yuqori" yoki "O'rta" yoki "Past",
  "priorityLevel": "Yuqori" yoki "O'rta" yoki "Past",
  "socialPackage": "Tavsiya etiladigan davlat yordam paketi nomi",
  "adminAdvice": [
    "Hokim yordamchisi / MFY xodimi uchun 1-aniq qadam",
    "2-aniq amaliy qadam",
    "3-aniq amaliy qadam"
  ],
  "recommendedAction": "Tasdiqlash" yoki "Qo'shimcha tekshirish",
  "actionRationale": "Qaror tavsiyasining qisqa asosi"
}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 800
            }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const cleanJson = text.replace(/```json/gi, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleanJson);
        if (parsed.summary && parsed.adminAdvice && Array.isArray(parsed.adminAdvice)) {
          return {
            ...parsed,
            engine: "Google Gemini 1.5 Flash (Rasmiy integratsiya)"
          };
        }
      } else {
        console.warn("[Gemini API] Request not ok:", response.status, response.statusText);
      }
    } catch (err) {
      console.warn("[Gemini API] Fallback to built-in AI due to:", err.message);
    }
  }

  // 2. High-speed Built-in AI Copilot Fallback (100% Free, reliable, offline-ready)
  return generateBuiltInAnalysis(formData, evaluation, cfg);
}
