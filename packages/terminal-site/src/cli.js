import process from "node:process";
import readline from "node:readline";

import { findPage, pageIndex, pages } from "./content.js";
import { openMailDraft } from "./mailto.js";
import { pageLines, renderFrame, renderPlain } from "./render.js";

const CLEAR = "\x1b[2J\x1b[H";
const SHOW_CURSOR = "\x1b[?25h";
const ALT_SCREEN_ON = "\x1b[?1049h";
const ALT_SCREEN_OFF = "\x1b[?1049l";

function parseArgs(args) {
  const options = {
    route: "/",
    plain: false,
    help: false,
    version: false,
    noAltScreen: false,
    dryRunEmail: false,
  };

  for (const arg of args) {
    if (arg === "--plain") options.plain = true;
    else if (arg === "--help" || arg === "-h") options.help = true;
    else if (arg === "--version" || arg === "-v") options.version = true;
    else if (arg === "--no-alt-screen") options.noAltScreen = true;
    else if (arg === "--dry-run-email") options.dryRunEmail = true;
    else if (!arg.startsWith("-")) options.route = arg;
  }

  return options;
}

function helpText() {
  return [
    "Cumulus terminal site",
    "",
    "Usage:",
    "  npx cumulush [route] [--plain]",
    "",
    "Routes:",
    ...pages.map((page) => `  ${page.route.padEnd(12)} ${page.title}`),
    "  /docs        alias for /documents",
    "  /cumulus/rune alias for /rune",
    "",
    "Controls:",
    "  1-6, left/right, [ ]  change page",
    "  up/down, j/k          scroll",
    "  g / G                 top / bottom",
    "  r                     redraw",
    "  q, Ctrl+C             quit",
  ].join("\n");
}

function clampScroll(index, scroll, rows, columns) {
  const page = pages[index] ?? pages[0];
  const navWidth = Math.min(24, Math.max(18, Math.floor(Math.max(60, columns) * 0.24)));
  const contentWidth = Math.max(60, columns) - 4 - navWidth - 3;
  const bodyHeight = Math.max(20, rows) - 6;
  const maxScroll = Math.max(0, pageLines(page, contentWidth).length - bodyHeight);
  return Math.max(0, Math.min(scroll, maxScroll));
}

export async function runCli(args, streams = {}) {
  const options = parseArgs(args);
  const stdout = streams.stdout ?? process.stdout;
  const stdin = streams.stdin ?? process.stdin;

  if (options.help) {
    stdout.write(`${helpText()}\n`);
    return;
  }

  if (options.version) {
    stdout.write("0.1.0\n");
    return;
  }

  const initialPage = findPage(options.route);
  const initialIndex = pageIndex(initialPage.route);

  if (options.plain || !stdout.isTTY || !stdin.isTTY) {
    stdout.write(`${renderPlain(initialPage)}\n`);
    return;
  }

  readline.emitKeypressEvents(stdin);
  const previousRawMode = stdin.isRaw;
  if (stdin.setRawMode) stdin.setRawMode(true);

  const state = {
    selectedIndex: initialIndex,
    scroll: 0,
    contactInput: "",
    status: "",
  };

  const size = () => ({
    columns: stdout.columns ?? 100,
    rows: stdout.rows ?? 30,
  });

  const draw = () => {
    const terminal = size();
    state.scroll = clampScroll(state.selectedIndex, state.scroll, terminal.rows, terminal.columns);
    stdout.write(`${CLEAR}${renderFrame(state, terminal)}`);
  };

  const cleanup = () => {
    stdin.off("keypress", onKeypress);
    stdout.off("resize", draw);
    if (stdin.setRawMode) stdin.setRawMode(Boolean(previousRawMode));
    if (stdin.pause) stdin.pause();
    stdout.write(`${SHOW_CURSOR}${options.noAltScreen ? "" : ALT_SCREEN_OFF}`);
  };

  const select = (nextIndex) => {
    state.selectedIndex = (nextIndex + pages.length) % pages.length;
    state.scroll = 0;
    state.status = "";
    draw();
  };

  const submitContact = () => {
    const message = state.contactInput.trim();
    if (!message) {
      state.status = "Type a message first.";
      draw();
      return;
    }

    const result = openMailDraft(message, { dryRun: options.dryRunEmail });
    state.status = result.command === "dry-run" ? "Email draft ready (dry run)." : "Email draft opened.";
    state.contactInput = "";
    draw();
  };

  function onKeypress(character, key = {}) {
    if (key.ctrl && key.name === "c") {
      cleanup();
      return;
    }

    const page = pages[state.selectedIndex];
    if (page.contact) {
      if (key.name === "return") {
        submitContact();
        return;
      }
      if (key.name === "backspace" || key.name === "delete") {
        state.contactInput = state.contactInput.slice(0, -1);
        state.status = "";
        draw();
        return;
      }
      if (character && !key.ctrl && !key.meta && character >= " ") {
        state.contactInput += character;
        state.status = "";
        draw();
        return;
      }
    }

    if (key.name === "q" || character === "q") {
      cleanup();
      return;
    }

    if (/^[1-6]$/.test(character ?? "")) {
      select(Number(character) - 1);
      return;
    }

    if (key.name === "right" || character === "]" || key.name === "tab") {
      select(state.selectedIndex + 1);
      return;
    }

    if (key.name === "left" || character === "[") {
      select(state.selectedIndex - 1);
      return;
    }

    if (key.name === "down" || character === "j") {
      state.scroll += 1;
      draw();
      return;
    }

    if (key.name === "up" || character === "k") {
      state.scroll -= 1;
      draw();
      return;
    }

    if (character === "g") {
      state.scroll = 0;
      draw();
      return;
    }

    if (character === "G") {
      state.scroll = 100000;
      draw();
      return;
    }

    if (character === "r") {
      draw();
    }
  }

  if (!options.noAltScreen) stdout.write(ALT_SCREEN_ON);
  stdout.on("resize", draw);
  stdin.on("keypress", onKeypress);
  draw();
}
