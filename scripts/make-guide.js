const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  LevelFormat, ExternalHyperlink,
} = require("docx");
const fs = require("fs");

// ── Color palette ──────────────────────────────────────────────────
const C = {
  teal:     "1B6E8C",
  gold:     "8C6A1B",
  dark:     "1A1A2E",
  muted:    "555577",
  code_bg:  "F0F4F8",
  warn_bg:  "FFF8E7",
  warn_bdr: "E0A020",
  ok_bg:    "F0FFF4",
  ok_bdr:   "38A169",
  white:    "FFFFFF",
  light:    "E8F0F8",
  heading1: "0D3B5E",
  heading2: "1B5E8C",
  heading3: "2C7A7B",
};

// ── Helpers ────────────────────────────────────────────────────────
const b   = (t) => new TextRun({ text: t, bold: true });
const i   = (t) => new TextRun({ text: t, italics: true });
const code = (t) => new TextRun({ text: t, font: "Courier New", size: 18, color: C.teal, bold: true });
const plain = (t) => new TextRun({ text: t });
const link  = (url, label) => new ExternalHyperlink({ link: url, children: [new TextRun({ text: label, style: "Hyperlink" })] });

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, bold: true, color: C.heading1, size: 32 })],
    spacing: { before: 360, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.heading1, space: 4 } },
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, bold: true, color: C.heading2, size: 26 })],
    spacing: { before: 280, after: 140 },
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [new TextRun({ text, bold: true, color: C.heading3, size: 22 })],
    spacing: { before: 200, after: 100 },
  });
}

function p(...runs) {
  const children = runs.map((r) => typeof r === "string" ? plain(r) : r);
  return new Paragraph({ children, spacing: { before: 60, after: 80 } });
}

function codeBlock(lines) {
  const content = Array.isArray(lines) ? lines.join("\n") : lines;
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [new TableRow({ children: [
      new TableCell({
        borders,
        width: { size: 9360, type: WidthType.DXA },
        shading: { fill: "1E293B", type: ShadingType.CLEAR },
        margins: { top: 120, bottom: 120, left: 200, right: 200 },
        children: [new Paragraph({
          children: [new TextRun({
            text: content,
            font: "Courier New", size: 18, color: "E2E8F0",
          })],
        })],
      }),
    ]})]
  });
}

function warningBox(title, ...lines) {
  const children = [
    new Paragraph({ children: [new TextRun({ text: `⚠️  ${title}`, bold: true, color: C.gold, size: 22 })], spacing: { before: 40, after: 60 } }),
    ...lines.map((l) => new Paragraph({ children: [typeof l === "string" ? plain(l) : l], spacing: { before: 40, after: 40 }, indent: { left: 200 } })),
  ];
  return new Table({
    width: { size: 9360, type: WidthType.DXA }, columnWidths: [9360],
    rows: [new TableRow({ children: [new TableCell({
      borders: { top: { style: BorderStyle.SINGLE, size: 4, color: C.warn_bdr },
                 bottom: { style: BorderStyle.SINGLE, size: 4, color: C.warn_bdr },
                 left: { style: BorderStyle.SINGLE, size: 12, color: C.warn_bdr },
                 right: { style: BorderStyle.SINGLE, size: 1, color: C.warn_bdr } },
      width: { size: 9360, type: WidthType.DXA },
      shading: { fill: "FFF8E1", type: ShadingType.CLEAR },
      margins: { top: 100, bottom: 100, left: 160, right: 160 },
      children,
    })]})],
  });
}

function okBox(title, ...lines) {
  const children = [
    new Paragraph({ children: [new TextRun({ text: `✅  ${title}`, bold: true, color: "1B6E3C", size: 22 })], spacing: { before: 40, after: 60 } }),
    ...lines.map((l) => new Paragraph({ children: [typeof l === "string" ? plain(l) : l], spacing: { before: 40, after: 40 }, indent: { left: 200 } })),
  ];
  return new Table({
    width: { size: 9360, type: WidthType.DXA }, columnWidths: [9360],
    rows: [new TableRow({ children: [new TableCell({
      borders: { top: { style: BorderStyle.SINGLE, size: 4, color: C.ok_bdr },
                 bottom: { style: BorderStyle.SINGLE, size: 4, color: C.ok_bdr },
                 left: { style: BorderStyle.SINGLE, size: 12, color: C.ok_bdr },
                 right: { style: BorderStyle.SINGLE, size: 1, color: C.ok_bdr } },
      width: { size: 9360, type: WidthType.DXA },
      shading: { fill: "F0FFF4", type: ShadingType.CLEAR },
      margins: { top: 100, bottom: 100, left: 160, right: 160 },
      children,
    })]})],
  });
}

function bullet(ref, ...runs) {
  const children = runs.map((r) => typeof r === "string" ? plain(r) : r);
  return new Paragraph({
    numbering: { reference: ref, level: 0 },
    children,
    spacing: { before: 60, after: 60 },
  });
}

function spacer() {
  return new Paragraph({ children: [plain("")], spacing: { before: 60, after: 60 } });
}

function stepLabel(num, text) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA }, columnWidths: [600, 8760],
    rows: [new TableRow({ children: [
      new TableCell({
        borders: noBorders,
        width: { size: 600, type: WidthType.DXA },
        shading: { fill: C.heading2, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 100, right: 80 },
        verticalAlign: "center",
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${num}`, bold: true, color: C.white, size: 24 })] })],
      }),
      new TableCell({
        borders: noBorders,
        width: { size: 8760, type: WidthType.DXA },
        shading: { fill: C.light, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 160, right: 80 },
        children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 22, color: C.heading2 })] })],
      }),
    ]})]
  });
}

// ══════════════════════════════════════════════════════════════════
// DOCUMENTO
// ══════════════════════════════════════════════════════════════════

const doc = new Document({
  numbering: {
    config: [
      { reference: "bullets",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "sub",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "–", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 1080, hanging: 360 } } } }] },
    ]
  },
  styles: {
    default: {
      document: { run: { font: "Arial", size: 22 } },
    },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial" },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial" },
        paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 22, bold: true, font: "Arial" },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1260, bottom: 1440, left: 1260 },
      },
    },
    children: [

      // ── PORTADA ─────────────────────────────────────────────────
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "🌊  Chihiro's Lost Name", bold: true, size: 48, color: C.heading1 })],
        spacing: { before: 720, after: 120 },
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Guía de instalación y ejecución local", size: 28, color: C.muted })],
        spacing: { before: 0, after: 80 },
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Stellar Hacks: ZK Gaming Edition  ·  2026", size: 22, color: C.muted, italics: true })],
        spacing: { before: 0, after: 600 },
      }),

      // ── ARQUITECTURA ─────────────────────────────────────────────
      h1("Arquitectura del proyecto"),
      p("El monorepo tiene tres componentes que trabajan juntos para completar el flujo ZK:"),
      spacer(),
      new Table({
        width: { size: 9360, type: WidthType.DXA }, columnWidths: [2500, 3000, 3860],
        rows: [
          new TableRow({ children: [
            new TableCell({ borders, shading: { fill: C.heading2, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, width: { size: 2500, type: WidthType.DXA },
              children: [new Paragraph({ children: [new TextRun({ text: "Componente", bold: true, color: C.white })] })] }),
            new TableCell({ borders, shading: { fill: C.heading2, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, width: { size: 3000, type: WidthType.DXA },
              children: [new Paragraph({ children: [new TextRun({ text: "Herramientas", bold: true, color: C.white })] })] }),
            new TableCell({ borders, shading: { fill: C.heading2, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, width: { size: 3860, type: WidthType.DXA },
              children: [new Paragraph({ children: [new TextRun({ text: "Función", bold: true, color: C.white })] })] }),
          ]}),
          ...[
            ["gitBDB/", "React 19 · Vite 7 · isomorphic-git", "Frontend: simulador Git + panel ZK"],
            ["gitBDB-contracts/", "Rust · Soroban SDK 22 · stellar CLI", "Contrato on-chain: initialize() + recover_name()"],
            ["gitBDB-circuits/", "Noir 0.36+ · nargo · bb (Barretenberg)", "Circuito ZK: Poseidon2(secret,salt)==commit"],
            ["scripts/", "bash · Node.js 20+", "prove.sh + prove-server.js"],
          ].map(([comp, tools, fn], idx) => new TableRow({ children: [
            new TableCell({ borders, shading: { fill: idx % 2 === 0 ? C.light : C.white, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, width: { size: 2500, type: WidthType.DXA },
              children: [new Paragraph({ children: [code(comp)] })] }),
            new TableCell({ borders, shading: { fill: idx % 2 === 0 ? C.light : C.white, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, width: { size: 3000, type: WidthType.DXA },
              children: [new Paragraph({ children: [plain(tools)] })] }),
            new TableCell({ borders, shading: { fill: idx % 2 === 0 ? C.light : C.white, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, width: { size: 3860, type: WidthType.DXA },
              children: [new Paragraph({ children: [plain(fn)] })] }),
          ]})),
        ]
      }),
      spacer(),

      // ── REQUISITOS ───────────────────────────────────────────────
      h1("Requisitos previos"),

      h2("Software requerido"),
      new Table({
        width: { size: 9360, type: WidthType.DXA }, columnWidths: [2200, 2000, 5160],
        rows: [
          new TableRow({ children: [
            new TableCell({ borders, shading: { fill: C.heading2, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, width: { size: 2200, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Herramienta", bold: true, color: C.white })] })] }),
            new TableCell({ borders, shading: { fill: C.heading2, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, width: { size: 2000, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Versión mínima", bold: true, color: C.white })] })] }),
            new TableCell({ borders, shading: { fill: C.heading2, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, width: { size: 5160, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Instalación", bold: true, color: C.white })] })] }),
          ]}),
          ...[
            ["Node.js", "v20 LTS", "https://nodejs.org"],
            ["nargo (Noir)", "0.36+", "noirup: ver sección 2"],
            ["bb (Barretenberg)", "0.66+", "bbup: ver sección 2"],
            ["Rust + cargo", "stable", "https://rustup.rs"],
            ["stellar CLI", "cualquiera", "cargo install stellar-cli"],
            ["Freighter (browser)", "cualquiera", "https://freighter.app"],
            ["git", "cualquiera", "preinstalado o https://git-scm.com"],
          ].map(([tool, ver, url], idx) => new TableRow({ children: [
            new TableCell({ borders, shading: { fill: idx%2===0?C.light:C.white, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, width: { size: 2200, type: WidthType.DXA }, children: [new Paragraph({ children: [b(tool)] })] }),
            new TableCell({ borders, shading: { fill: idx%2===0?C.light:C.white, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, width: { size: 2000, type: WidthType.DXA }, children: [new Paragraph({ children: [code(ver)] })] }),
            new TableCell({ borders, shading: { fill: idx%2===0?C.light:C.white, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, width: { size: 5160, type: WidthType.DXA }, children: [new Paragraph({ children: [code(url)] })] }),
          ]})),
        ]
      }),

      // ── SECCIÓN 1: CLONADO Y FRONTEND ────────────────────────────
      spacer(),
      h1("Sección 1 — Frontend (gitBDB)"),

      stepLabel("1.1", "Clonar el repositorio"),
      spacer(),
      codeBlock([
        "# Opción A: clonar el repo completo",
        "git clone https://github.com/<tu-usuario>/gitBDB.git",
        "cd gitBDB",
        "",
        "# Opción B: si ya tenés el ZIP (gitBDB-chihiro-mvp-v10.zip)",
        "unzip gitBDB-chihiro-mvp-v10.zip",
        "cd gitBDB  # o el directorio raíz del proyecto",
      ]),

      spacer(),
      stepLabel("1.2", "Configurar variables de entorno"),
      spacer(),
      p("Copiá el archivo de ejemplo y completalo con los valores del deploy:"),
      codeBlock([
        "cd gitBDB",
        "cp .env.example .env",
        "",
        "# Editá .env con tu editor favorito:",
        "nano .env",
        "# o: code .env",
      ]),
      spacer(),
      p("Contenido de ", code(".env"), ":"),
      codeBlock([
        "# Contrato ChihiroGame en Stellar Testnet (deploy en Sección 3)",
        "VITE_CHIHIRO_CONTRACT_ID=C...",
        "",
        "# UltraHonk Verifier (deploy en Sección 3)",
        "VITE_ULTRAHONK_VERIFIER_ID=C...",
        "",
        "# Game Hub — NO cambiar, es fijo del hackathon",
        "# VITE_GAME_HUB_ID=CB4VZAT2U3UC6XFK3N23SKRF2NDCMP3QHJYMCHHFMZO7MRQO6DQ2EMYG",
      ]),
      spacer(),
      warningBox(
        ".env nunca va al repo",
        "El archivo .gitignore ya lo excluye automáticamente.",
        "NUNCA commitees VITE_CHIHIRO_CONTRACT_ID ni keys privadas.",
      ),

      spacer(),
      stepLabel("1.3", "Instalar dependencias y levantar el dev server"),
      spacer(),
      codeBlock([
        "cd gitBDB",
        "npm install",
        "",
        "# Correr los tests (debe pasar 26/26):",
        "npm run test",
        "",
        "# Levantar el frontend:",
        "npm run dev",
        "# → http://localhost:5173",
      ]),
      spacer(),
      okBox("Esperado", "26 tests pasando", "Dev server en http://localhost:5173"),

      // ── SECCIÓN 2: CIRCUITO ZK ───────────────────────────────────
      spacer(),
      h1("Sección 2 — Circuito ZK (nargo + bb)"),

      h2("2.1  Instalar nargo (Noir)"),
      codeBlock([
        "# Instalar noirup (gestor de versiones de Noir):",
        "curl -L https://raw.githubusercontent.com/noir-lang/noirup/main/install | bash",
        "",
        "# Agregar al PATH (bash/zsh):",
        'export PATH="$HOME/.nargo/bin:$PATH"',
        "# → Agregar esa línea a ~/.bashrc o ~/.zshrc",
        "",
        "# Instalar la versión estable de nargo:",
        "noirup",
        "",
        "# Verificar:",
        "nargo --version",
        "# → nargo version = 0.36.x",
      ]),

      h2("2.2  Instalar bb (Barretenberg)"),
      codeBlock([
        "# Instalar bbup:",
        "curl -L https://raw.githubusercontent.com/AztecProtocol/aztec-packages/master/barretenberg/bbup/install | bash",
        "",
        "# Instalar bb:",
        "bbup",
        "",
        "# Verificar:",
        "bb --version",
        "# → barretenberg version: 0.66.x",
      ]),

      h2("2.3  Compilar y testear el circuito"),
      codeBlock([
        "cd gitBDB-circuits/chihiro-name",
        "",
        "# Compilar el circuito (genera target/chihiro_name.json):",
        "nargo compile",
        "",
        "# Correr los tests del circuito:",
        "nargo test",
        "# → 4 tests pasando (valid proof, wrong secret, wrong salt, tampered)",
      ]),

      h2("2.4  Generar nameCommit y proof con prove.sh"),
      p("Primero convertí tu nombre secreto a hex:"),
      codeBlock([
        "# Convertir un string a hex field element:",
        'python3 -c "print(\'0x\' + \'chihiro\'.encode().hex())"',
        "# → 0x636869686972_6f",
        "",
        "# O con cualquier nombre:",
        'python3 -c "print(\'0x\' + \'sunombre\'.encode().hex())"',
      ]),
      spacer(),
      p("Luego correr el script de proof:"),
      codeBlock([
        "# Desde la raíz del monorepo:",
        "chmod +x scripts/prove.sh",
        "",
        "./scripts/prove.sh 0x636869686972_6f 0x1234abcd",
        "#    ^name_secret_hex                 ^salt_hex",
        "",
        "# Esto hace:",
        "#   1. nargo compile  → target/chihiro_name.json",
        "#   2. nargo execute  → target/witness.gz + calcula nameCommit",
        "#   3. bb prove       → target/proof + target/vk",
        "#   4. bb verify      → verifica la proof localmente",
        "#   5. genera         → target/proof.json (para el frontend)",
      ]),
      spacer(),
      p("Salida esperada en ", code("target/proof.json"), ":"),
      codeBlock([
        '{',
        '  "commit":         "0x1a2b3c...",   ← nameCommit (Poseidon2)',
        '  "proof_hex":      "0xabcdef...",   ← UltraHonk proof bytes',
        '  "vk_hex":         "0x112233...",   ← verification key',
        '  "public_inputs":  ["0x1a2b3c..."],',
        '  "name_secret_hex":"0x63686...",',
        '  "salt_hex":       "0x1234abcd",',
        '  "scheme":         "ultra_honk"',
        '}',
      ]),
      spacer(),
      warningBox(
        "proof.json contiene secretos",
        "El archivo proof.json tiene name_secret_hex y salt_hex.",
        "El .gitignore los excluye automáticamente.",
        "NO lo subas al repo ni lo compartas.",
      ),

      h2("2.5  (Opcional) prove-server — generación automática"),
      p("Para que el frontend genere la proof directamente sin copiar archivos:"),
      codeBlock([
        "# En una terminal separada (dejarlo corriendo):",
        "node scripts/prove-server.js",
        "# → http://localhost:4001",
        "",
        "# Verificar que esté activo:",
        "curl http://localhost:4001/health | python3 -m json.tool",
        "# → { ok: true, checks: { nargo: true, bb: true, prove_sh: true } }",
      ]),
      spacer(),
      p("Con el servidor corriendo, el panel ZK del frontend mostrará ", b("🟢 prove-server online"), " y podrá generar la proof automáticamente."),

      // ── SECCIÓN 3: CONTRATOS ─────────────────────────────────────
      spacer(),
      h1("Sección 3 — Contrato Soroban (Stellar Testnet)"),

      h2("3.1  Configurar Stellar CLI con una cuenta de testnet"),
      codeBlock([
        "# Instalar stellar CLI (requiere Rust):",
        "cargo install stellar-cli --features opt",
        "",
        "# Generar un par de claves para el admin:",
        "stellar keys generate admin --network testnet",
        "# → Guarda la public key (G...) y la secret key (S...)",
        "",
        "# Fondear la cuenta en testnet (faucet automático):",
        "stellar keys fund admin --network testnet",
        "# → Agrega 10,000 XLM de testnet",
        "",
        "# Verificar saldo:",
        "stellar account show --source admin --network testnet",
      ]),

      h2("3.2  Compilar el contrato"),
      codeBlock([
        "cd gitBDB-contracts",
        "",
        "# Agregar el target de WebAssembly:",
        "rustup target add wasm32v1-none",
        "",
        "# Correr los tests (no requieren red):",
        "cargo test",
        "",
        "# Compilar para producción:",
        "cargo build --target wasm32v1-none --release",
        "",
        "# El WASM estará en:",
        "# target/wasm32v1-none/release/chihiro_game.wasm",
      ]),

      h2("3.3  Deploy del contrato ChihiroGame"),
      codeBlock([
        "# Subir el WASM a Stellar Testnet y obtener el hash:",
        "stellar contract upload \\",
        "  --wasm target/wasm32v1-none/release/chihiro_game.wasm \\",
        "  --source admin \\",
        "  --network testnet",
        "# → Guarda el <WASM_HASH>",
        "",
        "# Deployar el contrato:",
        "stellar contract deploy \\",
        "  --wasm-hash <WASM_HASH> \\",
        "  --source admin \\",
        "  --network testnet",
        "# → Guarda el <CONTRATO_ID>  (C...)",
      ]),

      h2("3.4  Deploy del UltraHonk Verifier"),
      p("El verifier on-chain está en el repo oficial del hackathon:"),
      codeBlock([
        "# Clonar el verifier de Noir para Soroban:",
        "git clone https://github.com/yugocabrio/rs-soroban-ultrahonk",
        "cd rs-soroban-ultrahonk",
        "",
        "# Seguir las instrucciones de deploy del README.",
        "# Obtenés el <VERIFIER_ID> (C...)",
      ]),
      spacer(),
      warningBox(
        "Verifier predeployado en testnet",
        "Si el hackathon ya provee un verifier deployado, usá ese ID directamente.",
        "Preguntá en el canal de Discord del hackathon.",
      ),

      h2("3.5  Configurar .env con los IDs deployados"),
      codeBlock([
        "# En gitBDB/.env:",
        "VITE_CHIHIRO_CONTRACT_ID=C<tu_contrato_id>",
        "VITE_ULTRAHONK_VERIFIER_ID=C<verifier_id>",
      ]),
      spacer(),
      p("Reiniciá el dev server después de cambiar el ", code(".env"), ":"),
      codeBlock(["# Ctrl+C en la terminal del frontend, luego:", "npm run dev"]),

      // ── SECCIÓN 4: FLUJO COMPLETO ─────────────────────────────────
      spacer(),
      h1("Sección 4 — Flujo completo de la demo"),

      p("Con todo deployado y corriendo, este es el flujo exacto para demostrar el juego:"),
      spacer(),

      h2("4.1  Terminal setup (3 terminales)"),
      new Table({
        width: { size: 9360, type: WidthType.DXA }, columnWidths: [1200, 2400, 5760],
        rows: [
          new TableRow({ children: [
            new TableCell({ borders, shading: { fill: C.heading2, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, width: { size: 1200, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Terminal", bold: true, color: C.white })] })] }),
            new TableCell({ borders, shading: { fill: C.heading2, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, width: { size: 2400, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Comando", bold: true, color: C.white })] })] }),
            new TableCell({ borders, shading: { fill: C.heading2, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, width: { size: 5760, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Qué hace", bold: true, color: C.white })] })] }),
          ]}),
          ...[
            ["T1 (siempre)", "cd gitBDB && npm run dev", "Frontend en localhost:5173"],
            ["T2 (opcional)", "node scripts/prove-server.js", "API local para generar proofs (puerto 4001)"],
            ["T3 (cuando se necesite)", "./scripts/prove.sh 0x... 0x...", "Genera nameCommit + proof + vk"],
          ].map(([t, cmd, desc], idx) => new TableRow({ children: [
            new TableCell({ borders, shading: { fill: idx%2===0?C.light:C.white, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, width: { size: 1200, type: WidthType.DXA }, children: [new Paragraph({ children: [b(t)] })] }),
            new TableCell({ borders, shading: { fill: idx%2===0?C.light:C.white, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, width: { size: 2400, type: WidthType.DXA }, children: [new Paragraph({ children: [code(cmd)] })] }),
            new TableCell({ borders, shading: { fill: idx%2===0?C.light:C.white, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, width: { size: 5760, type: WidthType.DXA }, children: [new Paragraph({ children: [plain(desc)] })] }),
          ]})),
        ]
      }),
      spacer(),

      h2("4.2  Rol Admin — inicializar el juego"),
      bullet("numbers", "Ir a ", code("http://localhost:5173"), " → clic en ", b("Play"), " → ", code("/act/chihiro")),
      bullet("numbers", "En el panel ZK, seleccionar rol ", b("Admin (🏯)")),
      bullet("numbers", "Conectar Freighter (asegurate de estar en TESTNET)"),
      bullet("numbers", "Completar: Contract ID, Player2 address"),
      bullet("numbers", "Si el prove-server está corriendo: ingresar secret y salt → clic ", b("Calcular nameCommit (Poseidon2)")),
      bullet("numbers", "Si no: correr ", code("./scripts/prove.sh 0x<secret_hex> 0x<salt_hex>"), " y pegar el commit manualmente"),
      bullet("numbers", "Clic en ", b("Inicializar juego"), " → firmar la transacción en Freighter"),
      bullet("numbers", "Confirmar en Stellar Explorer que ", code("initialize()"), " se ejecutó"),
      spacer(),

      h2("4.3  Generar la proof (fuera del browser)"),
      codeBlock([
        "# Desde la raíz del repo:",
        "./scripts/prove.sh 0x<name_secret_hex> 0x<salt_hex>",
        "",
        "# Ejemplo con los valores de prueba del circuito:",
        "./scripts/prove.sh 0x63686968697261 0x1234abcd",
        "",
        "# Tarda 30-120 segundos.",
        "# Al terminar:",
        "#   ✓ nameCommit = 0x...",
        "#   ✓ Proof verificada localmente",
        "#   → gitBDB-circuits/chihiro-name/target/proof.json",
      ]),
      spacer(),
      warningBox(
        "Mismos valores que usó el Admin",
        "El Player debe usar EXACTAMENTE el mismo name_secret y salt",
        "que el Admin usó en initialize().",
        "Si los valores son distintos, el nameCommit no va a matchear.",
      ),
      spacer(),

      h2("4.4  Rol Player — completar el ritual Git"),
      bullet("numbers", "En el panel ZK, seleccionar rol ", b("Player (🌊)")),
      bullet("numbers", "Conectar wallet de Player2"),
      bullet("numbers", "En la terminal Git del juego, completar el ritual:"),
      spacer(),
      codeBlock([
        "git init",
        "git branch rescue/chihiro",
        "git checkout rescue/chihiro",
        "git commit -m 'clue:1'",
        "git commit -m 'clue:2'",
        "git commit -m 'clue:3'",
      ]),
      spacer(),
      p("La barra de estado mostrará ", b("✅ Ritual completo"), " cuando los 3 commits y la rama estén presentes."),
      spacer(),
      bullet("numbers", "Cargar ", code("proof.json"), " en el panel (clic ", b("📂 Seleccionar proof.json"), ")"),
      bullet("numbers", "O usar el prove-server si está corriendo (modo ", b("🖥️ prove-server"), ")"),
      bullet("numbers", "Clic en ", b("Recuperar Nombre → UltraHonk + end_game()"), " → firmar en Freighter"),
      spacer(),
      okBox(
        "Flujo completado",
        "Si todo está bien: UltraHonkVerifier.verify() = true on-chain",
        "game_hub.end_game() registra la victoria",
        "El panel muestra el link a la transacción en Stellar Explorer",
      ),

      // ── SECCIÓN 5: TROUBLESHOOTING ────────────────────────────────
      spacer(),
      h1("Sección 5 — Troubleshooting"),

      h2("Freighter no conecta"),
      bullet("bullets", "Verificar que Freighter esté en ", b("TESTNET"), " (no PUBLIC)"),
      bullet("bullets", "Usar el link 🔓 del panel para abrir la extensión directamente"),
      bullet("bullets", "Verificar que Chrome permita popups en ", code("localhost:5173")),
      bullet("bullets", "Si queda en 'Conectando...', desbloquear Freighter y usar ", b("↺ Reintentar")),
      spacer(),

      h2("nargo execute falla"),
      bullet("bullets", code("nargo --version"), " debe ser >= 0.36"),
      bullet("bullets", "Verificar que ", code("Prover.toml"), " tenga formato correcto (los valores en comillas)"),
      bullet("bullets", code("nargo compile --force"), " para forzar recompilación"),
      spacer(),

      h2("bb no genera proof"),
      bullet("bullets", code("bb --version"), " debe ser >= 0.66"),
      bullet("bullets", "El witness debe existir: ", code("target/witness.gz"), " o ", code("target/witness")),
      bullet("bullets", "Intentar la generación manual:", ),
      codeBlock([
        "bb prove --scheme ultra_honk \\",
        "  -b target/chihiro_name.json \\",
        "  -w target/witness.gz \\",
        "  -o target/ --write_vk",
      ]),
      spacer(),

      h2("recover_name() falla on-chain"),
      bullet("bullets", "Verificar que el nameCommit en el frontend sea el Poseidon2 real (no SHA-256)"),
      bullet("bullets", "Verificar que proof.json sea del mismo name_secret y salt que usó initialize()"),
      bullet("bullets", "El contrato espera exactamente 1 public input — verificar en proof.json:", ),
      codeBlock(['# public_inputs debe tener exactamente 1 elemento:', '"public_inputs": ["0x..."]']),
      bullet("bullets", "Verificar que VITE_ULTRAHONK_VERIFIER_ID sea el verifier correcto para la red"),
      spacer(),

      h2("VITE_CHIHIRO_CONTRACT_ID no cargado"),
      bullet("bullets", "El archivo ", code(".env"), " debe estar en ", code("gitBDB/"), " (no en la raíz del monorepo)"),
      bullet("bullets", "Reiniciar el dev server después de cambiar el ", code(".env")),
      bullet("bullets", "Las variables Vite deben empezar con ", code("VITE_"), " para ser accesibles en el browser"),
      spacer(),

      h2("prove-server no inicia"),
      bullet("bullets", "Verificar que Node.js sea >= 20: ", code("node --version")),
      bullet("bullets", "El server requiere nargo y bb en el PATH"),
      bullet("bullets", "Revisar que el puerto 4001 no esté ocupado: ", code("lsof -i :4001")),
      spacer(),

      // ── SECCIÓN 6: REFERENCIA RÁPIDA ─────────────────────────────
      spacer(),
      h1("Sección 6 — Referencia rápida"),

      h2("Comandos frecuentes"),
      codeBlock([
        "# Frontend",
        "cd gitBDB && npm run dev           # dev server",
        "cd gitBDB && npm run test          # 26 tests",
        "cd gitBDB && npm run build         # build prod",
        "",
        "# Prove server",
        "node scripts/prove-server.js       # API local port 4001",
        "curl localhost:4001/health         # status check",
        "",
        "# Circuito ZK",
        "./scripts/prove.sh 0x<secret> 0x<salt>  # proof completa",
        "cd gitBDB-circuits/chihiro-name && nargo test",
        "",
        "# Contratos Soroban",
        "cd gitBDB-contracts && cargo test  # tests unitarios",
        "cd gitBDB-contracts && cargo build --target wasm32v1-none --release",
        "",
        "# Stellar CLI",
        "stellar keys generate admin --network testnet",
        "stellar keys fund admin --network testnet",
        "stellar contract invoke --id <C...> --source admin --network testnet \\",
        "  -- get_game_status",
      ]),
      spacer(),

      h2("Variables de entorno (gitBDB/.env)"),
      codeBlock([
        "# Requeridas para on-chain:",
        "VITE_CHIHIRO_CONTRACT_ID=C...      # tu contrato deployado",
        "VITE_ULTRAHONK_VERIFIER_ID=C...    # verifier on-chain",
        "",
        "# Hardcodeada (no cambiar):",
        "# VITE_GAME_HUB_ID=CB4VZAT2U3UC6XFK3N23SKRF2NDCMP3QHJYMCHHFMZO7MRQO6DQ2EMYG",
      ]),
      spacer(),

      h2("Archivos sensibles — NUNCA al repo"),
      new Table({
        width: { size: 9360, type: WidthType.DXA }, columnWidths: [3200, 6160],
        rows: [
          new TableRow({ children: [
            new TableCell({ borders, shading: { fill: C.heading2, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, width: { size: 3200, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Archivo", bold: true, color: C.white })] })] }),
            new TableCell({ borders, shading: { fill: C.heading2, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, width: { size: 6160, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Por qué es sensible", bold: true, color: C.white })] })] }),
          ]}),
          ...[
            ["gitBDB/.env", "VITE_CHIHIRO_CONTRACT_ID y otras keys"],
            ["gitBDB-circuits/**/Prover.toml", "Contiene name_secret y salt en texto plano"],
            ["**/target/proof.json", "Contiene name_secret_hex, salt_hex, proof, vk"],
            ["**/target/proof", "Bytes raw del UltraHonk proof"],
            ["**/target/vk", "Verification key — si se filtra, el sistema puede ser atacado"],
          ].map(([file, reason], idx) => new TableRow({ children: [
            new TableCell({ borders, shading: { fill: idx%2===0?"FFF0F0":"FFFFFF", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, width: { size: 3200, type: WidthType.DXA }, children: [new Paragraph({ children: [code(file)] })] }),
            new TableCell({ borders, shading: { fill: idx%2===0?"FFF0F0":"FFFFFF", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, width: { size: 6160, type: WidthType.DXA }, children: [new Paragraph({ children: [plain(reason)] })] }),
          ]})),
        ]
      }),
      spacer(),
      p(b("Todos los archivos de arriba están en el .gitignore."), " Verificá con ", code("git status"), " antes de cada commit."),
      spacer(),

      // ── PIE ──────────────────────────────────────────────────────
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "🌊  Chihiro's Lost Name — Stellar Hacks 2026", size: 20, color: C.muted, italics: true })],
        spacing: { before: 600, after: 60 },
      }),
    ],
  }],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("/mnt/user-data/outputs/chihiro-guia-local.docx", buffer);
  console.log("✓ chihiro-guia-local.docx generado");
});
