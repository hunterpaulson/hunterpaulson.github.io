import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const DIST_ROOT = path.join(ROOT, 'dist');
const WATCH_PATHS = [
  path.join(ROOT, 'content'),
  path.join(ROOT, 'src'),
  path.join(ROOT, 'Makefile'),
  path.join(ROOT, 'blackhole.c'),
  path.join(ROOT, 'blackhole_core.c'),
  path.join(ROOT, 'blackhole_core.h'),
  path.join(ROOT, 'blackhole_wasm.c'),
];

function shouldTrigger(filePath) {
  const relative = path.relative(ROOT, filePath);
  if (relative.startsWith('..')) {
    return false;
  }

  if (relative === 'Makefile') {
    return true;
  }

  if (
    relative === 'blackhole.c' ||
    relative === 'blackhole_core.c' ||
    relative === 'blackhole_core.h' ||
    relative === 'blackhole_wasm.c'
  ) {
    return true;
  }

  if (relative.startsWith(`content${path.sep}`)) {
    return true;
  }

  if (relative.startsWith(`src${path.sep}`)) {
    return filePath.endsWith('.css');
  }

  return false;
}

function decodePathname(requestUrl) {
  const pathname = requestUrl.split('?')[0].split('#')[0];
  try {
    return decodeURIComponent(pathname);
  } catch {
    return pathname;
  }
}

function isKnownHtmlRoute(requestUrl) {
  const pathname = decodePathname(requestUrl);
  const relativePath = pathname.replace(/^\/+/, '');

  let candidates = [];
  if (relativePath === '') {
    candidates = ['index.html'];
  } else {
    const trimmed = relativePath.replace(/\/+$/, '');
    if (trimmed.endsWith('.html')) {
      candidates = [trimmed];
    } else {
      candidates = [`${trimmed}.html`, path.join(trimmed, 'index.html')];
    }
  }

  return candidates.some((candidate) => {
    const absolutePath = path.resolve(DIST_ROOT, candidate);
    if (!absolutePath.startsWith(DIST_ROOT)) {
      return false;
    }
    return fs.existsSync(absolutePath);
  });
}

function createNotFoundRedirectPlugin() {
  return {
    name: 'dev-404-redirect',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          return next();
        }

        const requestUrl = req.url || '/';
        const pathname = decodePathname(requestUrl);
        const acceptsHtml = (req.headers.accept || '').includes('text/html');

        if (!acceptsHtml) {
          return next();
        }

        if (
          pathname === '/404.html' ||
          pathname.startsWith('/@') ||
          pathname.startsWith('/__vite') ||
          pathname.startsWith('/node_modules/') ||
          path.extname(pathname) !== ''
        ) {
          return next();
        }

        if (isKnownHtmlRoute(requestUrl)) {
          return next();
        }

        res.statusCode = 302;
        res.setHeader('Location', '/404.html');
        res.end();
      });
    },
  };
}

function createPandocWatcher() {
  return {
    name: 'pandoc-hot-reload',
    configureServer(server) {
      const logger = server.config.logger;
      let building = false;
      let pending = false;
      let closed = false;

      const handleChange = (filePath) => {
        if (!shouldTrigger(filePath)) {
          return;
        }

        const relative = path.relative(ROOT, filePath);
        logger.info(`[pandoc] change detected in ${relative}`);
        schedule();
      };

      const runMake = () => {
        building = true;
        const started = Date.now();
        const child = spawn('make', {
          cwd: ROOT,
          stdio: 'inherit',
        });

        child.on('close', (code) => {
          building = false;
          if (code === 0) {
            const seconds = ((Date.now() - started) / 1000).toFixed(2);
            logger.info(`[pandoc] rebuild finished in ${seconds}s`);
            server.ws.send({ type: 'full-reload' });
          } else {
            logger.error(`[pandoc] make exited with code ${code}`);
          }

          if (pending && !closed) {
            pending = false;
            runMake();
          }
        });

        child.on('error', (error) => {
          building = false;
          logger.error(`[pandoc] failed to run make: ${error.message}`);
        });
      };

      const schedule = () => {
        if (closed) {
          return;
        }
        if (building) {
          pending = true;
          return;
        }
        pending = false;
        runMake();
      };

      server.watcher.add(WATCH_PATHS);

      server.watcher.on('change', handleChange);
      server.watcher.on('add', handleChange);
      server.watcher.on('unlink', handleChange);

      // Kick off an initial build when the dev server starts.
      schedule();

      const close = async () => {
        closed = true;
        server.watcher.off('change', handleChange);
        server.watcher.off('add', handleChange);
        server.watcher.off('unlink', handleChange);
      };

      server.httpServer?.once('close', close);
    },
  };
}

export default defineConfig({
  appType: 'mpa',
  root: 'dist',
  server: {
    fs: {
      strict: false,
      allow: ['..'],
    },
  },
  plugins: [createPandocWatcher(), createNotFoundRedirectPlugin()],
});
