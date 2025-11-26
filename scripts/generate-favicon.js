#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const emptySet = String.fromCharCode(0x2205);
const colors = {
  glyph: '#f9f6ee',
  background: '#06180f',
};
const font = 'DejaVu-Sans-Mono';
const sizes = Object.freeze([16, 32, 48, 64, 128, 256]);
const BASE_SIZE = 1024;
const GLYPH_ROTATION = 45;

const outDir = path.resolve(__dirname, '..', 'assets');
const icoPath = path.resolve(outDir, 'favicon.ico');
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'favicon-'));
const rawPngPath = path.join(tmpDir, 'favicon-source.png');

const glyphPointSize = BASE_SIZE;
const glyphYOffset = Math.round(BASE_SIZE * -0.03);
const circleRadius = glyphPointSize / 2;
const center = BASE_SIZE / 2;

fs.mkdirSync(outDir, { recursive: true });

const circleTop = Math.round(center - circleRadius);

const buildCommand = (parts) => parts.join(' \\\n');
const run = (command) => execSync(command, { stdio: 'inherit' });

const createHighResPng = buildCommand([
  `convert -size ${BASE_SIZE}x${BASE_SIZE} xc:none`,
  `\\( -size ${BASE_SIZE}x${BASE_SIZE} xc:none -fill "${colors.background}" -draw "circle ${center},${center} ${center},${circleTop}" \\)`,
  '-compose over -composite',
  `\\( -background none -size ${BASE_SIZE}x${BASE_SIZE} xc:none -fill "${colors.glyph}" -font "${font}" -pointsize ${glyphPointSize} -gravity center -annotate +0+${glyphYOffset} "${emptySet}" -rotate ${GLYPH_ROTATION} \\)`,
  '-compose over -composite',
  rawPngPath,
]);

const buildIco = `convert ${rawPngPath} -define icon:auto-resize=${sizes.join(',')} ${icoPath}`;

try {
  run(createHighResPng);
  run(buildIco);
  console.log(`Generated: ${icoPath}`);
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}
