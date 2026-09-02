/**
 * Malaa Error Hub — Multi-Format Exporter (CSV, Markdown .md, HTML .html)
 * Generates and downloads standard export files with exact required 6 columns and UTF-8 BOM.
 * Column Schema (Exact Order):
 * 1. Error Code
 * 2. Service
 * 3. Original AR
 * 4. Corrected AR
 * 5. Original EN
 * 6. Corrected EN
 */

var CSV_HEADERS = [
  "Error Code",
  "Service",
  "Original AR",
  "Corrected AR",
  "Original EN",
  "Corrected EN"
];

function escapeCsvField(val) {
  if (val === null || val === undefined) return '""';
  var str = String(val);
  if (/[",\n\r]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return '"' + str + '"';
}

// 1. CSV Generation (6 Columns)
function generateCsv(records) {
  var rows = [CSV_HEADERS.map(escapeCsvField).join(",")];

  records.forEach(function(r) {
    var row = [
      escapeCsvField(r.errorCode),
      escapeCsvField(r.service),
      escapeCsvField(r.originalArMessage),
      escapeCsvField(r.correctedArMessage),
      escapeCsvField(r.originalEnMessage),
      escapeCsvField(r.correctedEnMessage)
    ];
    rows.push(row.join(","));
  });

  return rows.join("\r\n");
}

// 2. Markdown (.md) Generation (6 Columns)
function generateMarkdown(records) {
  var md = [];
  md.push("# Malaa Error Hub — Error Catalog Export");
  md.push("");
  md.push("> Exported Total Records: " + records.length + " | 6 Core Error Copy Columns | UTF-8 Compatible");
  md.push("");
  md.push("| Error Code | Service | Original AR | Corrected AR | Original EN | Corrected EN |");
  md.push("| :--- | :--- | :--- | :--- | :--- | :--- |");

  records.forEach(function(r) {
    var esc = function(str) {
      if (str === null || str === undefined) return "—";
      return String(str).replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
    };
    md.push("| `" + esc(r.errorCode) + "` | " + esc(r.service) + " | " + esc(r.originalArMessage) + " | **" + esc(r.correctedArMessage || "—") + "** | " + esc(r.originalEnMessage) + " | **" + esc(r.correctedEnMessage || "—") + "** |");
  });

  md.push("");
  return md.join("\n");
}

// 3. HTML (.html) Generation (6 Columns)
function generateHtml(records) {
  var html = [];
  html.push("<!DOCTYPE html>");
  html.push("<html lang=\"en\">");
  html.push("<head>");
  html.push("  <meta charset=\"UTF-8\">");
  html.push("  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">");
  html.push("  <title>Malaa Error Hub — Exported Catalog</title>");
  html.push("  <style>");
  html.push("    * { box-sizing: border-box; }");
  html.push("    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 2rem; background: #f8fafc; color: #0f172a; }");
  html.push("    .container { max-width: 1400px; margin: 0 auto; background: #ffffff; padding: 1.5rem; border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }");
  html.push("    h1 { font-size: 1.35rem; margin: 0 0 0.25rem; color: #0f172a; }");
  html.push("    .meta { font-size: 0.825rem; color: #64748b; margin-bottom: 1.25rem; }");
  html.push("    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }");
  html.push("    th { background: #f1f5f9; padding: 0.65rem 0.75rem; border-bottom: 2px solid #cbd5e1; text-align: left; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; color: #475569; }");
  html.push("    td { padding: 0.65rem 0.75rem; border-bottom: 1px solid #e2e8f0; vertical-align: top; }");
  html.push("    tr:hover { background: #f8fafc; }");
  html.push("    .code-badge { font-family: monospace; font-weight: 700; background: #dbeafe; color: #1e3a8a; padding: 0.15rem 0.45rem; border-radius: 4px; display: inline-block; }");
  html.push("    .arabic { font-family: 'Cairo', Tahoma, Arial, sans-serif; direction: rtl; text-align: right; }");
  html.push("    .corrected { color: #047857; font-weight: 600; }");
  html.push("  </style>");
  html.push("</head>");
  html.push("<body>");
  html.push("  <div class=\"container\">");
  html.push("    <h1>Malaa Error Hub — Engineering Export</h1>");
  html.push("    <div class=\"meta\">Exported Records: " + records.length + " | 6 Core Columns (Error Code, Service, Original AR, Corrected AR, Original EN, Corrected EN)</div>");
  html.push("    <div style=\"overflow-x:auto;\">");
  html.push("      <table>");
  html.push("        <thead>");
  html.push("          <tr>");
  html.push("            <th>Error Code</th>");
  html.push("            <th>Service</th>");
  html.push("            <th class=\"arabic\">Original AR</th>");
  html.push("            <th class=\"arabic\">Corrected AR</th>");
  html.push("            <th>Original EN</th>");
  html.push("            <th>Corrected EN</th>");
  html.push("          </tr>");
  html.push("        </thead>");
  html.push("        <tbody>");
  html.push("");

  records.forEach(function(r) {
    var esc = function(str) {
      if (str === null || str === undefined) return "—";
      return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    };
    html.push("          <tr>");
    html.push("            <td dir=\"ltr\"><span class=\"code-badge\">" + esc(r.errorCode) + "</span></td>");
    html.push("            <td dir=\"ltr\">" + esc(r.service) + "</td>");
    html.push("            <td class=\"arabic\" dir=\"rtl\">" + esc(r.originalArMessage) + "</td>");
    html.push("            <td class=\"arabic corrected\" dir=\"rtl\">" + esc(r.correctedArMessage || "—") + "</td>");
    html.push("            <td dir=\"ltr\">" + esc(r.originalEnMessage) + "</td>");
    html.push("            <td class=\"corrected\" dir=\"ltr\">" + esc(r.correctedEnMessage || "—") + "</td>");
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

// Unified Downloader for all 3 formats
function downloadExport(records, format, baseFilename) {
  if (!baseFilename) baseFilename = "malaa-engineering-export";
  var mimeType = "text/plain;charset=utf-8;";
  var ext = "txt";
  var content = "";

  if (format === "csv") {
    content = "\uFEFF" + generateCsv(records); // Prepend UTF-8 BOM
    mimeType = "text/csv;charset=utf-8;";
    ext = "csv";
  } else if (format === "md") {
    content = "\uFEFF" + generateMarkdown(records);
    mimeType = "text/markdown;charset=utf-8;";
    ext = "md";
  } else if (format === "html") {
    content = "\uFEFF" + generateHtml(records);
    mimeType = "text/html;charset=utf-8;";
    ext = "html";
  } else {
    content = "\uFEFF" + generateCsv(records);
    mimeType = "text/csv;charset=utf-8;";
    ext = "csv";
  }

  var filename = baseFilename + "." + ext;
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
