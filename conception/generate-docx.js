const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  BorderStyle, Table, TableRow, TableCell, WidthType, ShadingType,
} = require("docx");

const mdPath = path.join(__dirname, "JALON 3 - Gregory Sergent - LIVRABLE.md");
const outPath = path.join(__dirname, "JALON 3 - Gregory Sergent - LIVRABLE.docx");

const lines = fs.readFileSync(mdPath, "utf8").replace(/^\uFEFF/, "").split("\n");

function parseInline(text) {
  const runs = [];
  // bold **...**
  const regex = /\*\*(.+?)\*\*|`([^`]+)`|([\s\S]+?)(?=\*\*|`|$)/g;
  let match;
  let last = 0;
  const parts = [];
  const re2 = /\*\*(.+?)\*\*|`([^`]+)`/g;
  let m;
  let cursor = 0;
  while ((m = re2.exec(text)) !== null) {
    if (m.index > cursor) {
      parts.push({ text: text.slice(cursor, m.index), bold: false, code: false });
    }
    if (m[1] !== undefined) parts.push({ text: m[1], bold: true, code: false });
    else if (m[2] !== undefined) parts.push({ text: m[2], bold: false, code: true });
    cursor = m.index + m[0].length;
  }
  if (cursor < text.length) {
    parts.push({ text: text.slice(cursor), bold: false, code: false });
  }
  if (parts.length === 0) parts.push({ text, bold: false, code: false });

  return parts.map(p => new TextRun({
    text: p.text,
    bold: p.bold,
    font: p.code ? "Courier New" : "Calibri",
    size: p.code ? 18 : undefined,
    color: p.code ? "2E4053" : undefined,
  }));
}

const children = [];
let inCode = false;
let codeLines = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Bloc de code indenté (4 espaces)
  if (/^    /.test(line)) {
    codeLines.push(line.slice(4));
    continue;
  } else if (codeLines.length > 0) {
    // flush code block
    codeLines.forEach(cl => {
      children.push(new Paragraph({
        children: [new TextRun({ text: cl, font: "Courier New", size: 18, color: "2E4053" })],
        indent: { left: 720 },
        spacing: { before: 0, after: 0 },
      }));
    });
    codeLines = [];
  }

  // Séparateur ---
  if (/^---+$/.test(line.trim())) {
    children.push(new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "AAAAAA" } },
      spacing: { before: 200, after: 200 },
      children: [],
    }));
    continue;
  }

  // Titres
  if (/^# /.test(line)) {
    children.push(new Paragraph({
      text: line.slice(2),
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    }));
    continue;
  }
  if (/^## /.test(line)) {
    children.push(new Paragraph({
      text: line.slice(3),
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 360, after: 160 },
    }));
    continue;
  }
  if (/^### /.test(line)) {
    children.push(new Paragraph({
      text: line.slice(4),
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 280, after: 120 },
    }));
    continue;
  }

  // Ligne vide
  if (line.trim() === "") {
    children.push(new Paragraph({ children: [], spacing: { before: 80, after: 80 } }));
    continue;
  }

  // Blockquote >
  if (/^> /.test(line)) {
    const content = line.slice(2);
    children.push(new Paragraph({
      children: parseInline(content),
      indent: { left: 720 },
      spacing: { before: 60, after: 60 },
      shading: { type: ShadingType.CLEAR, fill: "F2F3F4" },
    }));
    continue;
  }

  // Liste - **xxx** : ...
  if (/^- /.test(line)) {
    children.push(new Paragraph({
      children: parseInline(line.slice(2)),
      bullet: { level: 0 },
      spacing: { before: 60, after: 60 },
    }));
    continue;
  }

  // Placeholder image ![...](...)  → texte italique
  const imgMatch = line.match(/^!\[(.+?)\]\((.+?)\)/);
  if (imgMatch) {
    children.push(new Paragraph({
      children: [new TextRun({ text: `[ Image : ${imgMatch[1]} — ${imgMatch[2]} ]`, italics: true, color: "888888" })],
      spacing: { before: 200, after: 200 },
    }));
    continue;
  }

  // Paragraphe normal
  children.push(new Paragraph({
    children: parseInline(line),
    spacing: { before: 80, after: 80 },
  }));
}

// flush code restant
if (codeLines.length > 0) {
  codeLines.forEach(cl => {
    children.push(new Paragraph({
      children: [new TextRun({ text: cl, font: "Courier New", size: 18, color: "2E4053" })],
      indent: { left: 720 },
      spacing: { before: 0, after: 0 },
    }));
  });
}

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: "Calibri", size: 22 },
      },
    },
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        run: { bold: true, size: 36, color: "1F3864", font: "Calibri" },
        paragraph: { spacing: { before: 400, after: 200 } },
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        run: { bold: true, size: 28, color: "2E4057", font: "Calibri" },
        paragraph: { spacing: { before: 360, after: 160 } },
      },
      {
        id: "Heading3",
        name: "Heading 3",
        basedOn: "Normal",
        next: "Normal",
        run: { bold: true, size: 24, color: "34495E", font: "Calibri" },
        paragraph: { spacing: { before: 280, after: 120 } },
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          margin: { top: 1440, right: 1080, bottom: 1440, left: 1080 },
        },
      },
      children,
    },
  ],
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outPath, buffer);
  console.log("✅ Fichier généré :", outPath);
});
