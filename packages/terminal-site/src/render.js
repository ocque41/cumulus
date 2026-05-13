import { pages } from "./content.js";

const ESC = "\x1b[";
const RESET = `${ESC}0m`;
const INK = "\x1b[38;2;245;245;245m";
const MUTED = "\x1b[38;2;168;168;168m";
const TERRACOTTA = "\x1b[38;2;164;71;24m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const INVERSE = "\x1b[7m";

const CUMULUS_MARK = [
  "      . . . .",
  "   . . . . . . .",
  " . . . . . . . . .",
  ". . . . . . . . . .",
  ". . . . . . o . . .",
  "  . . . . . . . .",
  "    . . . . . .",
];

const TADO_MARK = [
  "  +------+",
  "  |.:.:.|",
  "  |:.:.:|",
  "  |.:.:.|",
  "  |:.:.:|",
  "  |.:.:.|    +----------+   +----------+   +----------+",
  "  |:.:.:|    |.:.:.:.:.|   |.:.:.:.:.|   |.:.:.:.:.|",
  "  |.:.:.|    |:.:.:.:.:|   |:.:.:.:.:|   |:.:.:.:.:|",
  "  |:.:.:|    |.:.:.:.:.|   |.:.:.:.:.|   |.:.:.:.:.|",
  "  +------+    +----------+   +----------+   +----------+",
];

export function stripAnsi(value) {
  return String(value).replace(/\x1b\[[0-9;]*m/g, "");
}

function visibleLength(value) {
  return stripAnsi(value).length;
}

function padRight(value, width) {
  const length = visibleLength(value);
  return length >= width ? value : `${value}${" ".repeat(width - length)}`;
}

function truncate(value, width) {
  const input = String(value);
  if (visibleLength(input) <= width) return input;
  const plain = stripAnsi(input);
  if (width <= 1) return plain.slice(0, width);
  return `${plain.slice(0, width - 1)}>`;
}

function center(value, width) {
  const length = visibleLength(value);
  if (length >= width) return value;
  const left = Math.floor((width - length) / 2);
  return `${" ".repeat(left)}${value}`;
}

export function wrapText(text, width) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";

  for (const word of words) {
    if (!line) {
      line = word;
      continue;
    }

    if (line.length + 1 + word.length <= width) {
      line += ` ${word}`;
    } else {
      lines.push(line);
      line = word;
    }
  }

  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function colorCumulusMark(line) {
  return `${INK}${line.replace("o", `${TERRACOTTA}o${INK}`)}${RESET}`;
}

function renderCumulusLogo(width) {
  const word = `${BOLD}cumulus${RESET}`;
  if (width < 72) {
    return [`${colorCumulusMark(". . . . . . o")}  ${word}`];
  }

  const markWidth = Math.max(...CUMULUS_MARK.map((line) => line.length));
  const wordLine = Math.floor(CUMULUS_MARK.length / 2);
  return CUMULUS_MARK.map((line, index) => {
    const mark = colorCumulusMark(padRight(line, markWidth));
    return index === wordLine ? `${mark}    ${word}` : mark;
  });
}

function renderTadoLogo(width) {
  const markWidth = Math.max(...TADO_MARK.map((line) => line.length));
  const lines = [];
  for (const line of TADO_MARK) {
    lines.push(`${MUTED}${truncate(center(padRight(line, markWidth), width), width)}${RESET}`);
  }
  return lines;
}

function sectionLines(section, width) {
  const lines = [];
  lines.push(`${BOLD}${section.heading}${RESET}`);

  for (const paragraph of section.body ?? []) {
    lines.push("");
    for (const line of wrapText(paragraph, width)) {
      lines.push(line);
    }
  }

  for (const bullet of section.bullets ?? []) {
    for (const [index, line] of wrapText(bullet, Math.max(10, width - 4)).entries()) {
      lines.push(`${index === 0 ? "  - " : "    "}${line}`);
    }
  }

  if (section.rows?.length) {
    const labelWidth = Math.min(
      18,
      Math.max(...section.rows.map(([label]) => label.length), 8),
    );
    for (const [label, value] of section.rows) {
      const wrapped = wrapText(value, Math.max(10, width - labelWidth - 5));
      lines.push(`${TERRACOTTA}${padRight(label, labelWidth)}${RESET}  ${wrapped[0]}`);
      for (const continuation of wrapped.slice(1)) {
        lines.push(`${" ".repeat(labelWidth + 2)}${continuation}`);
      }
    }
  }

  if (section.code?.length) {
    lines.push("");
    for (const line of section.code) {
      lines.push(`${MUTED}$ ${line}${RESET}`);
    }
  }

  return lines;
}

export function pageLines(page, width) {
  const contentWidth = Math.max(24, width);
  const lines = [];

  if (page.id === "tado") {
    lines.push(...renderTadoLogo(contentWidth), "");
  }

  lines.push(
    `${TERRACOTTA}${page.kicker.toUpperCase()}${RESET}`,
    `${BOLD}${page.title}${RESET}`,
    "",
    ...wrapText(page.summary, contentWidth),
    "",
  );

  for (const section of page.sections) {
    lines.push(...sectionLines(section, contentWidth));
    lines.push("");
  }

  if (page.contact) {
    lines.push(`${MUTED}Type your message below. Press Enter to open the email draft.${RESET}`);
  }

  return lines;
}

function frameLine(left, middle, right, width) {
  return `${left}${middle.repeat(Math.max(0, width - 2))}${right}`;
}

function renderHorizontalNav(selectedIndex, width) {
  const lines = [];
  let current = `${MUTED}<${RESET} `;
  const suffix = ` ${MUTED}>${RESET}`;

  for (const [index, page] of pages.entries()) {
    const plainLabel = `${index + 1} ${page.title}`;
    const label = index === selectedIndex ? `${INVERSE}${plainLabel}${RESET}` : plainLabel;
    const candidate = current.endsWith(" ") ? `${current}${label}` : `${current}  ${label}`;
    if (visibleLength(`${candidate}${suffix}`) > width && visibleLength(current) > 2) {
      lines.push(current);
      current = `  ${label}`;
      continue;
    }
    current = candidate;
  }

  lines.push(`${current}${suffix}`);
  return lines;
}

function renderHeader(selectedIndex, width) {
  const lines = [
    ...renderCumulusLogo(width),
    "",
    `${DIM}terminal site${RESET}`,
    ...renderHorizontalNav(selectedIndex, width),
  ];
  return lines;
}

export function frameScrollLimit(selectedIndex, size) {
  const width = Math.max(60, size.columns ?? 100);
  const height = Math.max(20, size.rows ?? 30);
  const innerWidth = width - 4;
  const page = pages[selectedIndex] ?? pages[0];
  const header = renderHeader(selectedIndex, innerWidth);
  const bodyHeight = Math.max(6, height - header.length - 5);
  return Math.max(0, pageLines(page, innerWidth).length - bodyHeight);
}

export function renderFrame(state, size) {
  const width = Math.max(60, size.columns ?? 100);
  const height = Math.max(20, size.rows ?? 30);
  const innerWidth = width - 4;
  const contentWidth = innerWidth;
  const selectedIndex = state.selectedIndex ?? 0;
  const page = pages[selectedIndex] ?? pages[0];
  const header = renderHeader(selectedIndex, innerWidth);
  const bodyHeight = Math.max(6, height - header.length - 5);
  const allPageLines = pageLines(page, contentWidth);
  const maxScroll = frameScrollLimit(selectedIndex, size);
  const scroll = Math.min(state.scroll ?? 0, maxScroll);
  const visiblePageLines = allPageLines.slice(scroll, scroll + bodyHeight);
  const output = [];

  output.push(`${INK}${frameLine("+", "-", "+", width)}${RESET}`);
  for (const line of header) {
    output.push(`${INK}|${RESET} ${padRight(truncate(line, innerWidth), innerWidth)} ${INK}|${RESET}`);
  }
  output.push(`${INK}|${RESET} ${MUTED}${padRight(truncate(`route ${page.route}`, innerWidth), innerWidth)}${RESET} ${INK}|${RESET}`);
  output.push(`${INK}${frameLine("+", "-", "+", width)}${RESET}`);

  for (let i = 0; i < bodyHeight; i += 1) {
    const line = truncate(visiblePageLines[i] ?? "", contentWidth);
    output.push(`${INK}|${RESET} ${padRight(line, contentWidth)} ${INK}|${RESET}`);
  }

  output.push(`${INK}${frameLine("+", "-", "+", width)}${RESET}`);

  if (page.contact) {
    const prompt = `message > ${state.contactInput ?? ""}`;
    const suffix = state.status ? ` ${MUTED}${state.status}${RESET}` : "";
    output.push(`${INK}|${RESET} ${truncate(prompt, width - 4)}${suffix}${" ".repeat(Math.max(0, width - visibleLength(prompt) - visibleLength(stripAnsi(suffix)) - 4))}${INK}|${RESET}`);
  } else {
    const help = "left/right or [ ] move links | 1-6 jump | up/down scroll | contact Enter opens draft";
    output.push(`${INK}|${RESET} ${MUTED}${padRight(truncate(help, width - 4), width - 4)}${RESET} ${INK}|${RESET}`);
  }

  output.push(`${INK}${frameLine("+", "-", "+", width)}${RESET}`);
  return `${ESC}?25l${ESC}H${output.join("\n")}`;
}

export function renderPlain(page) {
  const lines = [`${page.title}`, page.summary, ""];
  for (const section of page.sections) {
    lines.push(section.heading);
    for (const paragraph of section.body ?? []) lines.push(paragraph);
    for (const bullet of section.bullets ?? []) lines.push(`- ${bullet}`);
    for (const [label, value] of section.rows ?? []) lines.push(`${label}: ${value}`);
    for (const code of section.code ?? []) lines.push(`$ ${code}`);
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}
