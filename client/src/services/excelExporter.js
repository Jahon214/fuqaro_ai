import { TYPES, fmt } from "../constants.js";

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

const EDU_LABELS = {
  none: "Maktabni tugatmagan",
  school: "O'rta maktab",
  college: "O'rta maxsus / Kollej",
  uni: "Oliy ma'lumotli"
};

const DISAB_LABELS = {
  0: "Yo'q",
  1: "I guruh",
  2: "II guruh",
  3: "III guruh"
};

/**
 * Builds array of rows representing all citizen survey fields
 */
export function buildTableRows(casesList = []) {
  const headers = [
    "№",
    "Ariza ID",
    "Sana va vaqt",
    "Fuqaro F.I.Sh.",
    "Yoshi",
    "Jinsi",
    "Mahalla (MFY)",
    "Murojaat yo'nalishi",
    "Oila a'zolari",
    "18 yoshgacha bolalar",
    "Oylik daromad (so'm)",
    "Kishi boshiga daromad (so'm)",
    "Uy-joy sharoiti",
    "Bandlik holati",
    "Ta'lim darajasi",
    "Nogironlik guruhi",
    "Qarz yoki kredit",
    "Fuqaro so'zi bilan izoh",
    "AI: Kambag'allik xavfi",
    "AI: Qarz tangligi",
    "AI: Ustuvorlik",
    "AI: Tavsiya etilgan paket",
    "AI: MFY xodimi (Hokim yordamchisi) uchun 3 ta qadam"
  ];

  const rows = [headers];

  casesList.forEach((c, idx) => {
    const p = c.p || c;
    const ai = c.aiAnalysis || {};
    const pc = p.income != null && p.members ? Math.round(p.income / p.members) : (c.pc || "");
    const dateStr = c.ts ? new Date(c.ts).toLocaleString("uz-UZ") : new Date().toLocaleDateString("uz-UZ");

    const steps = Array.isArray(ai.adminAdvice)
      ? ai.adminAdvice.map((s, i) => `${i + 1}) ${s}`).join(" | ")
      : "";

    rows.push([
      idx + 1,
      c.id || `Q-${idx + 100}`,
      dateStr,
      p.name || p.ini || "Noma'lum",
      p.age != null ? p.age : "",
      p.gender || "",
      p.mfy || "",
      TYPES[p.type] || p.type || "",
      p.members != null ? p.members : 1,
      p.children != null ? p.children : 0,
      p.income != null ? p.income : 0,
      pc,
      HOUSING_LABELS[p.housing] || p.housing || "",
      WORK_LABELS[p.work] || p.work || "",
      EDU_LABELS[p.edu] || p.edu || "",
      DISAB_LABELS[p.disab] || (p.disab ? `${p.disab}-guruh` : "Yo'q"),
      p.debt === "yes" ? "Bor" : "Yo'q",
      p.notes ? p.notes.replace(/\r?\n/g, " ") : "",
      ai.povertyRisk || "—",
      ai.debtRisk || "—",
      ai.priorityLevel || "—",
      ai.socialPackage || "Davlat yordam paketi",
      steps
    ]);
  });

  return rows;
}

/**
 * Downloads data as a standard UTF-8 CSV with BOM for Microsoft Excel
 */
export function downloadCsv(casesList = [], filename = "xovos_fuqaro_qabullar") {
  const rows = buildTableRows(casesList);
  const csvString = rows
    .map(row => row.map(cell => `"${String(cell == null ? "" : cell).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");

  const blob = new Blob(["\uFEFF" + csvString], { type: "text/csv;charset=utf-8;" });
  triggerBrowserDownload(blob, `${filename}_${getFormattedDate()}.csv`);
}

/**
 * Downloads data as formatted native Microsoft Excel document (.xls)
 */
export function downloadExcel(casesList = [], filename = "xovos_fuqaro_qabullar") {
  const rows = buildTableRows(casesList);

  let tableHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
    <x:Name>Fuqaro So'rovnomalari</x:Name>
    <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet>
    </x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
    <style>
      th { background-color: #059669; color: #ffffff; font-weight: bold; border: 1px solid #d1d5db; padding: 8px; text-align: left; }
      td { border: 1px solid #e5e7eb; padding: 6px; font-size: 11pt; }
      .num { mso-number-format:"\\#\\,\\#\\#0"; }
      .bold { font-weight: bold; }
    </style>
  </head>
  <body>
    <h3>Xovos tumani MFY — Fuqarolar So'rovnomalari va AI Tahlili Jadvali</h3>
    <p>Shakllantirilgan sana: ${new Date().toLocaleString("uz-UZ")} | Jami arizalar: ${casesList.length} ta</p>
    <table>
      <thead>
        <tr>
          ${rows[0].map(h => `<th>${escapeHtml(h)}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${rows.slice(1).map(r => `<tr>${r.map((c, i) => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`).join("")}
      </tbody>
    </table>
  </body>
  </html>`;

  const blob = new Blob(["\uFEFF" + tableHtml], { type: "application/vnd.ms-excel;charset=utf-8" });
  triggerBrowserDownload(blob, `${filename}_${getFormattedDate()}.xls`);
}

function triggerBrowserDownload(blob, fullName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fullName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function getFormattedDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function escapeHtml(text) {
  return String(text == null ? "" : text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
