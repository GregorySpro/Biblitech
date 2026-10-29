/**
 * BiblioTech – Dossier de projet complet
 * Génère dossier-projet-bibliotech-gregory-sergent.docx
 * Contenu écrit directement (aucun parsing markdown)
 */

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, PageNumber,
  AlignmentType, BorderStyle, WidthType, ShadingType,
  PageBreak, convertMillimetersToTwip, ImageRun,
} = require("docx");
const fs = require("fs");

// ─── COULEURS & CONSTANTES ────────────────────────────────────────────────────
const C = {
  DARK_BLUE:   "1E364A",
  MED_BLUE:    "2E5C8A",
  LIGHT_BLUE:  "4A8EC2",
  TEAL:        "007E8C",
  TEAL_LIGHT:  "D0EEF2",
  ACCENT_BG:   "E8F3FB",
  ACCENT_DARK: "C2DCF0",
  ROW_ALT:     "EEF6FF",
  CODE_BG:     "F0F4F8",
  CODE_BORDER: "C8D8E8",
  TEXT:        "1A2733",
  TEXT_LIGHT:  "5A6B7A",
  WHITE:       "FFFFFF",
  BORDER:      "C8D8E4",
  BORDER_DARK: "8AAABB",
  RED:         "B91C1C",
  RED_LIGHT:   "FECDCD",
  GREEN:       "15803D",
  GREEN_BG:    "DCFCE7",
  ORANGE:      "B45309",
  ORANGE_BG:   "FEF3C7",
};

const FONT_MAIN  = "Calibri";
const FONT_CODE  = "Consolas";
const FONT_TITLE = "Calibri Light";

const mm = convertMillimetersToTwip;

// ─── BORDURES UTILITAIRES ─────────────────────────────────────────────────────
const noB  = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noB, bottom: noB, left: noB, right: noB, insideH: noB, insideV: noB };

function thinBorder(color = C.BORDER) {
  return { style: BorderStyle.SINGLE, size: 2, color };
}

// ─── HEADER & FOOTER ──────────────────────────────────────────────────────────

function createHeader() {
  return new Header({
    children: [new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.DARK_BLUE, space: 4 } },
      children: [
        new TextRun({ text: "BiblioTech", bold: true, size: 19, color: C.DARK_BLUE, font: FONT_MAIN }),
        new TextRun({ text: "  —  Dossier de Projet Complet  ·  CDA IPSSI 2026", size: 19, color: C.TEXT_LIGHT, font: FONT_MAIN }),
      ],
      spacing: { after: 100 },
    })],
  });
}

function createFirstPageHeader() {
  return new Header({ children: [new Paragraph({ children: [new TextRun({ text: "" })] })] });
}

function createFooter() {
  return new Footer({
    children: [new Paragraph({
      border: { top: { style: BorderStyle.SINGLE, size: 4, color: C.BORDER, space: 4 } },
      children: [
        new TextRun({ text: "Grégory Sergent  ·  g.sergent@ecole-ipssi.net", size: 17, color: C.TEXT_LIGHT, font: FONT_MAIN }),
        new TextRun({ text: "\t\tPage ", size: 17, color: C.TEXT_LIGHT, font: FONT_MAIN }),
        new TextRun({ children: [PageNumber.CURRENT], bold: true, size: 17, color: C.DARK_BLUE, font: FONT_MAIN }),
        new TextRun({ text: " / ", size: 17, color: C.TEXT_LIGHT, font: FONT_MAIN }),
        new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 17, color: C.TEXT_LIGHT, font: FONT_MAIN }),
      ],
      spacing: { before: 100 },
      tabStops: [{ type: "right", position: mm(165) }],
    })],
  });
}

function createFirstPageFooter() {
  return new Footer({ children: [new Paragraph({ children: [new TextRun({ text: "" })] })] });
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function br() {
  return new Paragraph({ children: [new TextRun({ text: "" })], spacing: { before: 0, after: 80 } });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

// h1 — bande pleine largeur : fond bleu marine + liseré teal en bas
function h1(text) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noBorders,
    rows: [
      new TableRow({
        children: [new TableCell({
          shading: { type: ShadingType.SOLID, color: C.DARK_BLUE },
          borders: noBorders,
          margins: { top: mm(5), bottom: mm(5), left: mm(8), right: mm(8) },
          children: [new Paragraph({
            children: [new TextRun({ text, bold: true, size: 32, color: C.WHITE, font: FONT_TITLE })],
            spacing: { before: 0, after: 0 },
          })],
        })],
      }),
      new TableRow({
        height: { value: mm(2.2), rule: "exact" },
        children: [new TableCell({
          shading: { type: ShadingType.SOLID, color: C.TEAL },
          borders: noBorders,
          children: [new Paragraph({ children: [new TextRun({ text: " " })] })],
        })],
      }),
    ],
    margins: { top: mm(10) },
  });
}

// h2 — fond accent + filet épais à gauche
function h2(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 27, color: C.MED_BLUE, font: FONT_TITLE })],
    spacing: { before: 420, after: 140, line: 276, lineRule: "auto" },
    shading: { type: ShadingType.SOLID, color: C.ACCENT_BG },
    border: { left: { style: BorderStyle.THICK, size: 18, color: C.TEAL, space: 0 } },
    indent: { left: mm(5), right: mm(3) },
  });
}

// h3 — icône ▸ + texte teal
function h3(text) {
  return new Paragraph({
    children: [
      new TextRun({ text: "▸  ", size: 22, color: C.TEAL, font: FONT_MAIN, bold: true }),
      new TextRun({ text, bold: true, size: 22, color: C.TEAL, font: FONT_MAIN }),
    ],
    spacing: { before: 300, after: 100, line: 276, lineRule: "auto" },
    indent: { left: mm(4) },
  });
}

function h4(text) {
  return new Paragraph({
    children: [
      new TextRun({ text: "◆  ", size: 20, color: C.LIGHT_BLUE, font: FONT_MAIN }),
      new TextRun({ text, bold: true, size: 20, color: C.TEXT, font: FONT_MAIN }),
    ],
    spacing: { before: 180, after: 70 },
    indent: { left: mm(5) },
  });
}

function p(text, { bold = false, italic = false, color = C.TEXT, size = 22 } = {}) {
  return new Paragraph({
    children: [new TextRun({ text, bold, italic, color, size, font: FONT_MAIN })],
    spacing: { before: 80, after: 100, line: 285, lineRule: "auto" },
  });
}

function pRuns(runs) {
  return new Paragraph({
    children: runs.map(r =>
      typeof r === "string"
        ? new TextRun({ text: r, size: 22, color: C.TEXT, font: FONT_MAIN })
        : new TextRun({ size: 22, color: C.TEXT, font: FONT_MAIN, ...r })
    ),
    spacing: { before: 80, after: 100, line: 285, lineRule: "auto" },
  });
}

function bullet(text, level = 0) {
  const icon = level === 0 ? "▸" : "◦";
  return new Paragraph({
    children: [
      new TextRun({ text: `${icon}  `, size: 22, color: C.TEAL, font: FONT_MAIN }),
      new TextRun({ text, size: 22, color: C.TEXT, font: FONT_MAIN }),
    ],
    spacing: { before: 80, after: 80, line: 265, lineRule: "auto" },
    indent: { left: mm(8 + level * 5) },
  });
}

// Blocs de code : fond gris perle + filet gauche teal + police Consolas
function codeBlock(lines) {
  return lines.map((l, i) => {
    const isFirst = i === 0;
    const isLast  = i === lines.length - 1;
    return new Paragraph({
      children: [new TextRun({ text: l === "" ? " " : l, size: 18, font: FONT_CODE, color: C.TEXT })],
      shading: { type: ShadingType.SOLID, color: C.CODE_BG },
      border: {
        left:   { style: BorderStyle.THICK,  size: 14, color: C.TEAL,        space: 0 },
        right:  { style: BorderStyle.SINGLE, size: 2,  color: C.CODE_BORDER, space: 0 },
        top:    isFirst ? { style: BorderStyle.SINGLE, size: 2, color: C.CODE_BORDER } : noB,
        bottom: isLast  ? { style: BorderStyle.SINGLE, size: 2, color: C.CODE_BORDER } : noB,
      },
      spacing: { before: isFirst ? 100 : 0, after: isLast ? 100 : 0, line: 245, lineRule: "auto" },
      indent: { left: mm(6), right: mm(2) },
    });
  });
}

// ─── CELLULES DE TABLEAUX ─────────────────────────────────────────────────────

const CELL_MARGINS = {
  top:    mm(2.5),
  bottom: mm(2.5),
  left:   mm(3.5),
  right:  mm(3.5),
};

function cellBorders(headerBottom = false) {
  return {
    top:    noB,
    left:   noB,
    right:  noB,
    bottom: headerBottom
      ? { style: BorderStyle.SINGLE, size: 4, color: C.LIGHT_BLUE }
      : thinBorder(C.BORDER),
  };
}

function thCell(text, bgColor = C.DARK_BLUE, width) {
  return new TableCell({
    shading: { type: ShadingType.SOLID, color: bgColor },
    borders: cellBorders(true),
    margins: CELL_MARGINS,
    ...(width ? { width: { size: width, type: WidthType.DXA } } : {}),
    children: [new Paragraph({
      children: [new TextRun({ text, bold: true, size: 20, color: C.WHITE, font: FONT_MAIN })],
      spacing: { before: 0, after: 0 },
    })],
  });
}

function tdCell(text, bgColor = C.WHITE, width) {
  return new TableCell({
    shading: { type: ShadingType.SOLID, color: bgColor },
    borders: cellBorders(),
    margins: CELL_MARGINS,
    ...(width ? { width: { size: width, type: WidthType.DXA } } : {}),
    children: [new Paragraph({
      children: [new TextRun({ text, size: 20, color: C.TEXT, font: FONT_MAIN })],
      spacing: { before: 0, after: 0 },
    })],
  });
}

function tdCellRuns(runs, bgColor = C.WHITE) {
  return new TableCell({
    shading: { type: ShadingType.SOLID, color: bgColor },
    borders: cellBorders(),
    margins: CELL_MARGINS,
    children: [new Paragraph({
      children: runs.map(r =>
        typeof r === "string"
          ? new TextRun({ text: r, size: 19, color: C.TEXT, font: FONT_MAIN })
          : new TextRun({ size: 19, color: C.TEXT, font: FONT_MAIN, ...r })
      ),
      spacing: { before: 0, after: 0 },
    })],
  });
}

function makeTable(headers, rows, colWidths) {
  const headerRow = new TableRow({
    children: headers.map((h, i) => thCell(h, C.DARK_BLUE, colWidths?.[i])),
    tableHeader: true,
  });
  const dataRows = rows.map((row, ri) => new TableRow({
    children: row.map((cell, ci) => {
      const bg = ri % 2 === 1 ? C.ROW_ALT : C.WHITE;
      if (typeof cell === "object" && cell.runs) return tdCellRuns(cell.runs, bg);
      return tdCell(String(cell), bg, colWidths?.[ci]);
    }),
  }));
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top:     { style: BorderStyle.SINGLE, size: 6, color: C.DARK_BLUE },
      bottom:  { style: BorderStyle.SINGLE, size: 3, color: C.BORDER_DARK },
      left:    noB,
      right:   noB,
      insideH: thinBorder(C.BORDER),
      insideV: { style: BorderStyle.SINGLE, size: 2, color: C.BORDER },
    },
    rows: [headerRow, ...dataRows],
    margins: { top: mm(1) },
  });
}

// Image réelle depuis le dossier screens/
function screenImage(filename, widthPx = 600) {
  const imgPath = `${__dirname}/screens/${filename}`;
  if (!fs.existsSync(imgPath)) return imagePlaceholder(`[IMAGE MANQUANTE] ${filename}`);
  const data = fs.readFileSync(imgPath);
  // Calcul hauteur proportionnelle via dimensions réelles si possible
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 80, after: 80 },
    children: [new ImageRun({ data, transformation: { width: widthPx, height: Math.round(widthPx * 0.6) }, type: "png" })],
  });
}

// Placeholder — encadré rouge bien visible avec icône + hauteur indicative
function imagePlaceholder(label) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noBorders,
    rows: [new TableRow({
      height: { value: mm(38), rule: "atLeast" },
      children: [new TableCell({
        shading: { type: ShadingType.SOLID, color: "FFF6F6" },
        borders: {
          top:    { style: BorderStyle.DASHED, size: 4, color: C.RED_LIGHT },
          bottom: { style: BorderStyle.DASHED, size: 4, color: C.RED_LIGHT },
          left:   { style: BorderStyle.THICK,  size: 12, color: C.RED, space: 0 },
          right:  { style: BorderStyle.DASHED, size: 4, color: C.RED_LIGHT },
        },
        margins: { top: mm(6), bottom: mm(6), left: mm(6), right: mm(6) },
        verticalAlign: "center",
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "🖼️", size: 48, font: FONT_MAIN })],
            spacing: { before: 0, after: 80 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: label, bold: true, color: C.RED, size: 22, font: FONT_MAIN })],
            spacing: { before: 0, after: 0 },
          }),
        ],
      })],
    })],
    margins: { top: mm(8), bottom: mm(4) },
  });
}

function placeholderCaption(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text, size: 18, italic: true, color: C.TEXT_LIGHT, font: FONT_MAIN })],
    spacing: { before: 60, after: 220 },
  });
}

// infoBox — encadré callout bleu pour points clés
function infoBox(text, { color = C.MED_BLUE, bg = C.ACCENT_BG, border = C.LIGHT_BLUE, icon = "ℹ" } = {}) {
  return new Paragraph({
    children: [
      new TextRun({ text: `${icon}  `, size: 21, color, font: FONT_MAIN, bold: true }),
      new TextRun({ text, size: 21, color: C.TEXT, font: FONT_MAIN }),
    ],
    shading: { type: ShadingType.SOLID, color: bg },
    border: {
      top:    { style: BorderStyle.SINGLE, size: 2, color: border },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: border },
      left:   { style: BorderStyle.THICK,  size: 12, color, space: 0 },
      right:  { style: BorderStyle.SINGLE, size: 2, color: border },
    },
    spacing: { before: 140, after: 140, line: 276, lineRule: "auto" },
    indent: { left: mm(5), right: mm(4) },
  });
}

// warnBox — encadré orange pour les avertissements
function warnBox(text) {
  return infoBox(text, { color: C.ORANGE, bg: C.ORANGE_BG, border: "F6B73A", icon: "⚠" });
}

// successBox — encadré vert pour les validations
function successBox(text) {
  return infoBox(text, { color: C.GREEN, bg: C.GREEN_BG, border: "6EE7A0", icon: "✔" });
}

// ─── SECTIONS DU DOCUMENT ─────────────────────────────────────────────────────

// PAGE DE COUVERTURE
function coverPage() {
  // Bannière bleue marine en haut
  const topBanner = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noBorders,
    rows: [
      new TableRow({
        children: [new TableCell({
          shading: { type: ShadingType.SOLID, color: C.DARK_BLUE },
          borders: noBorders,
          margins: { top: mm(20), bottom: mm(16), left: mm(16), right: mm(16) },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "BIBLIOTECH", bold: true, size: 88, color: C.WHITE, font: FONT_TITLE })],
              spacing: { before: 0, after: 120 },
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "Système d'Information de Gestion de Bibliothèques", size: 26, color: "8EC8DC", font: FONT_TITLE, italic: true })],
              spacing: { before: 0, after: 100 },
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: "Symfony 7.3", size: 19, color: "5A9FC0", font: FONT_MAIN }),
                new TextRun({ text: "  ·  ", size: 19, color: "3A6A80", font: FONT_MAIN }),
                new TextRun({ text: "React 19", size: 19, color: "5A9FC0", font: FONT_MAIN }),
                new TextRun({ text: "  ·  ", size: 19, color: "3A6A80", font: FONT_MAIN }),
                new TextRun({ text: "PostgreSQL 16", size: 19, color: "5A9FC0", font: FONT_MAIN }),
                new TextRun({ text: "  ·  ", size: 19, color: "3A6A80", font: FONT_MAIN }),
                new TextRun({ text: "TypeScript", size: 19, color: "5A9FC0", font: FONT_MAIN }),
              ],
              spacing: { before: 0, after: 0 },
            }),
          ],
        })],
      }),
      new TableRow({
        height: { value: mm(3), rule: "exact" },
        children: [new TableCell({
          shading: { type: ShadingType.SOLID, color: C.TEAL },
          borders: noBorders,
          children: [new Paragraph({ children: [new TextRun({ text: " " })] })],
        })],
      }),
    ],
  });

  // (liseré teal intégré dans la bannière — variable conservée pour ne pas casser le return)
  const tealStripe = new Paragraph({ children: [new TextRun({ text: "" })], spacing: { before: 0, after: 0 } });

  // Tableau d'informations centré
  const infoTable = new Table({
    width: { size: 72, type: WidthType.PERCENTAGE },
    alignment: AlignmentType.CENTER,
    borders: {
      top:    { style: BorderStyle.SINGLE, size: 4, color: C.DARK_BLUE },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: C.DARK_BLUE },
      left:   noB,
      right:  noB,
      insideH: thinBorder(C.BORDER),
      insideV: noB,
    },
    rows: [
      ["Auteur",        "Grégory Sergent"],
      ["Formation",     "CDA – Concepteur Développeur d'Applications"],
      ["Établissement", "IPSSI Grande École d'Informatique"],
      ["Période",       "Janvier → Juillet 2026"],
      ["Version",       "2.0 — Document consolidé (Jalons 1–6)"],
      ["Technologies",  "Symfony 7.3  ·  PHP 8.3  ·  React 19  ·  PostgreSQL 16"],
    ].map((row, i) => new TableRow({
      children: [
        new TableCell({
          shading: { type: ShadingType.SOLID, color: i % 2 === 0 ? C.DARK_BLUE : C.MED_BLUE },
          borders: cellBorders(false),
          margins: { top: mm(3), bottom: mm(3), left: mm(6), right: mm(4) },
          width: { size: 3800, type: WidthType.DXA },
          children: [new Paragraph({
            children: [new TextRun({ text: row[0], bold: true, size: 20, color: C.WHITE, font: FONT_MAIN })],
            spacing: { before: 0, after: 0 },
          })],
        }),
        new TableCell({
          shading: { type: ShadingType.SOLID, color: i % 2 === 0 ? "F7FBFE" : C.ACCENT_BG },
          borders: cellBorders(false),
          margins: { top: mm(3), bottom: mm(3), left: mm(5), right: mm(5) },
          children: [new Paragraph({
            children: [new TextRun({ text: row[1], size: 20, color: C.TEXT, font: FONT_MAIN })],
            spacing: { before: 0, after: 0 },
          })],
        }),
      ],
    })),
  });

  return [
    topBanner,
    tealStripe,
    new Paragraph({ children: [new TextRun({ text: "" })], spacing: { before: 520, after: 0 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "Dossier de Projet Complet", bold: true, size: 36, color: C.DARK_BLUE, font: FONT_TITLE })],
      spacing: { before: 0, after: 100 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "Jalons 1 à 6  ·  Concepteur Développeur d'Applications  ·  IPSSI 2026", size: 22, color: C.TEAL, font: FONT_TITLE, italic: true })],
      spacing: { before: 0, after: 500 },
    }),
    infoTable,
    new Paragraph({ children: [new TextRun({ text: "" })], spacing: { before: 580, after: 0 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "Grégory Sergent", bold: true, size: 20, color: C.DARK_BLUE, font: FONT_MAIN }),
        new TextRun({ text: "  ·  g.sergent@ecole-ipssi.net", size: 19, color: C.TEXT_LIGHT, font: FONT_MAIN }),
      ],
      spacing: { before: 0, after: 0 },
    }),
    pageBreak(),
  ];
}

// SECTION CONTEXTUELLE (Jalon 1)
function sectionContexte() {
  return [
    h1("Partie 1 — Contexte & Cahier des Charges"),
    br(),
    h2("1.1  Contexte métier"),
    p("Le secteur des bibliothèques municipales et associatives en France fait face à un défi de modernisation. Si les grandes structures disposent de progiciels complexes (SIGB), de nombreuses petites et moyennes bibliothèques utilisent encore des méthodes manuelles ou des outils obsolètes pour le suivi de leur catalogue et de leurs usagers."),
    p("BiblioTech est une application SaaS (Software as a Service) multi-tenant conçue pour simplifier la transition numérique de ces établissements. Le problème central à résoudre est la perte d'informations liée au suivi manuel et le manque de visibilité sur l'état du stock en temps réel."),
    br(),
    h2("1.2  Commanditaire fictif"),
    p("Le commanditaire, la structure et les personnes mentionnées ci-dessous sont entièrement fictifs. Ils ont été créés dans le cadre de cet exercice pédagogique.", { italic: true }),
    makeTable(
      ["Champ", "Information"],
      [
        ["Nom",             "L'IPSSIthèque (fictif)"],
        ["Type",            "Bibliothèque associative — Aubusson, Creuse (23)"],
        ["Contact projet",  "Mme Isabelle Perrin, directrice de la bibliothèque (fictif)"],
        ["Situation",       "Gestion des prêts sur registres papier et tableur Excel non partagé"],
        ["Besoin exprimé",  "Outil numérique simple, installable, pour centraliser catalogue, adhérents et prêts"],
      ],
      [2500, 7000]
    ),
    br(),
    h2("1.3  Objectifs SMART"),
    bullet("Digitaliser 100 % des flux d'emprunts — Supprimer les registres papier au profit d'une base centralisée"),
    bullet("Automatiser l'inventaire — Réduire de 80 % le temps de saisie d'un nouveau livre grâce à l'ISBN"),
    bullet("Optimiser le suivi des retards — Identifier instantanément les livres non rendus pour faciliter les relances"),
    bullet("Assurer la conformité RGPD avant la mise en production — Registre de traitement, droit à l'oubli, Argon2id"),
    bullet("Assurer la qualité logicielle — Pipeline CI/CD avec 100 % des tests passants à chaque build"),
    br(),
    h2("1.4  Périmètre fonctionnel"),
    h3("1.4.1  Fonctionnalités incluses"),
    makeTable(
      ["#", "Fonctionnalité", "Détail"],
      [
        ["F01", "Authentification sécurisée",     "JWT RS256 4096-bit, Refresh Token rotation 30j, Argon2id"],
        ["F02", "Gestion catalogue (CRUD)",        "Livres, exemplaires, ISBN → récupération automatique Google Books"],
        ["F03", "Gestion adhérents",               "Création/modification/suppression de comptes, RBAC 4 rôles"],
        ["F04", "Module prêts/retours",            "Enregistrement, date de retour calculée, état exemplaire auto-mis à jour"],
        ["F05", "Tableau de bord",                 "Statistiques, livres en retard, retards par adhérent"],
        ["F06", "Multi-tenant",                    "Isolation totale par bibliotheque_id — plusieurs bibliothèques indépendantes"],
        ["F07", "CGU versionnées",                 "Versionnement, préavis 15 jours, acceptation obligatoire avant usage"],
        ["F08", "Demandes de migration",           "Adhérent peut demander un transfert vers une autre bibliothèque"],
        ["F09", "Prêts perdus",                    "Signalement d'un exemplaire perdu, état PERDU persistant"],
        ["F10", "Premier login",                   "Changement de mot de passe obligatoire + acceptation CGU au premier accès"],
      ],
      [500, 2800, 6200]
    ),
    br(),
    h3("1.4.2  Hors périmètre"),
    bullet("Réservation en ligne par les usagers — l'application est strictement interne ou à accès limité"),
    bullet("Application mobile native — l'accès se fait via navigateur (frontend React)"),
    bullet("Paiement de pénalités — hors scope de cette version"),
    br(),
    h2("1.5  Exigences non fonctionnelles"),
    makeTable(
      ["Catégorie", "Exigence", "Critère de mesure"],
      [
        ["Performance",     "Ajout d'un livre via ISBN",           "≤ 5 secondes (appel API Google Books + affichage formulaire pré-rempli)"],
        ["Sécurité",        "OWASP Top 10",                        "Injections SQL bloquées (Doctrine ORM), XSS (React), CSRF (JWT stateless), Argon2id"],
        ["Conformité",      "RGPD",                                "Registre de traitement documenté, droit à l'oubli implémenté avant mise en production"],
        ["Maintenabilité",  "Couverture de tests",                 "Pipeline CI/CD avec 100 % des tests passants à chaque build"],
        ["Disponibilité",   "Uptime production",                   "≥ 99 % — déploiement Render (backend) + Supabase (BDD)"],
        ["Isolation",       "Multi-tenant strict",                 "Filtrage systematique par bibliotheque_id sur tous les endpoints"],
      ],
      [1800, 2500, 5200]
    ),
    br(),
    h2("1.6  Planning et jalons"),
    makeTable(
      ["Jalon", "Mois", "Livrable"],
      [
        ["Jalon 1", "Janvier 2026",      "Cahier des charges fonctionnel"],
        ["Jalon 2", "Février 2026",      "Méthodologie Agile & conception UI/UX (Figma)"],
        ["Jalon 3", "Mars 2026",         "Modélisation de la base de données (MCD, MLD, MPD)"],
        ["Jalon 4", "Avril 2026",        "Conception UML & architecture technique (use cases, séquences, classes)"],
        ["Jalon 5", "Mai – Juin 2026",   "Développement complet, sécurité, tests, CI/CD (version bêta)"],
        ["Jalon 6", "Juillet 2026",      "Audit sécurité, déploiement production, RGPD, livrable final"],
      ],
      [1500, 2500, 5500]
    ),
    h2("1.7  Risques identifiés"),
    makeTable(
      ["Risque", "Probabilité", "Impact", "Mitigation"],
      [
        ["Sous-estimation du périmètre backend",        "Moyenne",  "Élevé",  "Découpage en sprints Agile avec revue hebdomadaire"],
        ["Complexité multi-tenant",                     "Élevée",   "Élevé",  "Filtre bibliotheque_id systématique dès la couche Repository"],
        ["Vulnérabilités de sécurité",                  "Faible",   "Élevé",  "Audit OWASP au Jalon 5 + correctifs Jalon 6"],
        ["Conformité RGPD insuffisante",                "Faible",   "Élevé",  "Registre de traitement, droit à l'oubli, pseudonymisation"],
        ["Indisponibilité services tiers (Google Books)","Faible",  "Moyen",  "Gestion d'erreur + saisie manuelle en fallback"],
      ],
      [3000, 1500, 1500, 3500]
    ),
    pageBreak(),
  ];
}

// SECTION MÉTHODOLOGIE & UI/UX (Jalon 2)
function sectionMethodologie() {
  return [
    h1("Partie 2 — Méthodologie & Conception UI/UX"),
    br(),
    h2("2.1  Démarche méthodologique — Agile Scrum adapté"),
    p("Le projet BiblioTech a été conduit en suivant une approche Agile adaptée au contexte solo d'un projet de formation. Les principes clés retenus sont :"),
    bullet("Sprints de 2 semaines avec une rétrospective à chaque fin de sprint"),
    bullet("Backlog produit priorisé avec User Stories (As a… I want… So that…)"),
    bullet("Definition of Done : tests unitaires verts + code review + déploiement staging"),
    bullet("Kanban GitHub Projects pour le suivi des tâches"),
    br(),
    h3("2.1.1  User Stories principales"),
    makeTable(
      ["ID", "En tant que…", "Je veux…", "Afin de…", "Priorité"],
      [
        ["US01", "Bibliothécaire",  "Me connecter avec email/mot de passe",                              "Accéder à mon espace sécurisé",              "Must Have"],
        ["US02", "Bibliothécaire",  "Ajouter un livre via ISBN",                                         "Remplir le formulaire automatiquement",       "Must Have"],
        ["US03", "Bibliothécaire",  "Enregistrer un prêt",                                               "Suivre qui emprunte quoi",                    "Must Have"],
        ["US04", "Bibliothécaire",  "Voir les prêts en retard",                                          "Relancer les adhérents concernés",            "Must Have"],
        ["US05", "Adhérent",        "Consulter le catalogue",                                            "Vérifier la disponibilité d'un livre",        "Should Have"],
        ["US06", "Admin",           "Créer un compte utilisateur",                                       "Donner accès au personnel ou aux adhérents",  "Must Have"],
        ["US07", "Admin",           "Configurer la durée de prêt",                                       "Adapter aux règles de ma bibliothèque",       "Should Have"],
        ["US08", "Super Admin",     "Approuver une demande de migration d'adhérent",                     "Gérer les transferts inter-bibliothèques",     "Could Have"],
        ["US09", "Bibliothécaire",  "Marquer un exemplaire comme perdu",                                 "Mettre à jour l'inventaire",                  "Should Have"],
        ["US10", "Admin",           "Désactiver une bibliothèque",                                       "Bloquer l'accès sans supprimer les données",  "Could Have"],
      ],
      [700, 1800, 2800, 2500, 1400]
    ),
    br(),
    h2("2.2  Architecture de l'information"),
    p("L'application distingue 4 niveaux d'accès qui déterminent la navigation disponible :"),
    makeTable(
      ["Rôle", "Pages accessibles", "Actions autorisées"],
      [
        ["super_admin",   "Toutes + panel super-admin",      "Gestion globale, approbation migrations, audit sécurité"],
        ["admin",         "Dashboard, Catalogue, Adhérents, Prêts, Paramètres", "CRUD complet sur sa bibliothèque"],
        ["bibliothecaire","Dashboard, Catalogue, Prêts",    "Enregistrer prêts/retours, gérer catalogue"],
        ["adherent",      "Catalogue (lecture), Mes prêts", "Consulter uniquement, soumettre demande migration"],
      ],
      [1800, 3500, 4200]
    ),
    br(),
    h2("2.3  Charte graphique"),
    makeTable(
      ["Élément", "Valeur", "Usage"],
      [
        ["Couleur principale", "#1E364A",  "En-têtes, titres, boutons primaires"],
        ["Couleur secondaire", "#2D7D9A",  "Accents, liens, badges"],
        ["Fond général",       "#F8FAFC",  "Background de l'application"],
        ["Texte principal",    "#374151",  "Corps de texte"],
        ["Succès",             "#059669",  "Badges, confirmations"],
        ["Danger",             "#DC2626",  "Erreurs, suppressions"],
        ["Police principale",  "Inter (système)", "Interface, labels"],
        ["Police code",        "Courier New",     "Affichage ISBN, tokens"],
      ],
      [2500, 2000, 5000]
    ),
    br(),
    h2("2.4  Maquettes Figma"),
    h3("2.4.1  Page de connexion"),
    screenImage("01-connexion.png"),
    placeholderCaption("Figure 2.1 — Formulaire de connexion avec gestion d'erreurs brute-force"),
    br(),
    h3("2.4.2  Tableau de bord (Dashboard)"),
    screenImage("02-dashboard.png"),
    placeholderCaption("Figure 2.2 — Vue synthétique : prêts en cours, retards, statistiques rapides"),
    br(),
    h3("2.4.3  Catalogue des livres"),
    screenImage("03-catalogue.png"),
    placeholderCaption("Figure 2.3 — Catalogue avec filtres, recherche par ISBN, gestion des exemplaires"),
    br(),
    h3("2.4.4  Gestion des prêts"),
    screenImage("04-prets.png"),
    placeholderCaption("Figure 2.4 — Liste des prêts actifs, formulaire de retour, badge retard"),
    br(),
    h3("2.4.5  Gestion des adhérents"),
    screenImage("05-adherents.png"),
    placeholderCaption("Figure 2.5 — CRUD adhérents avec formulaire d'ajout et confirmation de suppression"),
    br(),
    h3("2.4.6  Premier login — Changement de mot de passe obligatoire"),
    screenImage("06-premier-login-mdp.png"),
    placeholderCaption("Figure 2.6 — Écran de changement de mot de passe au premier accès (must_change_password)"),
    br(),
    h3("2.4.7  Premier login — Acceptation des CGU"),
    screenImage("07-premier-login-cgu.png"),
    placeholderCaption("Figure 2.7 — Affichage du texte des CGU avec bouton d'acceptation obligatoire"),
    br(),
    h2("2.5  Flux utilisateur principaux"),
    h3("2.5.1  Connexion et authentification"),
    ...codeBlock([
      "1. L'utilisateur saisit email + mot de passe",
      "2. POST /api/login → {token, refresh_token}",
      "3. Si must_change_password = true → redirection PremierLoginMotDePassePage",
      "4. Si cgu_accepted_version = null ou version < version courante → redirection PremierLoginCguPage",
      "5. Sinon → redirection Dashboard",
    ]),
    br(),
    h3("2.5.2  Enregistrement d'un prêt"),
    ...codeBlock([
      "1. Bibliothécaire ouvre PretsPage",
      "2. Clique sur « Nouveau prêt »",
      "3. Sélectionne un adhérent (dropdown filtré par bibliothèque)",
      "4. Sélectionne un exemplaire disponible",
      "5. POST /api/prets → {pret_id, date_retour_prevue}",
      "6. Exemplaire passe à l'état EMPRUNTE automatiquement",
    ]),
    pageBreak(),
  ];
}

// SECTION BASE DE DONNÉES (Jalon 3)
function sectionBaseDeDonnees() {
  return [
    h1("Partie 3 — Modélisation de la Base de Données"),
    br(),
    h2("3.1  Démarche MERISE"),
    p("La modélisation de la base de données suit la méthode MERISE, en trois niveaux progressifs :"),
    bullet("MCD (Modèle Conceptuel de Données) — représente les entités métier et leurs relations, sans considération technique"),
    bullet("MLD (Modèle Logique de Données) — traduit le MCD en tables relationnelles avec clés primaires et étrangères"),
    bullet("MPD (Modèle Physique de Données) — décline le MLD avec les types SQL concrets et les contraintes PostgreSQL"),
    br(),
    h2("3.2  MCD — Modèle Conceptuel de Données"),
    imagePlaceholder("Mettre le diagramme MCD BiblioTech (entités et relations conceptuelles)"),
    placeholderCaption("Figure 3.1 — MCD BiblioTech : Bibliotheque, Utilisateur, Livre, Exemplaire, Pret, DemandeMigration, CguVersion"),
    br(),
    h2("3.3  MLD — Modèle Logique de Données"),
    imagePlaceholder("Mettre le diagramme MLD BiblioTech (tables relationnelles avec clés étrangères)"),
    placeholderCaption("Figure 3.2 — MLD PostgreSQL avec toutes les relations entre tables"),
    br(),
    h2("3.4  MPD — Dictionnaire des données"),
    h3("3.4.1  Table : bibliotheques"),
    makeTable(
      ["Colonne", "Type SQL", "Contrainte", "Description"],
      [
        ["id",              "SERIAL",              "PK",                         "Identifiant unique auto-incrémenté"],
        ["nom",             "VARCHAR(255)",         "NOT NULL",                   "Nom de la bibliothèque"],
        ["adresse",         "VARCHAR(255)",         "NULLABLE",                   "Adresse postale"],
        ["ville",           "VARCHAR(100)",         "NULLABLE",                   "Ville"],
        ["code_postal",     "VARCHAR(10)",          "NULLABLE",                   "Code postal"],
        ["email",           "VARCHAR(255)",         "NULLABLE",                   "Email de contact"],
        ["active",          "BOOLEAN",              "NOT NULL DEFAULT true",       "Bibliothèque active/inactive"],
        ["duret_pret_jours","INTEGER",              "NOT NULL DEFAULT 21",         "Durée de prêt en jours (configurable par bibliothèque)"],
        ["created_at",      "TIMESTAMP WITH TZ",   "NOT NULL DEFAULT NOW()",      "Date de création"],
      ],
      [1800, 1800, 2200, 3700]
    ),
    br(),
    h3("3.4.2  Table : utilisateurs"),
    makeTable(
      ["Colonne", "Type SQL", "Contrainte", "Description"],
      [
        ["id",                    "SERIAL",             "PK",                   "Identifiant unique"],
        ["email",                 "VARCHAR(180)",        "UNIQUE NOT NULL",      "Adresse email (identifiant de connexion)"],
        ["password",              "VARCHAR(255)",        "NOT NULL",             "Hash Argon2id du mot de passe"],
        ["nom",                   "VARCHAR(100)",        "NOT NULL",             "Nom de famille"],
        ["prenom",                "VARCHAR(100)",        "NOT NULL",             "Prénom"],
        ["role",                  "VARCHAR(20)",         "NOT NULL DEFAULT 'adherent'","Rôle unique : super_admin, admin, bibliothecaire, adherent"],
        ["bibliotheque_id",       "INTEGER",             "FK → bibliotheques NULLABLE","Bibliothèque de rattachement (NULL pour super_admin)"],
        ["active",                "BOOLEAN",             "NOT NULL DEFAULT true","Compte actif/suspendu"],
        ["must_change_password",  "BOOLEAN",             "NOT NULL DEFAULT true","Changement mot de passe obligatoire au premier login"],
        ["cgu_accepted_version",  "VARCHAR(20)",         "NULLABLE",             "Numéro de version CGU acceptée (NULL = pas encore acceptée)"],
        ["prets_suspendus",       "BOOLEAN",             "NOT NULL DEFAULT false","Prêts bloqués (exemplaire perdu non rendu)"],
        ["login_attempts",        "INTEGER",             "NOT NULL DEFAULT 0",   "Compteur de tentatives échouées (brute-force)"],
        ["locked_until",          "TIMESTAMP WITH TZ",  "NULLABLE",             "Blocage temporaire après 5 échecs (15 min)"],
        ["created_at",            "TIMESTAMP WITH TZ",  "NOT NULL DEFAULT NOW()","Date de création"],
      ],
      [2200, 1800, 2000, 3500]
    ),
    br(),
    h3("3.4.3  Table : livres"),
    makeTable(
      ["Colonne", "Type SQL", "Contrainte", "Description"],
      [
        ["id",             "SERIAL",            "PK",                "Identifiant unique"],
        ["isbn",           "VARCHAR(20)",        "NOT NULL",          "ISBN-13 ou ISBN-10"],
        ["titre",          "VARCHAR(500)",       "NOT NULL",          "Titre du livre"],
        ["auteur",         "VARCHAR(300)",       "NOT NULL",          "Auteur(s)"],
        ["editeur",        "VARCHAR(200)",       "NULLABLE",          "Éditeur"],
        ["annee",          "INTEGER",            "NULLABLE",          "Année de publication"],
        ["description",    "TEXT",               "NULLABLE",          "Résumé/description"],
        ["couverture_url", "TEXT",               "NULLABLE",          "URL de la couverture (Google Books)"],
        ["bibliotheque_id","INTEGER",            "FK → bibliotheques","Bibliothèque propriétaire"],
        ["created_at",     "TIMESTAMP WITH TZ", "NOT NULL DEFAULT NOW()","Date d'ajout"],
      ],
      [2000, 1800, 1800, 3900]
    ),
    br(),
    h3("3.4.4  Table : exemplaires"),
    makeTable(
      ["Colonne", "Type SQL", "Contrainte", "Description"],
      [
        ["id",          "SERIAL",             "PK",                "Identifiant unique"],
        ["livre_id",    "INTEGER",             "FK → livres",       "Livre associé"],
        ["etat",        "VARCHAR(20)",         "NOT NULL DEFAULT 'DISPONIBLE'","État physique : DISPONIBLE, EMPRUNTE, PERDU, DETERIORE"],
        ["cote",        "VARCHAR(50)",         "NULLABLE",          "Cote de rangement (bibliothèque)"],
        ["created_at",  "TIMESTAMP WITH TZ",  "NOT NULL DEFAULT NOW()","Date d'ajout"],
      ],
      [1500, 1600, 2800, 3600]
    ),
    br(),
    h3("3.4.5  Table : prets"),
    makeTable(
      ["Colonne", "Type SQL", "Contrainte", "Description"],
      [
        ["id",                 "SERIAL",             "PK",              "Identifiant unique"],
        ["exemplaire_id",      "INTEGER",             "FK → exemplaires","Exemplaire emprunté"],
        ["utilisateur_id",     "INTEGER",             "FK → utilisateurs","Adhérent emprunteur"],
        ["date_pret",          "DATE",                "NOT NULL",        "Date du prêt"],
        ["date_retour_prevue", "DATE",                "NOT NULL",        "Date de retour attendue"],
        ["date_retour_effective","DATE",               "NULLABLE",        "Date de retour effective (NULL si en cours)"],
        ["etat_depart",        "VARCHAR(20)",         "NULLABLE",        "État exemplaire au départ (saisi au prêt)"],
        ["etat_retour",        "VARCHAR(20)",         "NULLABLE",        "État exemplaire au retour"],
        ["created_at",         "TIMESTAMP WITH TZ",  "NOT NULL DEFAULT NOW()","Date d'enregistrement"],
      ],
      [2000, 1800, 1600, 4100]
    ),
    br(),
    h3("3.4.6  Table : cgu_versions"),
    makeTable(
      ["Colonne", "Type SQL", "Contrainte", "Description"],
      [
        ["id",            "SERIAL",             "PK",           "Identifiant unique"],
        ["version",       "INTEGER",             "NOT NULL",     "Numéro de version (1, 2, 3…)"],
        ["contenu",       "TEXT",                "NOT NULL",     "Texte complet des CGU (séparateurs \\n)"],
        ["date_effet",    "DATE",                "NOT NULL",     "Date d'entrée en vigueur (préavis 15 jours)"],
        ["created_at",    "TIMESTAMP WITH TZ",  "NOT NULL DEFAULT NOW()","Date de création"],
      ],
      [1800, 1600, 2200, 3900]
    ),
    br(),
    h3("3.4.7  Table : demandes_migration"),
    makeTable(
      ["Colonne", "Type SQL", "Contrainte", "Description"],
      [
        ["id",                   "SERIAL",             "PK",                        "Identifiant unique"],
        ["utilisateur_id",       "INTEGER",             "FK → utilisateurs",         "Adhérent demandeur"],
        ["bibliotheque_source",  "INTEGER",             "FK → bibliotheques",        "Bibliothèque d'origine"],
        ["bibliotheque_cible",   "INTEGER",             "FK → bibliotheques",        "Bibliothèque de destination"],
        ["statut",               "VARCHAR(20)",         "NOT NULL DEFAULT 'EN_ATTENTE'","Statut : EN_ATTENTE, APPROUVEE, REFUSEE"],
        ["created_at",           "TIMESTAMP WITH TZ",  "NOT NULL DEFAULT NOW()",    "Date de la demande"],
      ],
      [2200, 1600, 1800, 3900]
    ),
    br(),
    h2("3.5  Règles de gestion"),
    bullet("Un livre appartient à une et une seule bibliothèque (bibliotheque_id NOT NULL sur livres)"),
    bullet("Un exemplaire référence un livre unique (livre_id NOT NULL)"),
    bullet("Un prêt ne peut pas exister sans un exemplaire DISPONIBLE"),
    bullet("Quand un prêt est créé, l'exemplaire passe automatiquement à l'état EMPRUNTE"),
    bullet("Quand un prêt est retourné, l'exemplaire repasse à DISPONIBLE (ou DETERIORE si signalé)"),
    bullet("Un adhérent ne peut avoir qu'un seul prêt actif par exemplaire"),
    bullet("L'isolation multi-tenant est garantie : aucun utilisateur ne peut accéder aux données d'une autre bibliothèque"),
    bullet("Le super_admin n'a pas de bibliotheque_id — il a accès à toutes les bibliothèques"),
    pageBreak(),
  ];
}

// SECTION ARCHITECTURE TECHNIQUE (Jalon 4)
function sectionArchitecture() {
  return [
    h1("Partie 4 — Architecture Technique & Conception UML"),
    br(),
    h2("4.1  Architecture globale"),
    p("BiblioTech suit une architecture de type SaaS multi-tenant avec une séparation stricte frontend/backend. L'API REST Symfony est la seule source de vérité ; le frontend React n'accède jamais directement à la base de données."),
    imagePlaceholder("Mettre le diagramme d'architecture globale (Frontend React / API Symfony / PostgreSQL / Services tiers)"),
    placeholderCaption("Figure 4.1 — Architecture SaaS multi-tenant : React (Render) → API Symfony (Render) → PostgreSQL (Supabase)"),
    br(),
    h2("4.2  Stack technique"),
    makeTable(
      ["Composant", "Technologie", "Version", "Rôle"],
      [
        ["Backend API",      "Symfony",      "7.3",   "Framework PHP — MVC, Routing, Security"],
        ["Langage backend",  "PHP",          "8.3",   "Logique métier, controllers, services"],
        ["ORM",              "Doctrine",     "3.x",   "Mapping objet-relationnel, migrations"],
        ["Auth",             "LexikJWT",     "3.x",   "JWT RS256 4096-bit + Refresh Token"],
        ["Frontend",         "React",        "19",    "SPA (Single Page Application)"],
        ["Bundler",          "Vite",         "6.x",   "Build et hot-reload frontend"],
        ["TypeScript",       "TypeScript",   "5.x",   "Typage statique frontend"],
        ["HTTP client",      "Axios",        "1.x",   "Appels API depuis le frontend"],
        ["Base de données",  "PostgreSQL",   "16",    "SGBD relationnel principal"],
        ["Cloud BDD",        "Supabase",     "—",     "PostgreSQL managé en production"],
        ["Conteneurisation", "Docker",       "27.x",  "Image backend PHP-FPM + Nginx"],
        ["CI/CD",            "GitHub Actions","—",    "Tests, lint TypeScript, build Docker"],
        ["Hébergement",      "Render",       "—",     "Backend Docker + Frontend Static Site"],
      ],
      [2000, 1800, 1200, 4500]
    ),
    br(),
    h2("4.3  Diagramme de classes"),
    imagePlaceholder("Mettre le diagramme de classes UML (Entities Doctrine : Bibliotheque, Utilisateur, Livre, Exemplaire, Pret…)"),
    placeholderCaption("Figure 4.2 — Diagramme de classes UML complet avec attributs, types et associations"),
    br(),
    h2("4.4  Diagrammes de cas d'utilisation"),
    h3("4.4.1  Use cases — Bibliothécaire"),
    imagePlaceholder("Mettre le diagramme use case du rôle Bibliothécaire"),
    placeholderCaption("Figure 4.3 — Cas d'utilisation du bibliothécaire : gestion catalogue, prêts, retours"),
    br(),
    h3("4.4.2  Use cases — Adhérent"),
    imagePlaceholder("Mettre le diagramme use case du rôle Adhérent"),
    placeholderCaption("Figure 4.4 — Cas d'utilisation de l'adhérent : consultation catalogue, prêts, demande migration"),
    br(),
    h2("4.5  Diagrammes de séquence"),
    h3("4.5.1  Séquence : Authentification JWT"),
    imagePlaceholder("Mettre le diagramme de séquence Authentification JWT + Refresh Token"),
    placeholderCaption("Figure 4.5 — Flux complet : login → token (8h) + refresh_token (30j) → rotation automatique"),
    br(),
    h3("4.5.2  Séquence : Enregistrement d'un prêt"),
    imagePlaceholder("Mettre le diagramme de séquence Enregistrement d'un prêt"),
    placeholderCaption("Figure 4.6 — Flux prêt : vérification disponibilité → création pret → mise à jour exemplaire"),
    br(),
    h3("4.5.3  Séquence : Retour d'un exemplaire"),
    imagePlaceholder("Mettre le diagramme de séquence Retour d'un exemplaire"),
    placeholderCaption("Figure 4.7 — Flux retour : validation état → clôture prêt → mise à jour stock"),
    br(),
    h2("4.6  Endpoints REST — Vue d'ensemble"),
    makeTable(
      ["Méthode", "Endpoint", "Rôle requis", "Description"],
      [
        ["POST",   "/api/login",                                  "Public",                   "Connexion — retourne token + refresh_token"],
        ["POST",   "/api/token/refresh",                        "Public",                   "Rafraîchissement du JWT via refresh token (rotation)"],
        ["POST",   "/api/logout",                               "Authentifié",              "Révocation du refresh token passé"],
        ["GET",    "/api/utilisateurs",                         "admin, super_admin",        "Liste des utilisateurs de la bibliothèque"],
        ["POST",   "/api/utilisateurs",                         "admin, super_admin",        "Création d'un utilisateur"],
        ["PATCH",  "/api/utilisateurs/{id}",                    "admin, super_admin",        "Modification d'un utilisateur"],
        ["DELETE", "/api/utilisateurs/{id}",                    "admin, super_admin",        "Suppression (droit à l'oubli RGPD)"],
        ["POST",   "/api/utilisateurs/me/change-password",      "Authentifié",              "Changement du mot de passe (premier login)"],
        ["POST",   "/api/utilisateurs/me/accept-cgu",           "Authentifié",              "Acceptation des CGU courantes"],
        ["GET",    "/api/livres",                               "Authentifié",              "Liste des livres de la bibliothèque"],
        ["POST",   "/api/livres",                               "admin, bibliothecaire",     "Ajout d'un livre"],
        ["GET",    "/api/livres/search-isbn/{isbn}",            "Authentifié",              "Recherche ISBN via Google Books"],
        ["PUT",    "/api/livres/{id}",                          "admin, bibliothecaire",     "Modification d'un livre"],
        ["DELETE", "/api/livres/{id}",                          "admin",                     "Suppression d'un livre"],
        ["GET",    "/api/exemplaires",                          "Authentifié",              "Liste des exemplaires"],
        ["POST",   "/api/exemplaires",                          "admin, bibliothecaire",     "Ajout d'un exemplaire"],
        ["PATCH",  "/api/exemplaires/{id}",                     "admin, bibliothecaire",     "Modification état d'un exemplaire"],
        ["DELETE", "/api/exemplaires/{id}",                     "admin",                     "Suppression d'un exemplaire"],
        ["GET",    "/api/prets",                                "admin, bibliothecaire",     "Liste des prêts actifs"],
        ["POST",   "/api/prets",                                "admin, bibliothecaire",     "Création d'un prêt"],
        ["PATCH",  "/api/prets/{id}/retour",                    "admin, bibliothecaire",     "Enregistrement d'un retour"],
        ["PATCH",  "/api/prets/{id}/perdu",                     "admin, bibliothecaire",     "Signalement exemplaire perdu"],
        ["GET",    "/api/bibliotheques",                        "super_admin",               "Liste toutes les bibliothèques"],
        ["GET",    "/api/bibliotheques/{id}",                   "admin, super_admin",        "Détail d'une bibliothèque"],
        ["PATCH",  "/api/bibliotheques/{id}",                   "super_admin",               "Modification d'une bibliothèque"],
        ["GET",    "/api/cgu",                                  "Public",                   "Récupération des CGU courantes"],
        ["POST",   "/api/cgu",                                  "super_admin",               "Publication d'une nouvelle version des CGU"],
        ["GET",    "/api/demandes-migration",                   "admin, super_admin, adherent","Liste des demandes de migration"],
        ["POST",   "/api/demandes-migration",                   "adherent",                  "Création d'une demande de migration"],
        ["PATCH",  "/api/demandes-migration/{id}/approve",      "super_admin",               "Approbation d'une demande de migration"],
        ["PATCH",  "/api/demandes-migration/{id}/reject",       "super_admin",               "Refus d'une demande de migration"],
        ["GET",    "/api/stats",                                "admin, bibliothecaire",     "Statistiques tableau de bord"],
      ],
      [800, 3200, 1600, 3900]
    ),
    pageBreak(),
  ];
}

// SECTION DÉVELOPPEMENT BACKEND (Jalon 5)
function sectionDeveloppementBackend() {
  return [
    h1("Partie 5 — Développement Backend Symfony"),
    br(),
    h2("5.1  Structure du projet Symfony"),
    ...codeBlock([
      "backend/",
      "├── src/",
      "│   ├── Controller/         ← Points d'entrée HTTP (/api/*)",
      "│   │   ├── AuthController.php",
      "│   │   ├── BibliothequeController.php",
      "│   │   ├── CguController.php",
      "│   │   ├── UtilisateurController.php",
      "│   │   ├── LivreController.php",
      "│   │   ├── ExemplaireController.php",
      "│   │   ├── PretController.php",
      "│   │   ├── DemandeMigrationController.php",
      "│   │   └── StatController.php",
      "│   ├── Entity/             ← Mapping Doctrine (ORM)",
      "│   │   ├── Bibliotheque.php",
      "│   │   ├── Utilisateur.php",
      "│   │   ├── Livre.php",
      "│   │   ├── Exemplaire.php",
      "│   │   ├── Pret.php",
      "│   │   ├── RefreshToken.php",
      "│   │   ├── CguVersion.php",
      "│   │   └── DemandeMigration.php",
      "│   ├── Repository/         ← Requêtes Doctrine personnalisées",
      "│   ├── Service/            ← Logique métier",
      "│   │   ├── PretService.php",
      "│   │   └── GoogleBooksService.php",
      "│   └── EventSubscriber/    ← JwtCreatedSubscriber.php",
      "├── config/",
      "│   └── packages/",
      "│       ├── security.yaml   ← Firewalls, access_control",
      "│       └── lexik_jwt_authentication.yaml",
      "├── migrations/             ← Migrations Doctrine",
      "└── tests/                  ← PHPUnit (67 tests, 8 suites)",
    ]),
    br(),
    h2("5.2  Entités Doctrine principales"),
    h3("5.2.1  Entité Utilisateur"),
    p("L'entité Utilisateur implémente UserInterface et PasswordAuthenticatedUserInterface de Symfony Security. Les champs de sécurité notables :"),
    ...codeBlock([
      "#[ORM\\Entity(repositoryClass: UtilisateurRepository::class)]",
      "#[ORM\\Table(name: 'utilisateurs')]",
      "class Utilisateur implements UserInterface, PasswordAuthenticatedUserInterface",
      "{",
      "    #[ORM\\Column(type: 'integer')]",
      "    private ?int $id = null;",
      "",
      "    #[ORM\\Column(type: 'string', length: 255, unique: true)]",
      "    private string $email;",
      "",
      "    #[ORM\\Column(type: 'string', length: 255)]",
      "    private string $password;  // Hash Argon2id",
      "",
      "    #[ORM\\Column(type: 'string', length: 20)]",
      "    private string $role = self::ROLE_ADHERENT;  // 'super_admin'|'admin'|'bibliothecaire'|'adherent'",
      "",
      "    #[ORM\\Column(type: 'boolean', options: ['default' => true])]",
      "    private bool $mustChangePassword = true;",
      "",
      "    #[ORM\\Column(type: 'string', length: 20, nullable: true)]",
      "    private ?string $cguAcceptedVersion = null;  // null = pas encore acceptée",
      "",
      "    #[ORM\\Column(type: 'boolean', options: ['default' => false])]",
      "    private bool $pretsSuspendus = false;",
      "",
      "    #[ORM\\Column(type: 'integer', options: ['default' => 0])]",
      "    private int $loginAttempts = 0;",
      "",
      "    #[ORM\\Column(type: 'datetime_immutable', nullable: true)]",
      "    private ?\\DateTimeImmutable $lockedUntil = null;",
      "}",
    ]),
    br(),
    h3("5.2.2  Entité CguVersion"),
    p("Le contenu des CGU est stocké en TEXT brut avec des séparateurs \\n (pas de HTML). Une version est publiée avec une date d'effet à J+15 minimum pour respecter le préavis légal."),
    ...codeBlock([
      "#[ORM\\Entity(repositoryClass: CguVersionRepository::class)]",
      "#[ORM\\Table(name: 'cgu_versions')]",
      "class CguVersion",
      "{",
      "    #[ORM\\Column]",
      "    private int $version;",
      "",
      "    #[ORM\\Column(type: 'text')]",
      "    private string $contenu;  // Texte brut, séparateurs \\n",
      "",
      "    #[ORM\\Column(type: 'date')]",
      "    private \\DateTimeInterface $dateEffet;  // Doit être >= NOW() + 15 jours",
      "}",
    ]),
    br(),
    h2("5.3  Contrôleurs — Patterns de sécurité RBAC"),
    p("Le RBAC est implémenté directement dans les contrôleurs via getRole() et getBibliothequeId() inline — sans AttributeVoter ni DTO Symfony Validator. Ce choix délibéré simplifie la traçabilité : chaque vérification de droit est visible dans le corps du contrôleur."),
    h3("5.3.1  Pattern standard de contrôle d'accès"),
    ...codeBlock([
      "// Exemple dans PretController::create()",
      "public function create(Request $request, ...): JsonResponse",
      "{",
      "    /** @var Utilisateur $user */",
      "    $user = $this->getUser();",
      "",
      "    // 1. Vérification du rôle (getRole() retourne 'admin'|'bibliothecaire'|...)",
      "    $role = $user->getRole();",
      "    if ($role !== 'admin' && $role !== 'bibliothecaire' && $role !== 'super_admin') {",
      "        return $this->json(['error' => 'Accès refusé'], 403);",
      "    }",
      "",
      "    // 2. Isolation tenant — l'utilisateur ne peut créer un prêt",
      "    //    que dans SA bibliothèque",
      "    $bibId = $user->getBibliotheque()?->getId();",
      "    if ($exemplaire->getLivre()->getBibliotheque()->getId() !== $bibId) {",
      "        return $this->json(['error' => 'Ressource hors périmètre'], 403);",
      "    }",
      "",
      "    // 3. Logique métier",
      "    return $this->json($this->pretService->create($exemplaire, $user, $bibId));",
      "}",
    ]),
    br(),
    h2("5.4  Services métier"),
    h3("5.4.1  PretService"),
    p("PretService centralise la logique de création et de retour des prêts, assurant la cohérence des états d'exemplaire."),
    makeTable(
      ["Méthode", "Paramètres", "Description"],
      [
        ["create()",         "Exemplaire, Utilisateur, int $duree",  "Crée un prêt, passe l'exemplaire à EMPRUNTE, calcule date_retour_prevue"],
        ["retour()",         "Pret, string $etatRetour",             "Clôture le prêt, met à jour l'état de l'exemplaire"],
        ["signalerPerdu()",  "Pret",                                 "Clôture le prêt, passe l'exemplaire à PERDU définitivement"],
        ["isEnRetard()",     "Pret",                                 "Retourne true si date_retour_prevue < aujourd'hui et date_retour_reel = null"],
      ],
      [2000, 2500, 5000]
    ),
    br(),
    h3("5.4.2  GoogleBooksService"),
    ...codeBlock([
      "class GoogleBooksService",
      "{",
      "    private const API_URL = 'https://www.googleapis.com/books/v1/volumes';",
      "",
      "    public function searchByIsbn(string $isbn): ?array",
      "    {",
      "        $response = $this->httpClient->request('GET', self::API_URL, [",
      "            'query' => ['q' => 'isbn:' . $isbn],",
      "        ]);",
      "        // Retourne [titre, auteur, editeur, annee, description, couverture_url]",
      "        // ou null si ISBN non trouvé",
      "    }",
      "}",
    ]),
    br(),
    h2("5.5  Fonctionnalités avancées"),
    h3("5.5.1  Premier login — Changement de mot de passe"),
    p("Lors de la création d'un compte par un admin, le champ must_change_password est à true. À la première connexion, le JWT contient le claim must_change_password=true. Le frontend intercepte ce claim et redirige l'utilisateur vers PremierLoginMotDePassePage avant d'accéder à l'application."),
    ...codeBlock([
      "// JwtCreatedSubscriber.php — payload JWT injecté à chaque token généré",
      "public function onJwtCreated(JwtCreatedEvent $event): void",
      "{",
      "    $user    = $event->getUser();",
      "    $payload = $event->getData();",
      "",
      "    $payload['sub']                  = $user->getId();",
      "    $payload['email']                = $user->getEmail();",
      "    $payload['role']                 = $user->getRole();",
      "    $payload['bibliotheque_id']      = $user->getBibliotheque()?->getId();",
      "    $payload['must_change_password'] = $user->isMustChangePassword();",
      "    $payload['cgu_accepted_version'] = $user->getCguAcceptedVersion();",
      "    $payload['prets_suspendus']      = $user->isPretsSuspendus();",
      "",
      "    $event->setData($payload);",
      "}",
    ]),
    br(),
    h3("5.5.2  Versionnement des CGU — Préavis 15 jours"),
    p("Une nouvelle version des CGU ne peut être publiée qu'avec une date d'effet à 15 jours minimum dans le futur. Si un utilisateur tente d'appeler un endpoint protégé après la date d'effet alors que ses CGU ne sont pas acceptées, le backend renvoie HTTP 422 avec pendingVersion."),
    ...codeBlock([
      "// CguController::accept()",
      "public function accept(Request $request, ...): JsonResponse",
      "{",
      "    $currentVersion = $this->cguRepo->findCurrentVersion();",
      "    if (!$currentVersion) {",
      "        return $this->json(['error' => 'Aucune CGU active'], 404);",
      "    }",
      "",
      "    $user->setCguAcceptedVersion((string) $currentVersion->getVersion());",
      "    $this->em->flush();",
      "",
      "    return $this->json(['message' => 'CGU acceptées', 'version' => $currentVersion->getVersion()]);",
      "}",
    ]),
    br(),
    h3("5.5.3  Protection anti-brute force"),
    ...codeBlock([
      "// AuthController::login() — vérification avant authentification",
      "if ($user->getLoginAttempts() >= 5",
      "    && $user->getLockedUntil() > new \\DateTimeImmutable()) {",
      "    return $this->json([",
      "        'error' => 'Compte verrouillé',",
      "        'locked_until' => $user->getLockedUntil()->format('c'),",
      "    ], 429);",
      "}",
      "",
      "// En cas d'échec d'authentification :",
      "$attempts = ($user->getLoginAttempts() ?? 0) + 1;",
      "$user->setLoginAttempts($attempts);",
      "if ($attempts >= 5) {",
      "    $user->setLockedUntil(new \\DateTimeImmutable('+15 minutes'));",
      "}",
    ]),
    br(),
    h3("5.5.4  Durée de prêt configurable"),
    p("Chaque bibliothèque peut configurer sa durée de prêt via le champ duret_pret_jours (INTEGER, default 21). PretService utilise cette valeur pour calculer date_retour_prevue."),
    br(),
    h3("5.5.5  Prêts perdus"),
    p("Un bibliothécaire peut signaler un exemplaire comme perdu via PATCH /api/prets/{id}/perdu. Cela clôture le prêt (date_retour_effective = aujourd'hui) et passe l'état de l'exemplaire à PERDU de manière permanente."),
    br(),
    h2("5.6  Frontend React — Architecture"),
    p("Le frontend est une SPA React 19 avec TypeScript, compilée par Vite. L'architecture suit le pattern Context API + Services."),
    makeTable(
      ["Fichier / Dossier", "Rôle"],
      [
        ["src/context/AuthContext.tsx",      "State global authentification : user, token, role, logout"],
        ["src/context/CguContext.tsx",        "Détection et gestion de la mise à jour des CGU"],
        ["src/services/api.ts",              "Instance Axios avec intercepteurs (injection token, refresh automatique)"],
        ["src/services/authService.ts",      "login(), logout(), refreshToken()"],
        ["src/services/livreService.ts",     "CRUD livres + recherche ISBN"],
        ["src/services/pretService.ts",      "CRUD prêts, retour, signalement perdu"],
        ["src/pages/LoginPage.tsx",          "Formulaire de connexion avec gestion brute-force"],
        ["src/pages/DashboardPage.tsx",      "Statistiques, prêts en retard, actions rapides"],
        ["src/pages/CataloguePage.tsx",      "Catalogue livres, exemplaires, recherche ISBN"],
        ["src/pages/PretsPage.tsx",          "Gestion prêts/retours"],
        ["src/pages/AdherentsPage.tsx",      "CRUD adhérents"],
        ["src/pages/ProtectedRoute.tsx",     "Guard de route : token valide + rôle requis + CGU acceptées"],
        ["src/pages/PremierLoginMotDePassePage.tsx", "Changement mot de passe obligatoire"],
        ["src/pages/PremierLoginCguPage.tsx","Acceptation des CGU obligatoire"],
        ["src/utils/validators.ts",          "Validation côté client (email, mot de passe, ISBN)"],
      ],
      [3500, 6000]
    ),
    br(),
    h3("5.6.1  Intercepteur Axios — Refresh Token automatique"),
    ...codeBlock([
      "// api.ts — intercepteur response",
      "api.interceptors.response.use(",
      "    response => response,",
      "    async error => {",
      "        if (error.response?.status === 401 && !error.config._retry) {",
      "            error.config._retry = true;",
      "            const newToken = await authService.refreshToken();",
      "            error.config.headers['Authorization'] = `Bearer ${newToken}`;",
      "            return api(error.config);  // Rejoue la requête avec le nouveau token",
      "        }",
      "        return Promise.reject(error);",
      "    }",
      ");",
    ]),
    br(),
    h3("5.6.2  Captures d'écran de l'application"),
    screenImage("02-dashboard.png"),
    placeholderCaption("Figure 5.1 — Dashboard : vue synthétique avec statistiques, prêts en retard et actions rapides"),
    br(),
    screenImage("03-catalogue.png"),
    placeholderCaption("Figure 5.2 — Page catalogue : liste livres, panel détail exemplaire, recherche ISBN"),
    br(),
    screenImage("04-prets.png"),
    placeholderCaption("Figure 5.3 — Module prêts : liste des prêts actifs, formulaire de création, bouton retour"),
    br(),
    screenImage("05-adherents.png"),
    placeholderCaption("Figure 5.4 — Page adhérents : DataTable avec actions CRUD inline"),
    pageBreak(),
  ];
}

// SECTION SÉCURITÉ (Jalon 5+6)
function sectionSecurite() {
  return [
    h1("Partie 6 — Sécurité"),
    br(),
    h2("6.1  Authentification JWT RS256"),
    p("BiblioTech utilise JSON Web Tokens (JWT) avec l'algorithme RS256 (RSA Signature, SHA-256) et une clé de 4096 bits. Ce choix garantit une sécurité bien supérieure à l'algorithme symétrique HS256 habituellement utilisé."),
    makeTable(
      ["Paramètre", "Valeur", "Justification"],
      [
        ["Algorithme",         "RS256",              "Asymétrique — la clé privée ne quitte jamais le serveur"],
        ["Taille de clé",      "4096 bits",          "Résistance accrue aux attaques par factorisation"],
        ["TTL access_token",   "8 heures",           "Choix délibéré pour le confort en formation (28800 s dans lexik_jwt_authentication.yaml)"],
        ["TTL refresh_token",  "30 jours",           "Confort utilisateur avec rotation à chaque usage"],
        ["Rotation",           "Oui — à chaque /refresh","Ancien token révoqué immédiatement"],
        ["Stockage frontend",  "localStorage (token), httpOnly cookie évité","Architecture SPA — token injecté via Axios"],
      ],
      [2000, 2200, 5300]
    ),
    br(),
    h2("6.2  RBAC — Contrôle d'accès par rôles"),
    p("Le RBAC est implémenté inline via getRole() dans chaque contrôleur — pas d'AttributeVoter ni de isGranted(). L'isolation multi-tenant est garantie par la vérification systématique de getBibliothequeId() en plus du rôle."),
    makeTable(
      ["Rôle (valeur stockée)", "Hiérarchie (inline)", "Périmètre d'action"],
      [
        ["super_admin",   "Inclut tous les droits",         "Accès global toutes bibliothèques, gestion CGU, approbation migrations"],
        ["admin",         "Inclut bibliothécaire et adhérent","CRUD complet sur SA bibliothèque uniquement"],
        ["bibliothecaire","Inclut adhérent",                "Gestion catalogue, prêts/retours, pas de gestion utilisateurs"],
        ["adherent",      "Rôle minimal",                   "Lecture seule catalogue + ses propres prêts + demande migration"],
      ],
      [2200, 2000, 5300]
    ),
    br(),
    h3("6.2.1  Configuration security.yaml"),
    ...codeBlock([
      "# security.yaml",
      "security:",
      "  firewalls:",
      "    api:",
      "      pattern: ^/api",
      "      stateless: true",
      "      jwt: ~",
      "",
      "  access_control:",
      "    - { path: ^/api/login,         roles: PUBLIC_ACCESS }",
      "    - { path: ^/api/token/refresh, roles: PUBLIC_ACCESS }",
      "    - { path: ^/api/logout,        roles: PUBLIC_ACCESS }",
      "    - { path: ^/api,               roles: IS_AUTHENTICATED_FULLY }",
      "",
      "  # Pas de role_hierarchy — RBAC géré inline dans chaque contrôleur",
      "  # via $user->getRole() === 'admin' | 'bibliothecaire' | 'super_admin'",
    ]),
    br(),
    h2("6.3  OWASP Top 10 — Mesures appliquées"),
    makeTable(
      ["#", "Catégorie OWASP", "Mesure appliquée dans BiblioTech"],
      [
        ["A01", "Broken Access Control",         "RBAC inline getRole()+getBibliothequeId() sur chaque endpoint, isolation tenant systématique"],
        ["A02", "Cryptographic Failures",        "Argon2id pour les mots de passe, JWT RS256 4096-bit, HTTPS obligatoire en production"],
        ["A03", "Injection",                     "Doctrine ORM avec requêtes paramétrées — aucune requête SQL construite par concaténation"],
        ["A04", "Insecure Design",               "Architecture stateless JWT, séparation frontend/backend, validation inline dans les contrôleurs"],
        ["A05", "Security Misconfiguration",     "Variables d'environnement (.env.local), JWT keys hors Git, CORS configuré strictement"],
        ["A06", "Vulnerable Components",         "Dépendances auditées via composer audit et npm audit en CI/CD"],
        ["A07", "Auth & Session Management",     "Refresh Token rotation (30j), TTL access_token 8h, révocation du refresh token à logout, rate limiter IP (10 req/5 min)"],
        ["A08", "Software & Data Integrity",     "Validation des entrées inline dans les contrôleurs (sans DTO)"],
        ["A09", "Security Logging",              "Monolog configuré pour logger les tentatives de connexion échouées"],
        ["A10", "SSRF",                          "Seul GoogleBooksService fait des appels HTTP sortants, URL fixe en constante"],
      ],
      [500, 2500, 6500]
    ),
    br(),
    h2("6.4  Audit de sécurité — Jalon 6"),
    p("Un audit de sécurité complet a été réalisé au Jalon 6 sur l'ensemble du code source. 14 vulnérabilités ont été identifiées et corrigées."),
    makeTable(
      ["CVE / Type", "Sévérité", "Endpoint / Fichier", "Statut"],
      [
        ["CVE-B01 — Crash PHP : $request non injecté",             "Critique", "PretController::retour()",                    "Corrigé — injection Request ajoutée"],
        ["CVE-B02 — Exposition globale des bibliothèques",         "Haute",    "BibliothequeController::list()",              "Corrigé — filtre par rôle + bibliotheque_id"],
        ["CVE-B03 — Élévation de privilège (admin→super_admin)",   "Haute",    "UtilisateurController::create()",             "Corrigé — liste blanche rôles assignables"],
        ["CVE-B04 — Validation force MDP absente (2 endpoints)",   "Haute",    "UtilisateurController::create() + update()",  "Corrigé — regex 8 car. + maj + chiffre + spécial"],
        ["CVE-B05 — Validation version CGU absente côté serveur",  "Haute",    "CguController / accept-cgu",                  "Corrigé — vérification version en base"],
        ["CVE-B06 — Isolation multi-tenant absente sur prêts",     "Haute",    "PretController::create() + retour()",         "Corrigé — contrôle bibliotheque_id ajouté"],
        ["CVE-B08 — Rate Limiter configuré mais non connecté",     "Moyenne",  "AuthController + framework.yaml",             "Corrigé — inject. RateLimiterFactory #[Target]"],
        ["CVE-B09 — 4 méthodes sans contrôle bibliotheque_id",     "Haute",    "UtilisateurController (4 méthodes)",           "Corrigé — isolation multi-tenant systématique"],
        ["CVE-B10 — Validation MDP absente dans update()/create()", "Moyenne", "UtilisateurController::update() + create()",  "Corrigé — vérification force appliquée"],
        ["CVE-B11 — byEmail accessible aux adhérents (RGPD)",      "Moyenne",  "UtilisateurController::byEmail()",            "Corrigé — restriction aux rôles staff minimum"],
        ["CVE-B12 — Statut exemplaire non validé",                 "Moyenne",  "ExemplaireController::create() + update()",   "Corrigé — whitelist : disponible/emprunte/indisponible"],
        ["CVE-B13 — Isolation multi-tenant absente (show/byAdh.)", "Moyenne",  "PretController::show() + byAdherent()",       "Corrigé — contrôle bibliotheque_id ajouté"],
        ["CVE-B14 — Auto-modif. MDP sans vérif. MDP actuel",       "Haute",    "UtilisateurController::update()",             "Corrigé — current_password requis pour self-update"],
        ["BUG-01 — Champ mot_de_passe vs password (frontend)",     "—",        "MonComptePage.tsx",                           "Corrigé — champ password aligné avec l'API"],
      ],
      [2800, 1200, 2500, 3000]
    ),
    br(),
    h2("6.5  Hachage des mots de passe — Argon2id"),
    ...codeBlock([
      "# security.yaml",
      "security:",
      "  password_hashers:",
      "    App\\Entity\\Utilisateur:",
      "      algorithm: argon2id",
      "      memory_cost: 65536  # 64 MB",
      "      time_cost: 4        # 4 itérations",
    ]),
    p("Argon2id est l'algorithme recommandé par OWASP pour le hachage des mots de passe. Il est résistant aux attaques GPU et side-channel. Le coût mémoire de 64 MB rend les attaques par dictionnaire massivement parallèles non viables."),
    br(),
    h2("6.6  Refresh Token — Implémentation"),
    ...codeBlock([
      "// Entity RefreshToken (table refresh_tokens)",
      "#[ORM\\Entity]",
      "class RefreshToken",
      "{",
      "    #[ORM\\Column(type: 'string', length: 64)]",
      "    private string $token;  // bin2hex(random_bytes(32))",
      "",
      "    #[ORM\\ManyToOne(targetEntity: Utilisateur::class)]",
      "    #[ORM\\JoinColumn(onDelete: 'CASCADE')]",
      "    private Utilisateur $utilisateur;",
      "",
      "    #[ORM\\Column(type: 'datetime_immutable')]",
      "    private \\DateTimeImmutable $expiresAt;  // now + 30 jours",
      "",
      "    #[ORM\\Column(type: 'datetime_immutable')]",
      "    private \\DateTimeImmutable $createdAt;",
      "    // Pas de champ revokedAt — la rotation supprime l'ancien token (em->remove)",
      "}",
      "",
      "// AuthController::refresh() — flux rotation :",
      "// 1. findValidToken() : EXISTS + expiresAt > now",
      "// 2. em->remove($oldToken)  ← suppression physique (pas de revokedAt)",
      "// 3. new RefreshToken($user) → persist + flush",
      "// 4. Retourne nouveau access_token + nouveau refresh_token",
    ]),
    pageBreak(),
  ];
}

// SECTION TESTS (Jalon 5)
function sectionTests() {
  return [
    h1("Partie 7 — Tests"),
    br(),
    h2("7.1  Stratégie de tests"),
    p("La stratégie de tests BiblioTech distingue tests unitaires (logique métier isolée) et tests d'intégration (comportement des contrôleurs avec base de données en mémoire)."),
    makeTable(
      ["Type", "Framework", "Base de données", "Nombre de tests"],
      [
        ["Tests unitaires",      "PHPUnit 11",  "Aucune (mocks)",        "13 tests (2 suites)"],
        ["Tests d'intégration",  "PHPUnit 11",  "PostgreSQL (docker-compose CI)", "54 tests (6 suites)"],
        ["Total",                "",            "",                      "67 tests, 8 suites"],
      ],
      [2000, 1800, 2500, 3200]
    ),
    br(),
    h2("7.2  Résultats PHPUnit"),
    ...codeBlock([
      "PHPUnit 11.x — Tests BiblioTech",
      "",
      "Unit/Service/PretServiceTest .................. 7 tests  OK",
      "Unit/Service/GoogleBooksServiceTest ........... 6 tests  OK",
      "",
      "Integration/Controller/AuthControllerTest ..... 6 tests  OK",
      "Integration/Controller/BibliothequeControllerTest 9 tests  OK",
      "Integration/Controller/ExemplaireControllerTest  9 tests  OK",
      "Integration/Controller/LivreControllerTest .... 7 tests  OK",
      "Integration/Controller/PretControllerTest ..... 8 tests  OK",
      "Integration/Controller/UtilisateurControllerTest 15 tests  OK",
      "",
      "Tests: 67, OK (67 tests, 8 suites)",
    ]),
    br(),
    h2("7.3  Détail des suites de tests"),
    h3("7.3.1  PretServiceTest (7 tests)"),
    makeTable(
      ["Test", "Description"],
      [
        ["testCreatePret()",                 "Crée un prêt, vérifie que l'exemplaire passe à EMPRUNTE"],
        ["testCreatePretExemplaireIndispo()", "Exception si exemplaire non DISPONIBLE"],
        ["testRetourPret()",                 "Retour normal → exemplaire DISPONIBLE, date_retour_effective setée"],
        ["testRetourPretDeteriore()",        "Retour avec état DETERIORE → exemplaire passe à DETERIORE"],
        ["testSignalerPerdu()",              "Exemplaire passe à PERDU, prêt clôturé"],
        ["testCalculDateRetour()",           "Date retour = date_pret + duret_pret_jours bibliothèque"],
        ["testIsEnRetard()",                 "Retourne true si date_retour_prevue dépassée et pas de retour"],
      ],
      [2800, 6700]
    ),
    br(),
    h3("7.3.2  UtilisateurControllerTest (15 tests)"),
    makeTable(
      ["Test", "Description"],
      [
        ["testCreateUtilisateur()",           "Admin crée un utilisateur dans sa bibliothèque → 201"],
        ["testCreateDuplicateEmail()",        "Email déjà utilisé → 409 Conflict"],
        ["testCreateByBibliothecaire()",      "Bibliothécaire tente de créer → 403"],
        ["testGetUtilisateurs()",             "Admin liste les utilisateurs de sa bibliothèque"],
        ["testGetUtilisateursCrossLibrary()", "Admin ne voit pas les utilisateurs d'une autre bibliothèque"],
        ["testDeleteUtilisateur()",           "Admin supprime un adhérent → 200"],
        ["testDeleteSelf()",                  "Utilisateur ne peut pas se supprimer lui-même → 403"],
        ["testChangePassword()",             "Premier login : changement mot de passe → must_change_password = false"],
        ["testChangePasswordWrongOld()",     "Mauvais mot de passe actuel → 400"],
        ["testAcceptCgu()",                  "Acceptation CGU → cgu_accepted_version mise à jour"],
        ["testAcceptCguAlreadyAccepted()",   "CGU déjà acceptées → 200 idempotent"],
        ["testBruteForce()",                 "5 tentatives échouées → 429 + locked_until"],
        ["testUnlockAfterLockout()",         "Après le délai, connexion possible à nouveau"],
        ["testUpdateUtilisateur()",          "Modification nom/prénom → 200"],
        ["testSuperAdminCanSeeAllLibraries()","Super admin liste utilisateurs de toutes les bibliothèques"],
      ],
      [3200, 6300]
    ),
    br(),
    h2("7.4  Couverture et configuration"),
    h3("7.4.1  phpunit.xml"),
    ...codeBlock([
      "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
      "<phpunit xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"",
      "    xsi:noNamespaceSchemaLocation=\"vendor/phpunit/phpunit/phpunit.xsd\"",
      "    bootstrap=\"tests/bootstrap.php\"",
      "    colors=\"true\">",
      "    <testsuites>",
      "        <testsuite name=\"Unit\">",
      "            <directory>tests/Unit</directory>",
      "        </testsuite>",
      "        <testsuite name=\"Integration\">",
      "            <directory>tests/Integration</directory>",
      "        </testsuite>",
      "    </testsuites>",
      "</phpunit>",
    ]),
    br(),
    h3("7.4.2  Capture CI — Tests verts"),
    imagePlaceholder("Mettre screenshot GitHub Actions — Build CI avec les 67 tests PHPUnit verts"),
    placeholderCaption("Figure 7.1 — Pipeline CI/CD GitHub Actions : job backend-tests avec 67 tests verts"),
    pageBreak(),
  ];
}

// SECTION INFRASTRUCTURE / CI-CD (Jalon 6)
function sectionInfrastructure() {
  return [
    h1("Partie 8 — Infrastructure, CI/CD & Déploiement"),
    br(),
    h2("8.1  Architecture Docker"),
    imagePlaceholder("Mettre le diagramme Docker Compose (services backend / frontend / db)"),
    placeholderCaption("Figure 8.1 — Architecture Docker Compose : 3 services (backend PHP-FPM+Nginx, frontend Node build, PostgreSQL)"),
    br(),
    h2("8.2  Dockerfiles"),
    h3("8.2.1  Backend — PHP-FPM + Nginx"),
    ...codeBlock([
      "# Dockerfile backend (multi-stage)",
      "FROM php:8.3-fpm AS base",
      "",
      "# Extensions PHP requises",
      "RUN docker-php-ext-install pdo pdo_pgsql intl opcache",
      "RUN pecl install apcu && docker-php-ext-enable apcu",
      "",
      "# Composer",
      "COPY --from=composer:latest /usr/bin/composer /usr/bin/composer",
      "",
      "FROM base AS production",
      "WORKDIR /var/www/html",
      "COPY . .",
      "RUN composer install --no-dev --optimize-autoloader",
      "",
      "# Entrypoint : migrations + warmup cache + php-fpm",
      "COPY docker-entrypoint.sh /usr/local/bin/entrypoint.sh",
      "RUN chmod +x /usr/local/bin/entrypoint.sh",
      "ENTRYPOINT [\"/usr/local/bin/entrypoint.sh\"]",
    ]),
    br(),
    h3("8.2.2  Frontend — Build statique"),
    ...codeBlock([
      "# Dockerfile frontend (multi-stage)",
      "FROM node:20-alpine AS builder",
      "WORKDIR /app",
      "COPY package*.json .",
      "RUN npm ci",
      "COPY . .",
      "RUN npm run build",
      "",
      "FROM nginx:alpine AS production",
      "COPY --from=builder /app/dist /usr/share/nginx/html",
      "COPY nginx.conf /etc/nginx/conf.d/default.conf",
      "EXPOSE 80",
    ]),
    br(),
    h2("8.3  Docker Compose — Développement local"),
    ...codeBlock([
      "# dev/docker/docker-compose.yml",
      "version: '3.9'",
      "services:",
      "",
      "  app:                        # Backend Symfony",
      "    build:",
      "      context: ../backend     # chemin depuis dev/docker/",
      "      dockerfile: Dockerfile",
      "    ports: ['8080:80']",
      "    environment:",
      "      DATABASE_URL: postgresql://bibliotech:secret@db:5432/bibliotech",
      "      JWT_SECRET_KEY: '%kernel.project_dir%/config/jwt/private.pem'",
      "      JWT_PUBLIC_KEY: '%kernel.project_dir%/config/jwt/public.pem'",
      "      JWT_PASSPHRASE: ${JWT_PASSPHRASE}",
      "    depends_on: [db]",
      "    networks: [bibliotech_net]",
      "",
      "  frontend:",
      "    build:",
      "      context: ../frontend",
      "      dockerfile: Dockerfile",
      "    ports: ['5173:5173']",
      "    environment:",
      "      VITE_API_URL: http://localhost:8080/api",
      "    depends_on: [app]",
      "    networks: [bibliotech_net]",
      "",
      "  db:",
      "    image: postgres:16-alpine",
      "    environment:",
      "      POSTGRES_DB: bibliotech",
      "      POSTGRES_USER: bibliotech",
      "      POSTGRES_PASSWORD: secret",
      "    volumes: ['db_data:/var/lib/postgresql/data']",
      "    networks: [bibliotech_net]",
      "",
      "volumes:",
      "  db_data:",
      "networks:",
      "  bibliotech_net:",
    ]),
    br(),
    h2("8.4  Pipeline CI/CD — GitHub Actions"),
    p("La pipeline CI/CD est déclenchée à chaque push sur les branches develop et main. Elle comporte 3 jobs indépendants :"),
    makeTable(
      ["Job", "Déclencheur", "Actions", "Résultat"],
      [
        ["backend-tests",  "Push toutes branches",    "Install PHP 8.3 + extensions → composer install → phpunit (PostgreSQL service container)", "✅ 67 tests"],
        ["frontend-lint",  "Push toutes branches",    "Install Node 20 → npm ci → tsc --noEmit (TypeScript strict)",                              "✅ 0 erreur"],
        ["docker-build",   "Push tag v*.*.* (release)","Build + push bibliotech-backend ET bibliotech-frontend → Docker Hub",                     "✅ 2 images publiées"],
      ],
      [1800, 2000, 3500, 2200]
    ),
    br(),
    h3("8.4.1  Job backend-tests"),
    ...codeBlock([
      "# .github/workflows/ci.yml",
      "jobs:",
      "  backend-tests:",
      "    runs-on: ubuntu-latest",
      "    services:",
      "      postgres:",
      "        image: postgres:16-alpine",
      "        env:",
      "          POSTGRES_DB: bibliotech_test",
      "          POSTGRES_USER: bibliotech",
      "          POSTGRES_PASSWORD: secret",
      "        ports: ['5432:5432']",
      "        options: --health-cmd pg_isready",
      "    steps:",
      "      - uses: actions/checkout@v4",
      "      - uses: shivammathur/setup-php@v2",
      "        with: { php-version: '8.3', extensions: 'pdo_pgsql, intl, mbstring, ctype, iconv' }",
      "      - run: composer install --no-interaction --prefer-dist",
      "        working-directory: dev/backend",
      "      - run: php bin/console doctrine:migrations:migrate --no-interaction --env=test",
      "        working-directory: dev/backend",
      "      - run: php bin/phpunit --testdox",
      "        working-directory: dev/backend",
      "        env:",
      "          DATABASE_URL: postgresql://bibliotech:secret@localhost:5432/bibliotech_test",
    ]),
    br(),
    h3("8.4.2  Job frontend-lint"),
    ...codeBlock([
      "  frontend-lint:",
      "    runs-on: ubuntu-latest",
      "    steps:",
      "      - uses: actions/checkout@v4",
      "      - uses: actions/setup-node@v4",
      "        with: { node-version: '20' }",
      "      - run: npm ci",
      "        working-directory: dev/frontend",
      "      - run: npx tsc --noEmit",
      "        working-directory: dev/frontend",
    ]),
    br(),
    h2("8.5  Déploiement production"),
    makeTable(
      ["Composant", "Hébergeur", "Service", "URL"],
      [
        ["Backend API",     "Render",    "Web Service (Docker)",    "https://bibliotech-api.onrender.com"],
        ["Frontend SPA",    "Render",    "Static Site",             "https://bibliotech.onrender.com"],
        ["Base de données", "Supabase",  "PostgreSQL 16 managé",    "supabase.com (connection pooling PgBouncer)"],
      ],
      [1800, 1500, 2500, 3700]
    ),
    br(),
    h3("8.5.1  Variables d'environnement de production"),
    makeTable(
      ["Variable", "Description", "Valeur (exemple)"],
      [
        ["DATABASE_URL",         "URL de connexion PostgreSQL Supabase",   "postgresql://user:pass@db.supabase.co:5432/postgres"],
        ["JWT_SECRET_KEY",       "Chemin clé privée RS256",                "/var/www/html/config/jwt/private.pem"],
        ["JWT_PUBLIC_KEY",       "Chemin clé publique RS256",              "/var/www/html/config/jwt/public.pem"],
        ["JWT_PASSPHRASE",       "Passphrase clé JWT",                     "Secret (injecté via Render env vars)"],
        ["APP_ENV",              "Environnement Symfony",                  "prod"],
        ["APP_SECRET",           "Secret CSRF Symfony",                    "Généré aléatoirement (32 caractères hex)"],
        ["CORS_ALLOW_ORIGIN",    "Origine autorisée (CORS)",               "https://bibliotech.onrender.com"],
        ["VITE_API_URL",         "URL de l'API (frontend build)",          "https://bibliotech-api.onrender.com"],
      ],
      [2500, 3000, 4000]
    ),
    br(),
    h3("8.5.2  Capture CI — Pipeline GitHub Actions"),
    imagePlaceholder("Mettre screenshot GitHub Actions — Vue d'ensemble pipeline CI/CD (3 jobs verts)"),
    placeholderCaption("Figure 8.2 — Pipeline CI/CD complète : backend-tests, frontend-lint, docker-build"),
    br(),
    imagePlaceholder("Mettre screenshot Render — Dashboard déploiement backend avec logs"),
    placeholderCaption("Figure 8.3 — Render dashboard : backend API déployé, logs Docker entrypoint"),
    br(),
    imagePlaceholder("Mettre screenshot Supabase — Base de données PostgreSQL en production"),
    placeholderCaption("Figure 8.4 — Supabase : tables BiblioTech créées, connexions actives"),
    pageBreak(),
  ];
}

// SECTION RGPD (Jalon 6)
function sectionRgpd() {
  return [
    h1("Partie 9 — Conformité RGPD"),
    br(),
    h2("9.1  Registre des traitements"),
    p("Conformément au RGPD (Règlement (UE) 2016/679), un registre des traitements a été établi pour BiblioTech. Ce registre recense toutes les activités de traitement de données personnelles."),
    makeTable(
      ["Traitement", "Finalité", "Données traitées", "Durée conservation", "Base légale"],
      [
        ["Comptes utilisateurs",   "Accès à l'application",     "Email, nom, prénom, mot de passe (hash)",        "Durée de l'abonnement + 1 an",  "Contrat (Art. 6.1.b)"],
        ["Historique des prêts",   "Suivi des emprunts",        "Prêts associés à un adhérent (ID livre, dates)",  "3 ans",                         "Intérêt légitime (Art. 6.1.f)"],
        ["Logs d'authentification","Sécurité (brute-force)",    "IP, timestamp, email tenté",                     "30 jours",                      "Intérêt légitime (Art. 6.1.f)"],
        ["Demandes de migration",  "Transfert inter-bibliothèque","Identifiants bibliothèques source/cible, statut","1 an après traitement",        "Contrat (Art. 6.1.b)"],
        ["Acceptation CGU",        "Preuve de consentement",    "Identifiant version CGU, date d'acceptation",    "Durée du compte + 5 ans",       "Obligation légale (Art. 6.1.c)"],
      ],
      [2000, 1800, 2800, 1800, 1800]
    ),
    br(),
    h2("9.2  Droits des personnes concernées"),
    makeTable(
      ["Droit", "Article RGPD", "Implémentation dans BiblioTech"],
      [
        ["Droit d'accès",          "Art. 15",  "GET /api/utilisateurs/me — retourne toutes les données de l'utilisateur connecté"],
        ["Droit de rectification", "Art. 16",  "PATCH /api/utilisateurs/{id} — modification nom, prénom, email"],
        ["Droit à l'effacement",   "Art. 17",  "DELETE /api/utilisateurs/{id} — suppression complète (admin) ou anonymisation (super_admin)"],
        ["Droit à la portabilité", "Art. 20",  "Export JSON des données personnelles sur demande (endpoint dédié prévu)"],
        ["Droit d'opposition",     "Art. 21",  "Désactivation du compte (actif = false) sans suppression immédiate des données"],
      ],
      [2000, 1200, 6300]
    ),
    br(),
    h2("9.3  Minimisation des données"),
    bullet("Seules les données strictement nécessaires sont collectées — pas de numéro de téléphone, pas de date de naissance"),
    bullet("Les mots de passe ne sont jamais stockés en clair — uniquement le hash Argon2id"),
    bullet("Les adresses IP de connexion ne sont pas persistées en base de données"),
    bullet("Les logs Monolog sont configurés pour ne pas loguer les mots de passe"),
    br(),
    h2("9.4  Mesures de sécurité des données"),
    bullet("Chiffrement en transit — HTTPS obligatoire (TLS 1.3) sur Render"),
    bullet("Chiffrement au repos — Supabase (PostgreSQL) chiffre les données sur disque (AES-256)"),
    bullet("Accès à la base de données restreint — seul le backend a les credentials BDD"),
    bullet("Isolation multi-tenant — un utilisateur ne peut accéder qu'aux données de sa bibliothèque"),
    bullet("Sauvegarde automatique — Supabase effectue des snapshots quotidiens (7 jours de rétention)"),
    br(),
    h2("9.5  CGU et consentement"),
    p("Le mécanisme de CGU versionnées de BiblioTech implémente un consentement explicite et traçable :"),
    bullet("Les CGU sont publiées avec un préavis minimum de 15 jours (date_effet >= NOW() + 15j)"),
    bullet("À la date d'effet, les utilisateurs n'ayant pas accepté les nouvelles CGU sont bloqués (HTTP 422)"),
    bullet("L'acceptation est tracée en base avec la version et la date d'acceptation"),
    bullet("Lors du premier login, l'acceptation des CGU est obligatoire avant tout accès à l'application"),
    pageBreak(),
  ];
}

// SECTION BILAN (Jalon 6)
function sectionBilan() {
  return [
    h1("Partie 10 — Bilan & Perspectives"),
    br(),
    h2("10.1  Conformité au Cahier des Charges"),
    makeTable(
      ["Exigence CDC", "Statut", "Commentaire"],
      [
        ["Authentification sécurisée (JWT RS256)",              "✅ Réalisé",      "JWT RS256 4096-bit + Refresh Token rotation"],
        ["Gestion catalogue CRUD + ISBN",                       "✅ Réalisé",      "Google Books API intégrée"],
        ["Gestion des adhérents",                               "✅ Réalisé",      "CRUD complet avec RBAC 4 rôles"],
        ["Module prêts/retours",                                "✅ Réalisé",      "PretService avec états exemplaire automatiques"],
        ["Tableau de bord avec statistiques",                   "✅ Réalisé",      "Stats en temps réel, prêts en retard"],
        ["Multi-tenant avec isolation stricte",                 "✅ Réalisé",      "bibliotheque_id systématique sur tous les endpoints"],
        ["OWASP Top 10 couvert",                                "✅ Réalisé",      "Audit complet Jalon 6 — 14 CVE corrigées"],
        ["Tests unitaires + intégration",                       "✅ Réalisé",      "67 tests, 8 suites, 100% verts"],
        ["Pipeline CI/CD",                                      "✅ Réalisé",      "3 jobs GitHub Actions (PHPUnit + TSC + Docker)"],
        ["Déploiement production",                              "✅ Réalisé",      "Render (backend + frontend) + Supabase (BDD)"],
        ["Conformité RGPD",                                     "✅ Réalisé",      "Registre de traitement, droit à l'oubli, Argon2id"],
        ["CGU versionnées avec préavis",                        "✅ Réalisé",      "15 jours de préavis, acceptation obligatoire, HTTP 422"],
        ["Premier login (mdp + CGU)",                          "✅ Réalisé",      "must_change_password + cgu_accepted_version dans JWT"],
        ["Protection brute-force",                              "✅ Réalisé",      "Lockout 15 min après 5 tentatives échouées"],
        ["Prêts perdus",                                        "✅ Réalisé",      "Signalement → état PERDU permanent"],
        ["Durée de prêt configurable par bibliothèque",         "✅ Réalisé",      "Champ duret_pret_jours INTEGER sur Bibliotheque"],
        ["Demandes de migration inter-bibliothèques",           "✅ Réalisé",      "Workflow complet adherent → super_admin"],
        ["Bannière bibliothèque inactive",                      "✅ Réalisé",      "BibliothequeInactiveBanner.tsx"],
      ],
      [3500, 1500, 4500]
    ),
    br(),
    h2("10.2  Indicateurs de qualité"),
    makeTable(
      ["Indicateur", "Cible", "Obtenu"],
      [
        ["Tests unitaires",              "≥ 10 tests",       "13 tests (2 suites)"],
        ["Tests d'intégration",          "≥ 30 tests",       "54 tests (6 suites)"],
        ["Total tests",                  "≥ 40 tests",       "67 tests ✅"],
        ["Pipeline CI verte",            "100% builds verts","100% ✅"],
        ["Vulnérabilités OWASP",         "0 critique",       "0 (14 corrigées au J6) ✅"],
        ["Couverture RGPD",              "Registre + droit à l'oubli","Complet ✅"],
        ["Endpoints documentés",         "≥ 20",             "32 endpoints ✅"],
        ["Rôles RBAC",                   "≥ 3",              "4 rôles hiérarchiques ✅"],
      ],
      [3000, 2500, 4000]
    ),
    br(),
    h2("10.3  Difficultés rencontrées et solutions"),
    makeTable(
      ["Difficulté", "Impact", "Solution appliquée"],
      [
        ["Complexité du multi-tenant",    "Élevé",  "Filtre bibliotheque_id systématique dans Repository + vérification dans chaque Controller"],
        ["Refresh Token rotation sécurisée","Moyen","Table RefreshToken dédiée avec révocation en BDD à chaque /refresh"],
        ["CGU avec préavis légal",        "Moyen",  "Validation dateEffet >= NOW()+15j dans CguController + middleware ProtectedRoute"],
        ["Clé JWT dans Git",              "Élevé",  "Rotation complète de la paire de clés + ajout au .gitignore"],
        ["Tests d'intégration PostgreSQL","Moyen",  "Service postgres dans GitHub Actions CI avec health check pg_isready"],
        ["TypeScript strict frontend",    "Faible", "tsc --noEmit dans CI + validation des types API via types/index.ts"],
      ],
      [2500, 1200, 5800]
    ),
    br(),
    h2("10.4  Perspectives d'évolution"),
    h3("10.4.1  Court terme (V2.0)"),
    bullet("Réservation en ligne par les adhérents — liste d'attente sur un exemplaire"),
    bullet("Notifications email (retards, CGU, approbation migration) — Symfony Mailer"),
    bullet("Export CSV/PDF des états de stock et des prêts en retard"),
    bullet("API publique de consultation du catalogue (lecture seule, sans authentification)"),
    br(),
    h3("10.4.2  Moyen terme (V3.0)"),
    bullet("Application mobile React Native ou PWA installable"),
    bullet("Module statistiques avancées (Chart.js) avec tendances mensuelles"),
    bullet("Scan de codes-barres ISBN depuis l'interface (WebRTC)"),
    bullet("Intégration d'une base de données externe (BnF, OpenLibrary) pour enrichir les métadonnées"),
    br(),
    h3("10.4.3  Long terme"),
    bullet("Module de prêt entre bibliothèques (prêt inter-tenant avec accord super_admin)"),
    bullet("Intelligence artificielle — recommandation de livres basée sur l'historique de prêts"),
    bullet("API ouverte pour intégration avec d'autres SIGB existants"),
    br(),
    h2("10.5  Conclusion"),
    p("Le projet BiblioTech constitue une démonstration concrète des compétences attendues dans le cadre du titre CDA (Concepteur Développeur d'Applications). En six jalons, il a progressé d'un cahier des charges fonctionnel à une application SaaS multi-tenant déployée en production."),
    p("Les points forts du projet sont :"),
    bullet("Une architecture MVC Symfony rigoureuse avec séparation stricte des responsabilités"),
    bullet("Un système de sécurité multi-couche : JWT RS256, RBAC inline, protection brute-force, audit OWASP"),
    bullet("Une stratégie de tests complète : 67 tests en 8 suites, tous verts en CI"),
    bullet("Un pipeline DevOps complet : GitHub Actions → Docker → Render → Supabase"),
    bullet("Une conformité RGPD documentée avec registre de traitement et droit à l'oubli opérationnel"),
    p("BiblioTech répond à l'ensemble des exigences du cahier des charges initial et constitue une base solide pour les évolutions futures décrites dans la section précédente.", { italic: false }),
    br(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "— Fin du dossier de projet BiblioTech —", size: 22, color: "9CA3AF", italic: true, font: FONT_MAIN })],
      spacing: { before: 400, after: 200 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "Grégory Sergent  ·  g.sergent@ecole-ipssi.net  ·  IPSSI CDA 2026", size: 20, color: "9CA3AF", font: FONT_MAIN })],
    }),
  ];
}

// ─── ASSEMBLAGE DU DOCUMENT ───────────────────────────────────────────────────

async function generate() {
  const coverChildren = coverPage();
  const bodyChildren  = [
    ...sectionContexte(),
    ...sectionMethodologie(),
    ...sectionBaseDeDonnees(),
    ...sectionArchitecture(),
    ...sectionDeveloppementBackend(),
    ...sectionSecurite(),
    ...sectionTests(),
    ...sectionInfrastructure(),
    ...sectionRgpd(),
    ...sectionBilan(),
  ];

  const pageMargin = {
    top:    mm(25),
    bottom: mm(22),
    left:   mm(25),
    right:  mm(20),
    header: mm(10),
    footer: mm(10),
  };

  const doc = new Document({
    creator: "Grégory Sergent",
    title: "Dossier de projet BiblioTech — CDA IPSSI 2026",
    description: "Dossier de projet complet BiblioTech (Jalons 1 à 6)",
    sections: [
      // Section 1 : page de couverture (sans en-tête ni pied de page)
      {
        properties: {
          page: { margin: pageMargin },
          titlePage: true,
        },
        headers: {
          default: createFirstPageHeader(),
          first:   createFirstPageHeader(),
        },
        footers: {
          default: createFirstPageFooter(),
          first:   createFirstPageFooter(),
        },
        children: coverChildren,
      },
      // Section 2 : corps du document (avec en-tête et pied de page)
      {
        properties: {
          page: { margin: pageMargin },
        },
        headers: { default: createHeader() },
        footers: { default: createFooter() },
        children: bodyChildren,
      },
    ],
    styles: {
      default: {
        document: {
          run: { font: FONT_MAIN, size: 22, color: C.TEXT },
          paragraph: { spacing: { line: 276, lineRule: "auto" } },
        },
      },
    },
  });

  const buffer = await Packer.toBuffer(doc);
  const out = "dossier-projet-bibliotech-gregory-sergent.docx";
  fs.writeFileSync(out, buffer);
  console.log(`✅ Généré : ${out}  (${(buffer.length / 1024).toFixed(0)} KB)`);
}

generate().catch(err => { console.error(err); process.exit(1); });
