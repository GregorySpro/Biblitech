const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  BorderStyle, ShadingType, Table, TableRow, TableCell,
  WidthType, AlignmentType,
} = require("docx");

const mdPath = path.join(__dirname, "JALON 5 - Gregory Sergent - LIVRABLE.md");
const outPath = path.join(__dirname, "JALON 5 - Gregory Sergent - LIVRABLE.docx");

const lines = fs.readFileSync(mdPath, "utf8").replace(/^\uFEFF/, "").split("\n");

function cleanText(text) {
  return text.replace(/\*([^*]+)\*/g, '$1').replace(/_([^_]+)_/g, '$1');
}

function parseInline(rawText) {
  const text = cleanText(rawText);
  const parts = [];
  const re = /\*\*(.+?)\*\*|`([^`]+)`/g;
  let m, cursor = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > cursor) parts.push({ text: text.slice(cursor, m.index), bold: false, code: false });
    if (m[1] !== undefined) parts.push({ text: m[1], bold: true, code: false });
    else if (m[2] !== undefined) parts.push({ text: m[2], bold: false, code: true });
    cursor = m.index + m[0].length;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), bold: false, code: false });
  if (parts.length === 0) parts.push({ text, bold: false, code: false });
  return parts.map(p => new TextRun({
    text: p.text,
    bold: p.bold,
    font: p.code ? "Courier New" : "Calibri",
    size: p.code ? 18 : undefined,
    color: p.code ? "2E4053" : undefined,
  }));
}

function parseTable(tableLines) {
  const rows = tableLines.filter(l => !/^\|[\s\-:| ]+\|$/.test(l.trim()));
  const cells = rows.map(r => {
    const parts = r.split("|");
    return parts.slice(1, parts.length - 1).map(c => c.trim());
  }).filter(row => row.length > 0);

  if (cells.length === 0) return null;
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: cells.map((row, ri) =>
      new TableRow({
        children: row.map(cell =>
          new TableCell({
            shading: ri === 0
              ? { type: ShadingType.CLEAR, fill: "2E4057" }
              : { type: ShadingType.CLEAR, fill: ri % 2 === 0 ? "F8F9FA" : "FFFFFF" },
            children: [new Paragraph({
              children: parseInline(cell).map(r =>
                ri === 0
                  ? new TextRun({ text: r.children ? r.children[0]?.text : r.text, color: "FFFFFF", bold: true, font: "Calibri", size: 20 })
                  : r
              ),
              spacing: { before: 80, after: 80 },
            })],
          })
        ),
      })
    ),
  });
}

const children = [];
let i = 0;
let codeLines = [];
let inCodeBlock = false;

while (i < lines.length) {
  const line = lines[i];

  // Bloc code ```
  if (/^```/.test(line)) {
    if (!inCodeBlock) {
      inCodeBlock = true;
      i++; continue;
    } else {
      inCodeBlock = false;
      if (codeLines.length > 0) {
        // Fond gris pour le bloc de code
        children.push(new Paragraph({ children: [], spacing: { before: 100, after: 0 } }));
        codeLines.forEach(cl => {
          children.push(new Paragraph({
            children: [new TextRun({ text: cl || " ", font: "Courier New", size: 17, color: "2E4053" })],
            indent: { left: 360, right: 360 },
            spacing: { before: 0, after: 0 },
            shading: { type: ShadingType.CLEAR, fill: "F2F4F4" },
          }));
        });
        children.push(new Paragraph({ children: [], spacing: { before: 0, after: 100 } }));
        codeLines = [];
      }
      i++; continue;
    }
  }

  if (inCodeBlock) {
    codeLines.push(line);
    i++; continue;
  }

  // Table markdown
  if (/^\|/.test(line)) {
    const tableLines = [];
    while (i < lines.length && /^\|/.test(lines[i])) {
      tableLines.push(lines[i]);
      i++;
    }
    const table = parseTable(tableLines);
    if (table) {
      children.push(new Paragraph({ children: [], spacing: { before: 160, after: 0 } }));
      children.push(table);
      children.push(new Paragraph({ children: [], spacing: { before: 0, after: 160 } }));
    }
    continue;
  }

  // Séparateur ---
  if (/^---+$/.test(line.trim())) {
    children.push(new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "CCCCCC" } },
      spacing: { before: 200, after: 200 },
      children: [],
    }));
    i++; continue;
  }

  // Titres
  if (/^# /.test(line)) {
    children.push(new Paragraph({ text: line.slice(2), heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } }));
    i++; continue;
  }
  if (/^## /.test(line)) {
    children.push(new Paragraph({ text: line.slice(3), heading: HeadingLevel.HEADING_2, spacing: { before: 360, after: 160 } }));
    i++; continue;
  }
  if (/^### /.test(line)) {
    children.push(new Paragraph({ text: line.slice(4), heading: HeadingLevel.HEADING_3, spacing: { before: 280, after: 120 } }));
    i++; continue;
  }

  // Ligne vide
  if (line.trim() === "") {
    children.push(new Paragraph({ children: [], spacing: { before: 60, after: 60 } }));
    i++; continue;
  }

  // Blockquote >
  if (/^> /.test(line)) {
    children.push(new Paragraph({
      children: parseInline(line.slice(2)),
      indent: { left: 720 },
      spacing: { before: 60, after: 60 },
      shading: { type: ShadingType.CLEAR, fill: "F2F3F4" },
    }));
    i++; continue;
  }

  // Liste à puces niveau 0 : "- "
  if (/^- /.test(line)) {
    children.push(new Paragraph({
      children: parseInline(line.slice(2)),
      bullet: { level: 0 },
      spacing: { before: 60, after: 60 },
    }));
    i++; continue;
  }

  // Liste à puces niveau 1 : "   - "
  if (/^   - /.test(line)) {
    children.push(new Paragraph({
      children: parseInline(line.slice(5)),
      bullet: { level: 1 },
      spacing: { before: 40, after: 40 },
    }));
    i++; continue;
  }

  // Liste numérotée "1. "
  if (/^\d+\. /.test(line)) {
    const text = line.replace(/^\d+\. /, "");
    children.push(new Paragraph({
      children: parseInline(text),
      numbering: { reference: "default-numbering", level: 0 },
      spacing: { before: 60, after: 60 },
    }));
    i++; continue;
  }

  // Image placeholder
  const imgMatch = line.match(/^!\[(.+?)\]\((.+?)\)/);
  if (imgMatch) {
    children.push(new Paragraph({
      children: [new TextRun({ text: `[ Image : ${imgMatch[1]} ]`, italics: true, color: "888888", size: 20 })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 240 },
    }));
    i++; continue;
  }

  // Paragraphe normal
  children.push(new Paragraph({
    children: parseInline(line),
    spacing: { before: 80, after: 80 },
  }));
  i++;
}

const doc = new Document({
  numbering: {
    config: [{
      reference: "default-numbering",
      levels: [{
        level: 0,
        format: "decimal",
        text: "%1.",
        alignment: AlignmentType.START,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } },
      }],
    }],
  },
  styles: {
    default: {
      document: { run: { font: "Calibri", size: 22 } },
    },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal",
        run: { bold: true, size: 36, color: "1F3864", font: "Calibri" },
        paragraph: { spacing: { before: 400, after: 200 } },
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal",
        run: { bold: true, size: 28, color: "2E4057", font: "Calibri" },
        paragraph: { spacing: { before: 360, after: 160 } },
      },
      {
        id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal",
        run: { bold: true, size: 24, color: "34495E", font: "Calibri" },
        paragraph: { spacing: { before: 280, after: 120 } },
      },
    ],
  },
  sections: [{
    properties: {
      page: { margin: { top: 1440, right: 1080, bottom: 1440, left: 1080 } },
    },
    children,
  }],
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outPath, buffer);
  console.log("✅ Fichier généré :", outPath);
}).catch(err => {
  console.error("❌ Erreur :", err.message);
});
