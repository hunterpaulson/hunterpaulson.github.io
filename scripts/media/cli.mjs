function parsePositiveInteger(optionName, value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${optionName} must be a positive integer`);
  }
  return parsed;
}

export function parseCliArgs(argv) {
  const options = {
    build: false,
    baseUrl: null,
    output: null,
    fps: null,
    durationMs: null,
    timeoutMs: null,
  };

  const positionals = [];

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (!argument.startsWith("--")) {
      positionals.push(argument);
      continue;
    }

    if (argument === "--help") {
      return {
        action: "help",
        options,
        presetName: null,
      };
    }

    if (argument === "--build") {
      options.build = true;
      continue;
    }

    if (
      argument !== "--base-url"
      && argument !== "--output"
      && argument !== "--fps"
      && argument !== "--duration-ms"
      && argument !== "--timeout-ms"
    ) {
      throw new Error(`unknown option: ${argument}`);
    }

    const nextValue = argv[index + 1];
    if (nextValue === undefined) {
      throw new Error(`${argument} requires a value`);
    }

    if (argument === "--base-url") {
      options.baseUrl = nextValue;
      index += 1;
      continue;
    }

    if (argument === "--output") {
      options.output = nextValue;
      index += 1;
      continue;
    }

    if (argument === "--fps") {
      options.fps = parsePositiveInteger(argument, nextValue);
      index += 1;
      continue;
    }

    if (argument === "--duration-ms") {
      options.durationMs = parsePositiveInteger(argument, nextValue);
      index += 1;
      continue;
    }

    options.timeoutMs = parsePositiveInteger(argument, nextValue);
    index += 1;
  }

  if (positionals.length === 0) {
    return {
      action: "help",
      options,
      presetName: null,
    };
  }

  if (positionals[0] === "list") {
    return {
      action: "list",
      options,
      presetName: null,
    };
  }

  if (positionals[0] === "all-gifs") {
    return {
      action: "all-gifs",
      options,
      presetName: null,
    };
  }

  if (positionals.length > 1) {
    throw new Error("expected a single preset name");
  }

  return {
    action: "export",
    options,
    presetName: positionals[0],
  };
}

export function formatCliHelp() {
  return [
    "Usage:",
    "  bun run export:media -- list",
    "  bun run export:media -- all-gifs [--build]",
    "  bun run export:media -- <preset-name> [--build] [--output path]",
    "",
    "Options:",
    "  --build              Rebuild dist/ before exporting",
    "  --base-url URL       Capture from an already-running site instead of dist/",
    "  --output PATH        Override the preset output path",
    "  --fps N              Override GIF frames per second",
    "  --duration-ms N      Override GIF capture duration in milliseconds",
    "  --timeout-ms N       Override navigation and ready timeout",
    "  --help               Show this help text",
  ].join("\n");
}
