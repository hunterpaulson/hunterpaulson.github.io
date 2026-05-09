import fs from "node:fs";
import path from "node:path";
import { createServer } from "node:http";

const MIME_TYPES = new Map([
  [".css", "text/css; charset=utf-8"],
  [".gif", "image/gif"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"],
  [".wasm", "application/wasm"],
  [".wgsl", "text/plain; charset=utf-8"],
  [".xml", "application/xml; charset=utf-8"],
]);

function decodePathname(requestUrl) {
  const pathname = requestUrl.split("?")[0].split("#")[0];
  try {
    return decodeURIComponent(pathname);
  } catch {
    return pathname;
  }
}

export function resolveRelativeAssetCandidates(requestUrl) {
  const pathname = decodePathname(requestUrl);
  const trimmedPath = pathname.replace(/^\/+/, "");

  if (trimmedPath === "") {
    return ["index.html"];
  }

  if (path.extname(trimmedPath) !== "") {
    return [trimmedPath];
  }

  const normalizedPath = trimmedPath.replace(/\/+$/, "");
  if (pathname.endsWith("/")) {
    return [path.posix.join(normalizedPath, "index.html")];
  }

  return [
    `${normalizedPath}.html`,
    path.posix.join(normalizedPath, "index.html"),
  ];
}

export function resolveStaticFilePath(rootDirectory, requestUrl) {
  const absoluteRoot = path.resolve(rootDirectory);
  const absoluteRootPrefix = `${absoluteRoot}${path.sep}`;
  const relativeCandidates = resolveRelativeAssetCandidates(requestUrl);

  for (const relativeCandidate of relativeCandidates) {
    const absoluteCandidate = path.resolve(absoluteRoot, relativeCandidate);
    if (absoluteCandidate !== absoluteRoot && !absoluteCandidate.startsWith(absoluteRootPrefix)) {
      continue;
    }

    if (!fs.existsSync(absoluteCandidate)) {
      continue;
    }

    const stats = fs.statSync(absoluteCandidate);
    if (stats.isFile()) {
      return absoluteCandidate;
    }
  }

  return null;
}

export async function startStaticServer({ rootDirectory, host = "127.0.0.1", port = 0 }) {
  const server = createServer((request, response) => {
    const requestUrl = request.url || "/";
    const filePath = resolveStaticFilePath(rootDirectory, requestUrl);
    if (!filePath) {
      response.statusCode = 404;
      response.setHeader("Content-Type", "text/plain; charset=utf-8");
      response.end("Not found");
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    response.statusCode = 200;
    response.setHeader(
      "Content-Type",
      MIME_TYPES.get(extension) ?? "application/octet-stream",
    );

    const stream = fs.createReadStream(filePath);
    stream.on("error", () => {
      response.statusCode = 500;
      response.end("Failed to read file");
    });
    stream.pipe(response);
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, resolve);
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("failed to resolve preview server address");
  }

  return {
    baseUrl: `http://${host}:${address.port}`,
    async close() {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    },
  };
}
