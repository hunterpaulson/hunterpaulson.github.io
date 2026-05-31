---
title: computer scientist
lang: en
description: Hunter Paulson's personal website for writing, art, projects, and experiments in computer science.
canonical-url: "https://hunterpaulson.dev/"
og-type: "website"
site-name: "hunter paulson"
social-description: "Hunter Paulson's personal website for writing, art, projects, and experiments in computer science."
social-image-alt: "ASCII black hole animation from Hunter Paulson's personal website."
social-image-height: 769
social-image-type: "image/gif"
social-image-url: "https://hunterpaulson.dev/assets/social/home-blackhole.gif"
social-image-width: 769
social-title: "hunter paulson | computer scientist"
twitter-card: "summary_large_image"
---

hello guild navigator, welcome to my light cone.

if you have made it here, feel free to take a look around and reach out.

<pre id="bh" aria-label="blackhole ascii">loading...</pre>
<pre id="bh-status" aria-label="renderer status" style="text-align:right;margin:0"></pre>
<label id="bh-vsync-label" style="display:block;margin:0.5em 0"><input type="checkbox" id="bh-vsync" checked /> vsync</label>
<pre id="bh-sliders" aria-label="blackhole controls">loading controls...</pre>
<script type="module">
  import { initBlackholeSimulation } from "/src/blackhole_simulation.js";
  initBlackholeSimulation();
</script>
