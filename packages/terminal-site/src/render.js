import { pages } from "./content.js";

const ESC = "\x1b[";
const RESET = `${ESC}0m`;
const INK = "\x1b[38;2;245;245;245m";
const MUTED = "\x1b[38;2;168;168;168m";
const TERRACOTTA = "\x1b[38;2;164;71;24m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const INVERSE = "\x1b[7m";

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
  const lines = [
    `${TERRACOTTA}${page.kicker.toUpperCase()}${RESET}`,
    `${BOLD}${page.title}${RESET}`,
    "",
    ...wrapText(page.summary, contentWidth),
    "",
  ];

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

function renderNav(selectedIndex, width) {
  const lines = [
    `${TERRACOTTA}o${RESET} ${BOLD}CUMULUS${RESET}`,
    `${DIM}terminal site${RESET}`,
    "",
  ];

  pages.forEach((page, index) => {
    const number = String(index + 1);
    const label = `${number}. ${page.title}`;
    const active = index === selectedIndex;
    lines.push(active ? `${INVERSE}${padRight(label, width)}${RESET}` : padRight(label, width));
  });

  lines.push("");
  lines.push(`${DIM}arrows/[ ] nav${RESET}`);
  lines.push(`${DIM}j/k scroll${RESET}`);
  lines.push(`${DIM}Ctrl+C quit${RESET}`);
  return lines;
}

export function renderFrame(state, size) {
  const width = Math.max(60, size.columns ?? 100);
  const height = Math.max(20, size.rows ?? 30);
  const navWidth = Math.min(24, Math.max(18, Math.floor(width * 0.24)));
  const innerWidth = width - 4;
  const contentWidth = innerWidth - navWidth - 3;
  const bodyHeight = height - 6;
  const page = pages[state.selectedIndex] ?? pages[0];
  const nav = renderNav(state.selectedIndex, navWidth);
  const allPageLines = pageLines(page, contentWidth);
  const maxScroll = Math.max(0, allPageLines.length - bodyHeight);
  const scroll = Math.min(state.scroll ?? 0, maxScroll);
  const visiblePageLines = allPageLines.slice(scroll, scroll + bodyHeight);
  const output = [];

  output.push(`${INK}${frameLine("+", "-", "+", width)}${RESET}`);
  output.push(`${INK}|${RESET} ${BOLD}Cumulus in the terminal${RESET}${" ".repeat(Math.max(0, width - 29))}${INK}|${RESET}`);
  output.push(`${INK}|${RESET} ${MUTED}${page.route}${RESET}${" ".repeat(Math.max(0, width - page.route.length - 4))}${INK}|${RESET}`);
  output.push(`${INK}${frameLine("+", "-", "+", width)}${RESET}`);

  for (let i = 0; i < bodyHeight; i += 1) {
    const left = truncate(nav[i] ?? "", navWidth);
    const right = truncate(visiblePageLines[i] ?? "", contentWidth);
    output.push(
      `${INK}|${RESET} ${padRight(left, navWidth)} ${MUTED}|${RESET} ${padRight(right, contentWidth)} ${INK}|${RESET}`,
    );
  }

  output.push(`${INK}${frameLine("+", "-", "+", width)}${RESET}`);

  if (page.contact) {
    const prompt = `message > ${state.contactInput ?? ""}`;
    const suffix = state.status ? ` ${MUTED}${state.status}${RESET}` : "";
    output.push(`${INK}|${RESET} ${truncate(prompt, width - 4)}${suffix}${" ".repeat(Math.max(0, width - visibleLength(prompt) - visibleLength(stripAnsi(suffix)) - 4))}${INK}|${RESET}`);
  } else {
    const help = "1-6 pages | up/down scroll | Contact: type message, Enter opens draft | Ctrl+C quit";
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
