---
title: art
author: Hunter Paulson
lang: en
---

a collection of animations I made in reverse chronological order

---

## 2026-05-08 - matrix rain

<section class="art-section">
<div id="matrix-rain-animation" class="matrix-rain" role="img" aria-label="green matrix digital rain animation"></div>
<script type="module" src="/src/art/matrix_rain.mjs"></script>
</section>

<p class="art-actions"><a href="/assets/art/matrix-rain.gif" download>download gif</a></p>

my favorite movie of all time

---

## 2026-04-30 - [breadth-first search](/blog/wikipedia-race-solver/)

<section class="art-section art-section--graph">
{{ include "content/includes/animations/wikipedia-bfs.html" }}
</section>

<p class="art-actions"><a href="/assets/blog/wikipedia-race-solver/social/breadth-first-search.gif" download>download gif</a></p>

---

## 2026-04-30 - [bidirectional BFS](/blog/wikipedia-race-solver/)

<section class="art-section art-section--graph">
{{ include "content/includes/animations/wikipedia-bidirectional-bfs.html" }}
</section>

<p class="art-actions"><a href="/assets/blog/wikipedia-race-solver/social/bidirectional-bfs.gif" download>download gif</a></p>

---

## 2026-03-15 - [optimizing...](/blog/stochastic-agentic-ascent/)

<section class="art-section">
<div style="margin:calc(var(--line-height) * 2) 0">
  <pre
    id="stochastic-agentic-ascent-kernel-scroll-screen"
    aria-label="scrollable ascii animation of full CUDA matmul kernel code changing across optimization steps"
    aria-live="off"
    tabindex="0"
    style="width:calc(round(down, 100%, 1ch)); height:calc(22 * var(--line-height)); margin:0; white-space:pre; overflow-x:auto; overflow-y:hidden"
  >(loading stochastic agentic ascent kernel...)</pre>
  <pre
    id="stochastic-agentic-ascent-chart-screen"
    aria-label="ascii chart of CUDA matmul GFLOPs per second across optimization steps"
    aria-live="off"
    style="width:calc(round(down, 100%, 1ch)); height:calc(20 * var(--line-height)); margin:var(--line-height) 0 0; white-space:pre; overflow-x:auto; overflow-y:hidden"
  >(loading stochastic agentic ascent chart...)</pre>
</div>
<script type="module" src="/src/blog/stochastic-agentic-ascent/animation.mjs"></script>
</section>

<p class="art-actions"><a href="/assets/blog/stochastic-agentic-ascent/social/stochastic-agentic-ascent.gif" download>download gif</a></p>

---

## 2026-03-08 - [abstracting/compiling](/blog/just-another-abstraction/)

<section class="art-section">
<div aria-label="edit distance abstraction animation" style="margin:calc(var(--line-height) * 2) 0">
  <pre
    id="abstraction-screen"
    aria-live="off"
    tabindex="0"
    style="width:calc(round(down, 100%, 1ch)); height:calc(30 * var(--line-height)); margin:0; white-space:pre; overflow-x:auto; overflow-y:hidden; border:var(--border-thickness) solid var(--text-color)"
  >(loading abstraction...)</pre>
  <label style="width:auto; margin-top:var(--line-height)"><input type="checkbox" id="abstraction-reverse" /> reverse direction</label>
</div>
<script type="module" src="/src/blog/just-another-abstraction/animation.mjs"></script>
</section>

<p class="art-actions"><a href="/assets/blog/just-another-abstraction/social/edit-distance-abstraction.gif" download>download gif</a> <a href="/assets/blog/just-another-abstraction/social/edit-distance-abstraction-reverse.gif" download>download reverse gif</a></p>

---

## 2026-02-16 - [tractors farming code](/blog/industrialization/)

<section class="art-section">
<pre id="farming-field" data-farming-rows="37" aria-label="ascii code farming field">loading field...</pre>

<script type="module" src="/src/blog/industrialization/animation.mjs"></script>
</section>

<p class="art-actions"><a href="/assets/blog/industrialization/social/tractors-farming-code.gif" download>download gif</a></p>

---

## 2025-10-15 - [donut.js](/blog/donut/)

<section class="art-section">
<pre
  id="d"
  style="
    width:80ch;
    height:calc(40 * var(--line-height));
    margin:calc(var(--line-height) * 2) auto;
    white-space:pre;
    overflow:hidden;
  "
  aria-live="off"
>
(loading donut...)
</pre>
<script type="module" src="/src/art/donut.mjs"></script>
</section>

<p class="art-actions"><a href="/assets/blog/donut/social/donut-js.gif" download>download gif</a></p>

---

## 2025-10-04 - [blackhole.wgsl/wasm](/)

<section class="art-section">
<pre id="bh" aria-label="blackhole ascii">loading...</pre>
<pre id="bh-status" aria-label="renderer status" style="text-align:right;margin:0"></pre>
<label id="bh-vsync-label" style="display:block;margin:0.5em 0"><input type="checkbox" id="bh-vsync" checked /> vsync</label>
<pre id="bh-sliders" aria-label="blackhole controls">loading controls...</pre>
<script type="module">
  import { initBlackholeSimulation } from "/src/blackhole_simulation.js";
  initBlackholeSimulation();
</script>
</section>

<p class="art-actions"><a href="/assets/social/home-blackhole.gif" download>download gif</a></p>
