/**
 * Excel & CSV Exporter for Xovos Fuqaro AI
 * Exports all citizen survey records + AI recommendations.
 */

// Helper to escape CSV cell (RFC 4180 standard)
function escapeCsvCell(cell) {
  if (cell == null) return '""';
  const str = String(cell).replace(/\r\n/g, " ").replace(/\n/g, " ");
  return `"${str.replace(/"/g, '""')}"`;
}

// Helper to extract clean text from section
export function parseSections(text = "") {
  const parts = [];
  let cur = null;
  text.split("\n").forEach(line => {
    const m = line.match(/^#{1,3}\s*(.+)/);
    if (m) {
      cur = { title: m[1].replace(/[*_]/g, "").trim(), body: "" };
      parts.push(cur);
    } else if (cur) {
      cur.body += line + "\n";
    } else if (line.trim()) {
      cur = { title: "Xulosa", body: line + "\n" };
      parts.push(cur);
    }
  });
  return parts;
}

export function extractSection(text = "", searchTitle = "") {
  const secs = parseSections(text);
  const found = secs.find(s => s.title.toLowerCase().includes(searchTitle.toLowerCase()));
  return found ? found.body.trim().replace(/\r?\n/g, " ") : "";
}

/**
 * Downloads universal CSV with UTF-8 BOM (Byte Order Mark)
 * Opens cleanly in Microsoft Excel on Windows with Uzbek letters (o', g', sh, ch) intact.
 */
export function downloadCsv(hist = [], filename = `fuqaro_ai_xovos_${new Date().toISOString().slice(0, 10)}.csv`) {
  const headers = [
    "№",
    "F.I.Sh.",
    "Bosh harflari",
    "Yoshi",
    "Mahalla (Hudud)",
    "Ijtimoiy holati",
    "Bandlik holati",
    "Jismoniy holati",
    "Murojaat masalasi",
    "Qobiliyat va qiziqishlari",
    "Sana va vaqt",
    "AI: Qisqacha xulosa",
    "AI: Xatar va imkoniyatlar",
    "AI: Aniq qadamlar",
    "AI: Muqobil taklif"
  ];

  const rows = [headers];

  hist.forEach((h, idx) => {
    const m = h.meta || {};
    const text = h.text || "";

    const xulosa = extractSection(text, "xulosa") || text.slice(0, 200).replace(/\r?\n/g, " ");
    const xatar = extractSection(text, "xatar");
    const qadamlar = extractSection(text, "qadamlar");
    const muqobil = extractSection(text, "muqobil");

    rows.push([
      idx + 1,
      m.name || m.ini || "—",
      m.ini || "—",
      m.age || "",
      m.mahalla || "",
      m.social || "",
      m.work || "",
      m.phys || "",
      m.goal || "",
      (m.skills || "").replace(/\r?\n/g, " "),
      new Date(m.ts || Date.now()).toLocaleString("uz-UZ"),
      xulosa,
      xatar,
      qadamlar,
      muqobil
    ]);
  });

  const csvContent = rows
    .map(row => row.map(escapeCsvCell).join(","))
    .join("\r\n");

  // UTF-8 Byte Order Mark for Excel (\uFEFF)
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, filename);
}

/**
 * Downloads formatted HTML-based Excel file (.xls)
 * Opens in Microsoft Excel with formatted headers, borders, and colors.
 */
export function downloadExcel(hist = [], filename = `fuqaro_ai_xovos_${new Date().toISOString().slice(0, 10)}.xls`) {
  const headers = [
    "№",
    "F.I.Sh.",
    "Bosh harflari",
    "Yoshi",
    "Mahalla (Hudud)",
    "Ijtimoiy holati",
    "Bandlik holati",
    "Jismoniy holati",
    "Murojaat masalasi",
    "Qobiliyat va qiziqishlari",
    "Sana va vaqt",
    "AI: Qisqacha xulosa",
    "AI: Xatar va imkoniyatlar",
    "AI: Aniq qadamlar",
    "AI: Muqobil taklif"
  ];

  const rowsHtml = hist.map((h, idx) => {
    const m = h.meta || {};
    const text = h.text || "";

    const xulosa = extractSection(text, "xulosa") || text.slice(0, 200);
    const xatar = extractSection(text, "xatar");
    const qadamlar = extractSection(text, "qadamlar");
    const muqobil = extractSection(text, "muqobil");

    const bg = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
    return `
      <tr style="background-color: ${bg};">
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${idx + 1}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px; font-weight: bold;">${escapeHtml(m.name || m.ini || "—")}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${escapeHtml(m.ini || "—")}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${escapeHtml(m.age || "—")}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px;">${escapeHtml(m.mahalla || "—")}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px;">${escapeHtml(m.social || "—")}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px;">${escapeHtml(m.work || "—")}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px;">${escapeHtml(m.phys || "—")}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px;">${escapeHtml(m.goal || "—")}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px;">${escapeHtml(m.skills || "—")}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px; white-space: nowrap;">${new Date(m.ts || Date.now()).toLocaleString("uz-UZ")}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px;">${escapeHtml(xulosa)}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px;">${escapeHtml(xatar)}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px;">${escapeHtml(qadamlar)}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px;">${escapeHtml(muqobil)}</td>
      </tr>
    `;
  }).join("");

  const tableHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8" />
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Fuqaro AI Qabullar</x:Name>
              <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        th { background-color: #0a5f93; color: #ffffff; font-weight: bold; border: 1px solid #084c75; padding: 8px; }
        td { font-family: Segoe UI, Arial, sans-serif; font-size: 11pt; }
      </style>
    </head>
    <body>
      <h2 style="font-family: Arial, sans-serif; color: #0a5f93;">Xovos tumani — Fuqaro AI Qabullar jurnali</h2>
      <p style="font-family: Arial, sans-serif; color: #64748b; font-size: 10pt;">
        Eksport vaqti: ${new Date().toLocaleString("uz-UZ")} | Jami arizalar soni: ${hist.length} ta
      </p>
      <table border="1" style="border-collapse: collapse; font-family: Arial, sans-serif;">
        <thead>
          <tr>
            ${headers.map(h => `<th>${escapeHtml(h)}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(["\uFEFF" + tableHtml], { type: "application/vnd.ms-excel;charset=utf-8" });
  triggerDownload(blob, filename);
}

function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function triggerDownload(blob, filename) {
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
