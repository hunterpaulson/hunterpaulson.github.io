import { formatCliHelp, parseCliArgs } from "./media/cli.mjs";
import { exportMediaPreset } from "./media/exporter.mjs";
import { listGifMediaPresets, listMediaPresets, resolveMediaPreset } from "./media/presets.mjs";

function printPresetList() {
  for (const preset of listMediaPresets()) {
    console.log(`${preset.name} - ${preset.description}`);
  }
}

function printExportResult(result) {
  if (result.type === "gif") {
    console.log(
      `Wrote ${result.outputPath} (${result.frameCount} frames at ${result.fps} fps over ${result.durationMs} ms)`
    );
    return;
  }

  console.log(`Wrote ${result.outputPath}`);
}

async function main() {
  try {
    const parsed = parseCliArgs(process.argv.slice(2));

    if (parsed.action === "help") {
      console.log(formatCliHelp());
      console.log("");
      console.log("Available presets:");
      printPresetList();
      return;
    }

    if (parsed.action === "list") {
      printPresetList();
      return;
    }

    if (parsed.action === "all-gifs") {
      if (parsed.options.output) {
        throw new Error("--output cannot be used with all-gifs");
      }

      const options = { ...parsed.options };
      for (const listedPreset of listGifMediaPresets()) {
        const preset = resolveMediaPreset(listedPreset.name);
        const result = await exportMediaPreset(preset, options);
        printExportResult(result);
        options.build = false;
      }
      return;
    }

    const preset = resolveMediaPreset(parsed.presetName);
    const result = await exportMediaPreset(preset, parsed.options);
    printExportResult(result);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

void main();
