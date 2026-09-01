/**
 * Malaa Error Hub — Multi-Format Exporter (CSV, Markdown .md, HTML .html)
 * Generates and downloads standard export files with exact required 7 columns and UTF-8 BOM.
 * Column Schema:
 * 1. Error Code
 * 2. Service
 * 3. Source Reference
 * 4. Original AR Message
 * 5. Corrected AR Message
 * 6. Original EN Message
 * 7. Corrected EN Message
 */

var CSV_HEADERS = [
  "Error Code",
  "Service",
  "Source Reference",
  "Original AR Message",
  "Corrected AR Message",
  "Original EN Message",
  "Corrected EN Message"
];

function escapeCsvField(val) {
  if (val === null || val === undefined) return '""';
  var str = String(val);
  if (/[",\n\r]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return '"' + str + '"';
}

// 1. CSV Generation
function generateCsv(records) {
  var rows = [CSV_HEADERS.map(escapeCsvField).join(",")];

  records.forEach(function(r) {
    var row = [
      escapeCsvField(r.errorCode),
      escapeCsvField(r.service),
      escapeCsvField(r.sourceReference),
      escapeCsvField(r.originalArMessage),
      escapeCsvField(r.correctedArMessage),
      escapeCsvField(r.originalEnMessage),
      escapeCsvField(r.correctedEnMessage)
    ];
    rows.push(row.join(","));
  });

  return rows.join("\r\n");
}

// 2. Markdown (.md) Generation
function generateMarkdown(records) {
  var md = [];
  md.push("# Malaa Error Hub — Error Catalog Export");
  md.push("");
  md.push("> Exported Total Records: " + records.length + " | 7 Core Error Copy Columns | UTF-8 Compatible");
  md.push("");
  md.push("| Error Code | Service | Source Reference | Original AR Message | Corrected AR Message | Original EN Message | Corrected EN Message |");
  md.push("| :--- | :--- | :--- | :--- | :--- | :--- | :--- |");

  records.forEach(function(r) {
    var esc = function(str) {
      if (str === null || str === undefined) return "—";
      return String(str).replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
    };
    md.push("| `" + esc(r.errorCode) + "` | " + esc(r.service) + " | `" + esc(r.sourceReference) + "` | " + esc(r.originalArMessage) + " | **" + esc(r.correctedArMessage || "—") + "** | " + esc(r.originalEnMessage) + " | **" + esc(r.correctedEnMessage || "—") + "** |");
  });

  md.push("");
  return md.join("\n");
}

// 3. HTML (.html) Generation
function generateHtml(records) {
  var html = [];
  html.push("<!DOCTYPE html>");
  html.push("<html lang=\"en\">");
  html.push("<head>");
  html.push("  <meta charset=\"UTF-8\">");
  html.push("  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">");
  html.push("  <title>Malaa Error Hub — Exported Catalog</title>");
  html.push("  <link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">");
  html.push("  <link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>");
  html.push("  <link href=\"https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap\" rel=\"stylesheet\">");
  html.push("  <style>");
  html.push("    :root { --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; --font-arabic: 'Cairo', -apple-system, sans-serif; --font-mono: 'JetBrains Mono', monospace; }");
  html.push("    * { box-sizing: border-box; }");
  html.push("    body { font-family: var(--font-sans); margin: 0; padding: 2rem; background: #f8fafc; color: #0f172a; }");
  html.push("    .container { max-width: 1400px; margin: 0 auto; background: #ffffff; padding: 2rem; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }");
  html.push("    .header { margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }");
  html.push("    h1 { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0; }");
  html.push("    .meta { font-size: 0.85rem; color: #64748b; }");
  html.push("    .table-wrap { overflow-x: auto; }");
  html.push("    table { width: 100%; border-collapse: collapse; font-size: 0.875rem; text-align: left; }");
  html.push("    th { background: #f1f5f9; padding: 0.75rem 1rem; border-bottom: 2px solid #cbd5e1; font-weight: 700; color: #334155; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.03em; }");
  html.push("    td { padding: 0.85rem 1rem; border-bottom: 1px solid #e2e8f0; vertical-align: top; }");
  html.push("    tr:hover { background: #f8fafc; }");
  html.push("    .code-badge { font-family: var(--font-mono); font-size: 0.8rem; background: #f1f5f9; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 700; color: #1e293b; display: inline-block; border: 1px solid #e2e8f0; }");
  html.push("    .service-badge { font-size: 0.75rem; background: #e0e7ff; color: #3730a3; padding: 0.2rem 0.55rem; border-radius: 4px; font-weight: 600; display: inline-block; }");
  html.push("    .source-ref { font-family: var(--font-mono); font-size: 0.75rem; color: #64748b; }");
  html.push("    .arabic-cell { font-family: var(--font-arabic); direction: rtl; text-align: right; font-size: 0.95rem; }");
  html.push("    .corrected-cell { color: #047857; font-weight: 600; }");
  html.push("  </style>");
  html.push("</head>");
  html.push("<body>");
  html.push("  <div class=\"container\">");
  html.push("    <div class=\"header\">");
  html.push("      <div>");
  html.push("        <h1>Malaa Error Hub — Exported Error Catalog</h1>");
  html.push("        <div class=\"meta\">7 Core Columns &bull; Total Records: " + records.length + "</div>");
  html.push("      </div>");
  html.push("      <div class=\"meta\">Malaa Fintech Governance</div>");
  html.push("    </div>");
  html.push("    <div class=\"table-wrap\">");
  html.push("      <table>");
  html.push("        <thead>");
  html.push("          <tr>");
  html.push("            <th>Error Code</th>");
  html.push("            <th>Service</th>");
  html.push("            <th>Source Reference</th>");
  html.push("            <th>Original AR Message</th>");
  html.push("            <th>Corrected AR Message</th>");
  html.push("            <th>Original EN Message</th>");
  html.push("            <th>Corrected EN Message</th>");
  html.push("          </tr>");
  html.push("        </thead>");
  html.push("        <tbody>");

  records.forEach(function(r) {
    var esc = function(s) {
      if (s === null || s === undefined) return "—";
      return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    };
    html.push("          <tr>");
    html.push("            <td><span class=\"code-badge\">" + esc(r.errorCode) + "</span></td>");
    html.push("            <td><span class=\"service-badge\">" + esc(r.service) + "</span></td>");
    html.push("            <td><span class=\"source-ref\">" + esc(r.sourceReference) + "</span></td>");
    html.push("            <td class=\"arabic-cell\">" + esc(r.originalArMessage) + "</td>");
    html.push("            <td class=\"arabic-cell corrected-cell\">" + esc(r.correctedArMessage || "—") + "</td>");
    html.push("            <td>" + esc(r.originalEnMessage) + "</td>");
    html.push("            <td class=\"corrected-cell\">" + esc(r.correctedEnMessage || "—") + "</td>");
    html.push("          </tr>");
  });

  html.push("        </tbody>");
  html.push("      </table>");
  html.push("    </div>");
  html.push("  </div>");
  html.push("</body>");
  html.push("</html>");

  return html.join("\n");
}

// 4. Download Dispatchers
function downloadFile(content, mimeType, filename) {
  var blob = new Blob([content], { type: mimeType });
  
  if (window.navigator && window.navigator.msSaveBlob) {
    window.navigator.msSaveBlob(blob, filename);
  } else {
    var link = document.createElement("a");
    if (link.download !== undefined) {
      var url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(function() { URL.revokeObjectURL(url); }, 500);
    }
  }
}

function downloadCsv(records, filename) {
  if (!filename) filename = "malaa-errors-engineering-export.csv";
  var csvContent = generateCsv(records);
  downloadFile("\uFEFF" + csvContent, "text/csv;charset=utf-8;", filename);
}

function downloadMarkdown(records, filename) {
  if (!filename) filename = "malaa-errors-export.md";
  var content = generateMarkdown(records);
  downloadFile("\uFEFF" + content, "text/markdown;charset=utf-8;", filename);
}

function downloadHtml(records, filename) {
  if (!filename) filename = "malaa-errors-export.html";
  var content = generateHtml(records);
  downloadFile("\uFEFF" + content, "text/html;charset=utf-8;", filename);
}

function downloadExport(records, format, baseFilename) {
  if (!baseFilename) baseFilename = "malaa-errors-export";
  if (format === "md" || format === "markdown") {
    downloadMarkdown(records, baseFilename + ".md");
  } else if (format === "html") {
    downloadHtml(records, baseFilename + ".html");
  } else {
    downloadCsv(records, baseFilename + ".csv");
  }
}
