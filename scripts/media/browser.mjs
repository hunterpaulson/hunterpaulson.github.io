import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export function browserExecutableCandidates(
  platform = process.platform,
  homeDirectory = os.homedir(),
) {
  const envCandidates = [
    process.env.MEDIA_EXPORT_BROWSER,
    process.env.PUPPETEER_EXECUTABLE_PATH,
  ].filter(Boolean);

  if (platform === "darwin") {
    const appCandidates = [
      "Google Chrome.app/Contents/MacOS/Google Chrome",
      "Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
      "Chromium.app/Contents/MacOS/Chromium",
      "Arc.app/Contents/MacOS/Arc",
      "Brave Browser.app/Contents/MacOS/Brave Browser",
      "Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    ];

    return [
      ...envCandidates,
      ...appCandidates.map((candidate) => path.join("/Applications", candidate)),
      ...appCandidates.map((candidate) => path.join(homeDirectory, "Applications", candidate)),
    ];
  }

  if (platform === "linux") {
    return [
      ...envCandidates,
      "/usr/bin/google-chrome",
      "/usr/bin/google-chrome-stable",
      "/usr/bin/chromium",
      "/usr/bin/chromium-browser",
      "/snap/bin/chromium",
    ];
  }

  if (platform === "win32") {
    const localAppData = process.env.LOCALAPPDATA || "";
    const programFiles = process.env.PROGRAMFILES || "C:\\Program Files";
    const programFilesX86 = process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)";

    return [
      ...envCandidates,
      path.join(programFiles, "Google", "Chrome", "Application", "chrome.exe"),
      path.join(programFilesX86, "Google", "Chrome", "Application", "chrome.exe"),
      path.join(localAppData, "Google", "Chrome", "Application", "chrome.exe"),
      path.join(programFiles, "Chromium", "Application", "chrome.exe"),
      path.join(programFilesX86, "Chromium", "Application", "chrome.exe"),
      path.join(localAppData, "Chromium", "Application", "chrome.exe"),
      path.join(programFiles, "Microsoft", "Edge", "Application", "msedge.exe"),
      path.join(programFilesX86, "Microsoft", "Edge", "Application", "msedge.exe"),
    ];
  }

  return envCandidates;
}

export function resolveBrowserExecutable(
  platform = process.platform,
  homeDirectory = os.homedir(),
) {
  const candidates = browserExecutableCandidates(platform, homeDirectory);
  return candidates.find((candidate) => candidate && fs.existsSync(candidate)) ?? null;
}
