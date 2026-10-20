import { evaluate } from "./engine.js";
import { generateBuiltInAnalysis } from "./aiService.js";

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
