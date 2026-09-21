const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  BorderStyle, ShadingType, Table, TableRow, TableCell,
  WidthType, AlignmentType, PageBreak, ImageRun,
} = require("docx");

const outPath = path.join(__dirname, "dossier-projet-bibliotech-gregory-sergent.docx");

const jalons = [
  "JALON 1 - Grégory Sergent.md",
  "JALON 2 - Gregory Sergent - LIVRABLE.md",
  "JALON 3 - Gregory Sergent - LIVRABLE.md",
  "JALON 4 - Gregory Sergent - LIVRABLE.md",
  "JALON 5 - Gregory Sergent - LIVRABLE.md",
  "JALON 6 - Gregory Sergent - LIVRABLE.md",
];

function parseInline(rawText) {
  // Strip _italic_ (underscores) — must happen before asterisk processing
  const text = rawText.replace(/_([^_]+)_/g, '$1');
  const parts = [];
  // **bold** must come before *italic* in the alternation so ** is consumed first
  const re = /\*\*(.+?)\*\*|\*([^*]+)\*|`([^`]+)`/g;
  let m, cursor = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > cursor) parts.push({ text: text.slice(cursor, m.index), bold: false, italic: false, code: false });
    if (m[1] !== undefined)      parts.push({ text: m[1], bold: true,  italic: false, code: false });
    else if (m[2] !== undefined) parts.push({ text: m[2], bold: false, italic: true,  code: false });
    else if (m[3] !== undefined) parts.push({ text: m[3], bold: false, italic: false, code: true  });
    cursor = m.index + m[0].length;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), bold: false, italic: false, code: false });
  if (parts.length === 0) parts.push({ text, bold: false, italic: false, code: false });
  return parts.map(p => new TextRun({
    text: p.text,
    bold: p.bold,
    italics: p.italic,
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

function parseMarkdownFile(filePath) {
  const lines = fs.readFileSync(filePath, "utf8").replace(/^﻿/, "").split("\n");
  const children = [];
  let i = 0;
  let codeLines = [];
  let inCodeBlock = false;

  while (i < lines.length) {
    const line = lines[i];

    if (/^```/.test(line)) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        i++; continue;
      } else {
        inCodeBlock = false;
        if (codeLines.length > 0) {
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

    // Skip "## Sommaire" section and its content until the next H1/H2 heading
    if (/^## Sommaire\b/.test(line.trim())) {
      i++;
      while (i < lines.length && !/^#{1,2} /.test(lines[i])) {
        i++;
      }
      continue;
    }

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

    if (/^---+$/.test(line.trim())) {
      children.push(new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "CCCCCC" } },
        spacing: { before: 200, after: 200 },
        children: [],
      }));
      i++; continue;
    }

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
    if (/^#### /.test(line)) {
      children.push(new Paragraph({ text: line.slice(5), heading: HeadingLevel.HEADING_4, spacing: { before: 240, after: 100 } }));
      i++; continue;
    }

    if (line.trim() === "") {
      children.push(new Paragraph({ children: [], spacing: { before: 60, after: 60 } }));
      i++; continue;
    }

    if (/^> /.test(line)) {
      children.push(new Paragraph({
        children: parseInline(line.slice(2)),
        indent: { left: 720 },
        spacing: { before: 60, after: 60 },
        shading: { type: ShadingType.CLEAR, fill: "F2F3F4" },
      }));
      i++; continue;
    }

    if (/^- /.test(line)) {
      children.push(new Paragraph({
        children: parseInline(line.slice(2)),
        bullet: { level: 0 },
        spacing: { before: 60, after: 60 },
      }));
      i++; continue;
    }

    if (/^   - /.test(line)) {
      children.push(new Paragraph({
        children: parseInline(line.slice(5)),
        bullet: { level: 1 },
        spacing: { before: 40, after: 40 },
      }));
      i++; continue;
    }

    if (/^\d+\. /.test(line)) {
      const text = line.replace(/^\d+\. /, "");
      children.push(new Paragraph({
        children: parseInline(text),
        numbering: { reference: "default-numbering", level: 0 },
        spacing: { before: 60, after: 60 },
      }));
      i++; continue;
    }

    const imgMatch = line.match(/^!\[(.+?)\]\((.+?)\)/);
    if (imgMatch) {
      const imgRelPath = imgMatch[2];
      const imgAbsPath = path.resolve(__dirname, imgRelPath);
      if (fs.existsSync(imgAbsPath)) {
        const imgBuffer = fs.readFileSync(imgAbsPath);
        const ext = path.extname(imgAbsPath).toLowerCase().replace('.', '');
        const typeMap = { png: 'png', jpg: 'jpg', jpeg: 'jpg', gif: 'gif' };
        children.push(new Paragraph({
          children: [new ImageRun({
            data: imgBuffer,
            transformation: { width: 600, height: Math.round(600 * 0.7) },
            type: typeMap[ext] || 'png',
          })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 240 },
        }));
      } else {
        children.push(new Paragraph({
          children: [new TextRun({ text: `[ Image : ${imgMatch[1]} ]`, italics: true, color: "888888", size: 20 })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 240 },
        }));
      }
      i++; continue;
    }

    children.push(new Paragraph({
      children: parseInline(line),
      spacing: { before: 80, after: 80 },
    }));
    i++;
  }

  return children;
}

// Extrait les titres H1/H2/H3 d'un fichier markdown (en sautant le Sommaire)
function extractHeadings(filePath) {
  const lines = fs.readFileSync(filePath, "utf8").replace(/^﻿/, "").split("\n");
  const headings = [];
  let inSommaire = false;
  let inCode = false;
  for (const line of lines) {
    if (/^```/.test(line)) { inCode = !inCode; continue; }
    if (inCode) continue;
    if (/^## Sommaire\b/.test(line.trim())) { inSommaire = true; continue; }
    if (inSommaire && /^#{1,2} /.test(line)) { inSommaire = false; }
    if (inSommaire) continue;
    const h1 = line.match(/^# (.+)/);
    const h2 = line.match(/^## (.+)/);
    const h3 = line.match(/^### (.+)/);
    if (h1)      headings.push({ level: 1, text: h1[1].trim() });
    else if (h2) headings.push({ level: 2, text: h2[1].trim() });
    else if (h3) headings.push({ level: 3, text: h3[1].trim() });
  }
  return headings;
}

// Génère la page "Table des matières" à partir des titres de tous les jalons
function buildToc(jalonFiles) {
  const children = [
    new Paragraph({
      children: [new TextRun({ text: "Table des matières", bold: true, size: 36, color: "1F3864", font: "Calibri" })],
      spacing: { before: 400, after: 240 },
    }),
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "2E4057" } },
      spacing: { before: 0, after: 280 },
      children: [],
    }),
  ];

  for (const jalon of jalonFiles) {
    const filePath = path.join(__dirname, jalon);
    if (!fs.existsSync(filePath)) continue;
    const headings = extractHeadings(filePath);
    for (const h of headings) {
      const indent = (h.level - 1) * 440;
      children.push(new Paragraph({
        children: [new TextRun({
          text: h.text,
          bold: h.level === 1,
          size: h.level === 1 ? 24 : h.level === 2 ? 22 : 20,
          color: h.level === 1 ? "1F3864" : h.level === 2 ? "2E4057" : "5D6D7E",
          font: "Calibri",
        })],
        indent: { left: indent },
        spacing: {
          before: h.level === 1 ? 180 : h.level === 2 ? 80 : 40,
          after: h.level === 1 ? 60 : 30,
        },
      }));
    }
    // Fine separator between jalons
    children.push(new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: "DDDDDD" } },
      spacing: { before: 80, after: 80 },
      children: [],
    }));
  }

  children.push(new Paragraph({ children: [new PageBreak()] }));
  return children;
}

// Page de couverture
const coverChildren = [
  new Paragraph({ children: [], spacing: { before: 1440, after: 0 } }),
  new Paragraph({
    children: [new TextRun({ text: "DOSSIER DE PROJET", bold: true, size: 52, color: "1F3864", font: "Calibri" })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 200 },
  }),
  new Paragraph({
    children: [new TextRun({ text: "BiblioTech", bold: true, size: 72, color: "2E4057", font: "Calibri" })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 400 },
  }),
  new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "2E4057" } },
    spacing: { before: 0, after: 400 },
    children: [],
  }),
  new Paragraph({
    children: [new TextRun({ text: "Système d'Information de Gestion de Bibliothèque (SIGB)", size: 28, color: "34495E", font: "Calibri", italics: true })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 600 },
  }),
  new Paragraph({
    children: [new TextRun({ text: "Auteur : ", bold: true, size: 24, font: "Calibri" }), new TextRun({ text: "Grégory Sergent", size: 24, font: "Calibri" })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 120 },
  }),
  new Paragraph({
    children: [new TextRun({ text: "Formation : ", bold: true, size: 24, font: "Calibri" }), new TextRun({ text: "CDA – Concepteur Développeur d'Applications", size: 24, font: "Calibri" })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 120 },
  }),
  new Paragraph({
    children: [new TextRun({ text: "Organisme : ", bold: true, size: 24, font: "Calibri" }), new TextRun({ text: "IPSSI Grande École d'Informatique", size: 24, font: "Calibri" })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 120 },
  }),
  new Paragraph({
    children: [new TextRun({ text: "Période : ", bold: true, size: 24, font: "Calibri" }), new TextRun({ text: "Janvier → Juillet 2026", size: 24, font: "Calibri" })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 600 },
  }),
  new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "CCCCCC" } },
    spacing: { before: 0, after: 400 },
    children: [],
  }),
  new Paragraph({
    children: [new TextRun({ text: "Stack technique : Symfony 7.3 + PHP 8.3 + React 19 + Vite + TypeScript + PostgreSQL 16", size: 20, color: "666666", font: "Calibri", italics: true })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 120 },
  }),
  new Paragraph({
    children: [new TextRun({ text: "Déploiement : Render (backend + frontend) + Supabase (base de données)", size: 20, color: "666666", font: "Calibri", italics: true })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 120 },
  }),
  new Paragraph({
    children: [new TextRun({ text: "CI/CD : GitHub Actions — 3 jobs (PHPUnit + TypeScript + Docker Build)", size: 20, color: "666666", font: "Calibri", italics: true })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 120 },
  }),
  // Saut de page après la couverture
  new Paragraph({
    children: [new PageBreak()],
  }),
];

// Construire le contenu de tous les jalons
const allChildren = [...coverChildren, ...buildToc(jalons)];

for (let idx = 0; idx < jalons.length; idx++) {
  const jalon = jalons[idx];
  const filePath = path.join(__dirname, jalon);
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  Fichier introuvable : ${jalon}`);
    continue;
  }
  console.log(`📄 Traitement : ${jalon}`);
  const jalon_children = parseMarkdownFile(filePath);
  allChildren.push(...jalon_children);

  // Saut de page entre jalons (sauf après le dernier)
  if (idx < jalons.length - 1) {
    allChildren.push(
      new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: "2E4057" } },
        spacing: { before: 400, after: 0 },
        children: [],
      }),
      new Paragraph({ children: [new PageBreak()] })
    );
  }
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
      {
        id: "Heading4", name: "Heading 4", basedOn: "Normal", next: "Normal",
        run: { bold: true, size: 22, color: "5D6D7E", font: "Calibri" },
        paragraph: { spacing: { before: 240, after: 100 } },
      },
    ],
  },
  sections: [{
    properties: {
      page: { margin: { top: 1440, right: 1080, bottom: 1440, left: 1080 } },
    },
    children: allChildren,
  }],
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outPath, buffer);
  console.log("\n✅ Dossier final généré :", outPath);
}).catch(err => {
  console.error("❌ Erreur :", err.message);
  process.exit(1);
});
