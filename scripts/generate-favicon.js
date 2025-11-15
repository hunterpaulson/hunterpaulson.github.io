#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');

// Empty set character: ∅ (U+2205)
const emptySet = String.fromCharCode(0x2205); // ∅

// Colors from index.css - dark mode
const textColor = '#f9f6ee';
const backgroundColor = '#06180f';

const outDir = path.resolve(__dirname, '..', 'assets');
const icoPath = path.resolve(outDir, 'favicon.ico');

// Create ICO with circular background, rotated 45 degrees
// Create image with rotated character, then apply circular mask (slightly larger to cover anti-aliasing)
execSync(`convert -size 200x200 xc:"${backgroundColor}" -fill "${textColor}" -font DejaVu-Sans-Mono -pointsize 256 -gravity center -annotate +0+0 "${emptySet}" -rotate 45 \\( -size 200x200 xc:none -fill white -draw "circle 100,100 100,2" \\) -alpha off -compose copy_opacity -composite -background transparent \\( -clone 0 -resize 16x16 \\) \\( -clone 0 -resize 32x32 \\) \\( -clone 0 -resize 48x48 \\) -delete 0 ${icoPath}`, { stdio: 'inherit' });

console.log(`Generated: ${icoPath}`);
