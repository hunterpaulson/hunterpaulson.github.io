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
<div id="wikipedia-bfs-animation" class="mono-graph-animation" data-interval="1400" data-media-export-id="wikipedia-bfs">

<!-- frame 1 -->

<figure class="mono-graph mono-graph-animation__frame" style="--graph-cols: 68; --graph-rows: 30;">
<div class="mono-graph__canvas">
<svg class="mono-graph__edges" aria-hidden="true"></svg>
<div class="mono-graph__node mono-graph__node--accent" data-node="s" style="--col: 34; --row: 14;">S</div>
<div class="mono-graph__node mono-graph__node--warm" data-node="t" style="--col: 34; --row: 28;">T</div>
</div>
<figcaption>Begin knowing the **start** and _target_ page.</figcaption>
</figure>

<!-- frame 2 -->

<figure class="mono-graph mono-graph-animation__frame" style="--graph-cols: 68; --graph-rows: 30;">
<div class="mono-graph__canvas">
<svg class="mono-graph__edges" aria-hidden="true"></svg>
<div class="mono-graph__node mono-graph__node--accent" data-node="s" style="--col: 34; --row: 14;">S</div>
<div class="mono-graph__node mono-graph__node--warm" data-node="t" style="--col: 34; --row: 28;">T</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa0" style="--col: 34; --row: 10;">1</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa1" style="--col: 40; --row: 11;">1</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa2" style="--col: 42; --row: 14;">1</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa3" style="--col: 40; --row: 17;">1</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa4" style="--col: 34; --row: 18;">1</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa5" style="--col: 28; --row: 17;">1</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa6" style="--col: 26; --row: 14;">1</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa7" style="--col: 28; --row: 11;">1</div>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa0"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa1"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa2"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa3"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa4"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa5"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa6"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa7"></span>
</div>
<figcaption>Get all the pages that **the start page links to**.</figcaption>
</figure>

<!-- frame 3 -->

<figure class="mono-graph mono-graph-animation__frame" style="--graph-cols: 68; --graph-rows: 30;">
<div class="mono-graph__canvas">
<svg class="mono-graph__edges" aria-hidden="true"></svg>
<div class="mono-graph__node mono-graph__node--accent" data-node="s" style="--col: 34; --row: 14;">S</div>
<div class="mono-graph__node mono-graph__node--warm" data-node="t" style="--col: 34; --row: 28;">T</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa0" style="--col: 34; --row: 10;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa1" style="--col: 40; --row: 11;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa2" style="--col: 42; --row: 14;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa3" style="--col: 40; --row: 17;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa4" style="--col: 34; --row: 18;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa5" style="--col: 28; --row: 17;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa6" style="--col: 26; --row: 14;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa7" style="--col: 28; --row: 11;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sc0" style="--col: 34; --row: 7;">2</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sc1" style="--col: 42; --row: 8;">2</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sc2" style="--col: 48; --row: 10;">2</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sc3" style="--col: 50; --row: 14;">2</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sc4" style="--col: 48; --row: 18;">2</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="td6" style="--col: 41; --row: 21;">2</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="m2" style="--col: 27; --row: 21;">2</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sc8" style="--col: 20; --row: 18;">2</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sc9" style="--col: 18; --row: 14;">2</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sc10" style="--col: 20; --row: 10;">2</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sc11" style="--col: 26; --row: 8;">2</div>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa0"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa1"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa2"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa3"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa4"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa5"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa6"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa7"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa0" data-to="sc0"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa0" data-to="sc1"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa1" data-to="sc1"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa1" data-to="sc2"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa2" data-to="sc2"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa2" data-to="sc3"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa3" data-to="sc4"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa3" data-to="td6"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa4" data-to="td6"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa5" data-to="m2"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa5" data-to="sc8"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa6" data-to="sc8"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa6" data-to="sc9"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa6" data-to="sc10"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa7" data-to="sc10"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa7" data-to="sc11"></span>
</div>
<figcaption>Get all the pages that the start page can reach in TWO links.</figcaption>
</figure>

<!-- frame 4 -->

<figure class="mono-graph mono-graph-animation__frame" style="--graph-cols: 68; --graph-rows: 30;">
<div class="mono-graph__canvas">
<svg class="mono-graph__edges" aria-hidden="true"></svg>
<div class="mono-graph__node mono-graph__node--accent" data-node="s" style="--col: 34; --row: 14;">S</div>
<div class="mono-graph__node mono-graph__node--warm" data-node="t" style="--col: 34; --row: 28;">T</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa0" style="--col: 34; --row: 10;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa1" style="--col: 40; --row: 11;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa2" style="--col: 42; --row: 14;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa3" style="--col: 40; --row: 17;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa4" style="--col: 34; --row: 18;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa5" style="--col: 28; --row: 17;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa6" style="--col: 26; --row: 14;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa7" style="--col: 28; --row: 11;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sc0" style="--col: 34; --row: 7;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sc1" style="--col: 42; --row: 8;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sc2" style="--col: 48; --row: 10;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sc3" style="--col: 50; --row: 14;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sc4" style="--col: 48; --row: 18;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="td6" style="--col: 41; --row: 21;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="m2" style="--col: 27; --row: 21;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sc8" style="--col: 20; --row: 18;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sc9" style="--col: 18; --row: 14;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sc10" style="--col: 20; --row: 10;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sc11" style="--col: 26; --row: 8;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sd0" style="--col: 34; --row: 4;">3</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sd1" style="--col: 44; --row: 5;">3</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sd2" style="--col: 52; --row: 8;">3</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sd3" style="--col: 58; --row: 11;">3</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sd4" style="--col: 60; --row: 14;">3</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sd5" style="--col: 58; --row: 17;">3</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sd6" style="--col: 52; --row: 21;">3</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="tb4" style="--col: 41; --row: 25;">3</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="tb3" style="--col: 34; --row: 24;">3</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="tb2" style="--col: 27; --row: 25;">3</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sd10" style="--col: 16; --row: 21;">3</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sd11" style="--col: 10; --row: 17;">3</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sd12" style="--col: 8; --row: 14;">3</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sd13" style="--col: 10; --row: 11;">3</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sd14" style="--col: 16; --row: 8;">3</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sd15" style="--col: 24; --row: 5;">3</div>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa0"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa1"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa2"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa3"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa4"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa5"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa6"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa7"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa0" data-to="sc0"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa0" data-to="sc1"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa1" data-to="sc1"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa1" data-to="sc2"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa2" data-to="sc2"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa2" data-to="sc3"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa3" data-to="sc4"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa3" data-to="td6"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa4" data-to="td6"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa5" data-to="m2"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa5" data-to="sc8"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa6" data-to="sc8"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa6" data-to="sc9"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa6" data-to="sc10"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa7" data-to="sc10"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa7" data-to="sc11"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sc0" data-to="sd0"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sc1" data-to="sd1"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sc1" data-to="sd2"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sc2" data-to="sd2"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sc2" data-to="sd3"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sc3" data-to="sd4"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sc3" data-to="sd5"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sc4" data-to="sd5"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sc4" data-to="sd6"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="td6" data-to="tb4"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="td6" data-to="tb3"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="td6" data-to="sd6"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="m2" data-to="tb3"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="m2" data-to="tb2"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="m2" data-to="sd10"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sc8" data-to="sd10"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sc8" data-to="sd11"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sc9" data-to="sd12"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sc10" data-to="sd13"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sc10" data-to="sd14"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sc11" data-to="sd15"></span>
</div>
<figcaption>Get all the pages that the start page can reach in THREE links.</figcaption>
</figure>

<!-- frame 5 -->

<figure class="mono-graph mono-graph-animation__frame" style="--graph-cols: 68; --graph-rows: 30;">
<div class="mono-graph__canvas">
<svg class="mono-graph__edges" aria-hidden="true"></svg>
<div class="mono-graph__node mono-graph__node--accent" data-node="s" style="--col: 34; --row: 14;">S</div>
<div class="mono-graph__node mono-graph__node--warm" data-node="t" style="--col: 34; --row: 28;">T</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa0" style="--col: 34; --row: 10;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa1" style="--col: 40; --row: 11;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa2" style="--col: 42; --row: 14;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa3" style="--col: 40; --row: 17;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa4" style="--col: 34; --row: 18;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa5" style="--col: 28; --row: 17;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa6" style="--col: 26; --row: 14;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa7" style="--col: 28; --row: 11;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sc0" style="--col: 34; --row: 7;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sc1" style="--col: 42; --row: 8;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sc2" style="--col: 48; --row: 10;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sc3" style="--col: 50; --row: 14;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sc4" style="--col: 48; --row: 18;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="td6" style="--col: 41; --row: 21;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="m2" style="--col: 27; --row: 21;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sc8" style="--col: 20; --row: 18;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sc9" style="--col: 18; --row: 14;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sc10" style="--col: 20; --row: 10;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sc11" style="--col: 26; --row: 8;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sd0" style="--col: 34; --row: 4;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sd1" style="--col: 44; --row: 5;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sd2" style="--col: 52; --row: 8;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sd3" style="--col: 58; --row: 11;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sd4" style="--col: 60; --row: 14;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sd5" style="--col: 58; --row: 17;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sd6" style="--col: 52; --row: 21;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="tb4" style="--col: 41; --row: 25;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="tb3" style="--col: 34; --row: 24;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="tb2" style="--col: 27; --row: 25;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sd10" style="--col: 16; --row: 21;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sd11" style="--col: 10; --row: 17;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sd12" style="--col: 8; --row: 14;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sd13" style="--col: 10; --row: 11;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sd14" style="--col: 16; --row: 8;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sd15" style="--col: 24; --row: 5;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="se0" style="--col: 34; --row: 1;">4</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="se1" style="--col: 46; --row: 2;">4</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="se2" style="--col: 56; --row: 5;">4</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="se3" style="--col: 64; --row: 10;">4</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="se4" style="--col: 66; --row: 14;">4</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="se5" style="--col: 64; --row: 18;">4</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="se6" style="--col: 58; --row: 24;">4</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="se7" style="--col: 48; --row: 27;">4</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="se9" style="--col: 20; --row: 27;">4</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="se10" style="--col: 10; --row: 24;">4</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="se11" style="--col: 4; --row: 18;">4</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="se12" style="--col: 2; --row: 14;">4</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="se13" style="--col: 4; --row: 10;">4</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="se14" style="--col: 12; --row: 5;">4</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="se15" style="--col: 22; --row: 2;">4</div>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa0"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa1"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa2"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa3"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa4"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa5"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa6"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa7"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa0" data-to="sc0"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa0" data-to="sc1"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa1" data-to="sc1"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa1" data-to="sc2"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa2" data-to="sc2"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa2" data-to="sc3"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa3" data-to="sc4"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa3" data-to="td6"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa4" data-to="td6"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa5" data-to="m2"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa5" data-to="sc8"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa6" data-to="sc8"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa6" data-to="sc9"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa6" data-to="sc10"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa7" data-to="sc10"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa7" data-to="sc11"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sc0" data-to="sd0"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sc1" data-to="sd1"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sc1" data-to="sd2"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sc2" data-to="sd2"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sc2" data-to="sd3"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sc3" data-to="sd4"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sc3" data-to="sd5"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sc4" data-to="sd5"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sc4" data-to="sd6"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="td6" data-to="tb4"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="td6" data-to="tb3"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="td6" data-to="sd6"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="m2" data-to="tb3"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="m2" data-to="tb2"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="m2" data-to="sd10"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sc8" data-to="sd10"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sc8" data-to="sd11"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sc9" data-to="sd12"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sc10" data-to="sd13"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sc10" data-to="sd14"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sc11" data-to="sd15"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sd0" data-to="se0"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sd0" data-to="se1"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sd1" data-to="se1"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sd2" data-to="se1"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sd2" data-to="se2"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sd2" data-to="se3"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sd3" data-to="se3"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sd3" data-to="se4"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sd4" data-to="se4"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sd5" data-to="se5"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sd5" data-to="se6"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sd6" data-to="se6"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sd6" data-to="se7"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="tb4" data-to="t"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="tb4" data-to="se7"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="tb3" data-to="t"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="tb2" data-to="t"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="tb2" data-to="se9"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sd10" data-to="se9"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sd10" data-to="se10"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sd11" data-to="se10"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sd11" data-to="se11"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sd12" data-to="se11"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sd12" data-to="se12"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sd13" data-to="se12"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sd13" data-to="se13"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sd13" data-to="se14"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sd14" data-to="se14"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sd15" data-to="se14"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sd15" data-to="se15"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sd15" data-to="se0"></span>
</div>
<figcaption>Get all the pages that the start page can reach in FOUR links.</figcaption>
</figure>

<!-- frame 6 -->

<figure class="mono-graph mono-graph-animation__frame" style="--graph-cols: 68; --graph-rows: 30;">
<div class="mono-graph__canvas">
<svg class="mono-graph__edges" aria-hidden="true"></svg>
<div class="mono-graph__node mono-graph__node--accent" data-node="s" style="--col: 34; --row: 14;">S</div>
<div class="mono-graph__node mono-graph__node--warm" data-node="t" style="--col: 34; --row: 28;">4</div>
<div class="mono-graph__node" data-node="sa0" style="--col: 34; --row: 10;"></div>
<div class="mono-graph__node" data-node="sa1" style="--col: 40; --row: 11;"></div>
<div class="mono-graph__node" data-node="sa2" style="--col: 42; --row: 14;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa3" style="--col: 40; --row: 17;">1</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa4" style="--col: 34; --row: 18;">1</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa5" style="--col: 28; --row: 17;">1</div>
<div class="mono-graph__node" data-node="sa6" style="--col: 26; --row: 14;"></div>
<div class="mono-graph__node" data-node="sa7" style="--col: 28; --row: 11;"></div>
<div class="mono-graph__node" data-node="sc0" style="--col: 34; --row: 7;"></div>
<div class="mono-graph__node" data-node="sc1" style="--col: 42; --row: 8;"></div>
<div class="mono-graph__node" data-node="sc2" style="--col: 48; --row: 10;"></div>
<div class="mono-graph__node" data-node="sc3" style="--col: 50; --row: 14;"></div>
<div class="mono-graph__node" data-node="sc4" style="--col: 48; --row: 18;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="td6" style="--col: 41; --row: 21;">2</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="m2" style="--col: 27; --row: 21;">2</div>
<div class="mono-graph__node" data-node="sc8" style="--col: 20; --row: 18;"></div>
<div class="mono-graph__node" data-node="sc9" style="--col: 18; --row: 14;"></div>
<div class="mono-graph__node" data-node="sc10" style="--col: 20; --row: 10;"></div>
<div class="mono-graph__node" data-node="sc11" style="--col: 26; --row: 8;"></div>
<div class="mono-graph__node" data-node="sd0" style="--col: 34; --row: 4;"></div>
<div class="mono-graph__node" data-node="sd1" style="--col: 44; --row: 5;"></div>
<div class="mono-graph__node" data-node="sd2" style="--col: 52; --row: 8;"></div>
<div class="mono-graph__node" data-node="sd3" style="--col: 58; --row: 11;"></div>
<div class="mono-graph__node" data-node="sd4" style="--col: 60; --row: 14;"></div>
<div class="mono-graph__node" data-node="sd5" style="--col: 58; --row: 17;"></div>
<div class="mono-graph__node" data-node="sd6" style="--col: 52; --row: 21;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="tb4" style="--col: 41; --row: 25;">3</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="tb3" style="--col: 34; --row: 24;">3</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="tb2" style="--col: 27; --row: 25;">3</div>
<div class="mono-graph__node" data-node="sd10" style="--col: 16; --row: 21;"></div>
<div class="mono-graph__node" data-node="sd11" style="--col: 10; --row: 17;"></div>
<div class="mono-graph__node" data-node="sd12" style="--col: 8; --row: 14;"></div>
<div class="mono-graph__node" data-node="sd13" style="--col: 10; --row: 11;"></div>
<div class="mono-graph__node" data-node="sd14" style="--col: 16; --row: 8;"></div>
<div class="mono-graph__node" data-node="sd15" style="--col: 24; --row: 5;"></div>
<div class="mono-graph__node" data-node="se0" style="--col: 34; --row: 1;"></div>
<div class="mono-graph__node" data-node="se1" style="--col: 46; --row: 2;"></div>
<div class="mono-graph__node" data-node="se2" style="--col: 56; --row: 5;"></div>
<div class="mono-graph__node" data-node="se3" style="--col: 64; --row: 10;"></div>
<div class="mono-graph__node" data-node="se4" style="--col: 66; --row: 14;"></div>
<div class="mono-graph__node" data-node="se5" style="--col: 64; --row: 18;"></div>
<div class="mono-graph__node" data-node="se6" style="--col: 58; --row: 24;"></div>
<div class="mono-graph__node" data-node="se7" style="--col: 48; --row: 27;"></div>
<div class="mono-graph__node" data-node="se9" style="--col: 20; --row: 27;"></div>
<div class="mono-graph__node" data-node="se10" style="--col: 10; --row: 24;"></div>
<div class="mono-graph__node" data-node="se11" style="--col: 4; --row: 18;"></div>
<div class="mono-graph__node" data-node="se12" style="--col: 2; --row: 14;"></div>
<div class="mono-graph__node" data-node="se13" style="--col: 4; --row: 10;"></div>
<div class="mono-graph__node" data-node="se14" style="--col: 12; --row: 5;"></div>
<div class="mono-graph__node" data-node="se15" style="--col: 22; --row: 2;"></div>
<span class="mono-graph__edge" data-from="s" data-to="sa0"></span>
<span class="mono-graph__edge" data-from="s" data-to="sa1"></span>
<span class="mono-graph__edge" data-from="s" data-to="sa2"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa3"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa4"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa5"></span>
<span class="mono-graph__edge" data-from="s" data-to="sa6"></span>
<span class="mono-graph__edge" data-from="s" data-to="sa7"></span>
<span class="mono-graph__edge" data-from="sa0" data-to="sc0"></span>
<span class="mono-graph__edge" data-from="sa0" data-to="sc1"></span>
<span class="mono-graph__edge" data-from="sa1" data-to="sc1"></span>
<span class="mono-graph__edge" data-from="sa1" data-to="sc2"></span>
<span class="mono-graph__edge" data-from="sa2" data-to="sc2"></span>
<span class="mono-graph__edge" data-from="sa2" data-to="sc3"></span>
<span class="mono-graph__edge" data-from="sa3" data-to="sc4"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa3" data-to="td6"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa4" data-to="td6"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa5" data-to="m2"></span>
<span class="mono-graph__edge" data-from="sa5" data-to="sc8"></span>
<span class="mono-graph__edge" data-from="sa6" data-to="sc8"></span>
<span class="mono-graph__edge" data-from="sa6" data-to="sc9"></span>
<span class="mono-graph__edge" data-from="sa6" data-to="sc10"></span>
<span class="mono-graph__edge" data-from="sa7" data-to="sc10"></span>
<span class="mono-graph__edge" data-from="sa7" data-to="sc11"></span>
<span class="mono-graph__edge" data-from="sc0" data-to="sd0"></span>
<span class="mono-graph__edge" data-from="sc1" data-to="sd1"></span>
<span class="mono-graph__edge" data-from="sc1" data-to="sd2"></span>
<span class="mono-graph__edge" data-from="sc2" data-to="sd2"></span>
<span class="mono-graph__edge" data-from="sc2" data-to="sd3"></span>
<span class="mono-graph__edge" data-from="sc3" data-to="sd4"></span>
<span class="mono-graph__edge" data-from="sc3" data-to="sd5"></span>
<span class="mono-graph__edge" data-from="sc4" data-to="sd5"></span>
<span class="mono-graph__edge" data-from="sc4" data-to="sd6"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="td6" data-to="tb4"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="td6" data-to="tb3"></span>
<span class="mono-graph__edge" data-from="td6" data-to="sd6"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="m2" data-to="tb3"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="m2" data-to="tb2"></span>
<span class="mono-graph__edge" data-from="m2" data-to="sd10"></span>
<span class="mono-graph__edge" data-from="sc8" data-to="sd10"></span>
<span class="mono-graph__edge" data-from="sc8" data-to="sd11"></span>
<span class="mono-graph__edge" data-from="sc9" data-to="sd12"></span>
<span class="mono-graph__edge" data-from="sc10" data-to="sd13"></span>
<span class="mono-graph__edge" data-from="sc10" data-to="sd14"></span>
<span class="mono-graph__edge" data-from="sc11" data-to="sd15"></span>
<span class="mono-graph__edge" data-from="sd0" data-to="se0"></span>
<span class="mono-graph__edge" data-from="sd0" data-to="se1"></span>
<span class="mono-graph__edge" data-from="sd1" data-to="se1"></span>
<span class="mono-graph__edge" data-from="sd2" data-to="se1"></span>
<span class="mono-graph__edge" data-from="sd2" data-to="se2"></span>
<span class="mono-graph__edge" data-from="sd2" data-to="se3"></span>
<span class="mono-graph__edge" data-from="sd3" data-to="se3"></span>
<span class="mono-graph__edge" data-from="sd3" data-to="se4"></span>
<span class="mono-graph__edge" data-from="sd4" data-to="se4"></span>
<span class="mono-graph__edge" data-from="sd5" data-to="se5"></span>
<span class="mono-graph__edge" data-from="sd5" data-to="se6"></span>
<span class="mono-graph__edge" data-from="sd6" data-to="se6"></span>
<span class="mono-graph__edge" data-from="sd6" data-to="se7"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="tb4" data-to="t"></span>
<span class="mono-graph__edge" data-from="tb4" data-to="se7"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="tb3" data-to="t"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="tb2" data-to="t"></span>
<span class="mono-graph__edge" data-from="tb2" data-to="se9"></span>
<span class="mono-graph__edge" data-from="sd10" data-to="se9"></span>
<span class="mono-graph__edge" data-from="sd10" data-to="se10"></span>
<span class="mono-graph__edge" data-from="sd11" data-to="se10"></span>
<span class="mono-graph__edge" data-from="sd11" data-to="se11"></span>
<span class="mono-graph__edge" data-from="sd12" data-to="se11"></span>
<span class="mono-graph__edge" data-from="sd12" data-to="se12"></span>
<span class="mono-graph__edge" data-from="sd13" data-to="se12"></span>
<span class="mono-graph__edge" data-from="sd13" data-to="se13"></span>
<span class="mono-graph__edge" data-from="sd13" data-to="se14"></span>
<span class="mono-graph__edge" data-from="sd14" data-to="se14"></span>
<span class="mono-graph__edge" data-from="sd15" data-to="se14"></span>
<span class="mono-graph__edge" data-from="sd15" data-to="se15"></span>
<span class="mono-graph__edge" data-from="sd15" data-to="se0"></span>
</div>
<figcaption>Drop every page that is not on a shortest path.</figcaption>
</figure>

<!-- frame 7 -->

<figure class="mono-graph mono-graph-animation__frame" style="--graph-cols: 68; --graph-rows: 30;">
<div class="mono-graph__canvas">
<svg class="mono-graph__edges" aria-hidden="true"></svg>
<div class="mono-graph__node mono-graph__node--accent" data-node="s" style="--col: 34; --row: 14;">S</div>
<div class="mono-graph__node mono-graph__node--warm" data-node="t" style="--col: 34; --row: 28;">4</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa3" style="--col: 40; --row: 17;">1</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa4" style="--col: 34; --row: 18;">1</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa5" style="--col: 28; --row: 17;">1</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="tb2" style="--col: 27; --row: 25;">3</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="tb3" style="--col: 34; --row: 24;">3</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="tb4" style="--col: 41; --row: 25;">3</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="m2" style="--col: 27; --row: 21;">2</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="td6" style="--col: 41; --row: 21;">2</div>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa3"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa4"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa5"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa3" data-to="td6"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa4" data-to="td6"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa5" data-to="m2"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="td6" data-to="tb3"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="m2" data-to="tb3"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="tb2" data-to="t"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="tb3" data-to="t"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="tb4" data-to="t"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="m2" data-to="tb2"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="td6" data-to="tb4"></span>
</div>
<figcaption>It takes at least 4 clicks to reach the target page.</figcaption>
</figure>

</div>
</section>

<p class="art-actions"><a href="/assets/blog/wikipedia-race-solver/social/breadth-first-search.gif" download>download gif</a></p>

---

## 2026-04-30 - [bidirectional BFS](/blog/wikipedia-race-solver/)

<section class="art-section art-section--graph">
<div id="wikipedia-bidirectional-bfs-animation" class="mono-graph-animation" data-interval="1400" data-media-export-id="wikipedia-bidirectional-bfs">

<figure class="mono-graph mono-graph-animation__frame" style="--graph-cols: 68; --graph-rows: 30;">
<div class="mono-graph__canvas">
<svg class="mono-graph__edges" aria-hidden="true"></svg>
<div class="mono-graph__node mono-graph__node--accent" data-node="s" style="--col: 34; --row: 8;">S</div>
<div class="mono-graph__node mono-graph__node--warm" data-node="t" style="--col: 34; --row: 22;">T</div>
</div>
<figcaption>Begin with the **start** and _target_ page.</figcaption>
</figure>

<figure class="mono-graph mono-graph-animation__frame" style="--graph-cols: 68; --graph-rows: 30;">
<div class="mono-graph__canvas">
<svg class="mono-graph__edges" aria-hidden="true"></svg>
<div class="mono-graph__node mono-graph__node--accent" data-node="s" style="--col: 34; --row: 8;">S</div>
<div class="mono-graph__node mono-graph__node--warm" data-node="t" style="--col: 34; --row: 22;">T</div>
<div class="mono-graph__node mono-graph__node--warm" data-node="tb0" style="--col: 34; --row: 26;"></div>
<div class="mono-graph__node mono-graph__node--warm" data-node="tb1" style="--col: 27; --row: 24;"></div>
<div class="mono-graph__node mono-graph__node--warm" data-node="tb2" style="--col: 27; --row: 20;"></div>
<div class="mono-graph__node mono-graph__node--warm" data-node="tb3" style="--col: 34; --row: 18;"></div>
<div class="mono-graph__node mono-graph__node--warm" data-node="tb4" style="--col: 41; --row: 20;"></div>
<div class="mono-graph__node mono-graph__node--warm" data-node="tb5" style="--col: 41; --row: 24;"></div>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="tb0" data-to="t"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="tb1" data-to="t"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="tb2" data-to="t"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="tb3" data-to="t"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="tb4" data-to="t"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="tb5" data-to="t"></span>
</div>
<figcaption>Get all the pages that _link to the target page_.</figcaption>
</figure>

<figure class="mono-graph mono-graph-animation__frame" style="--graph-cols: 68; --graph-rows: 30;">
<div class="mono-graph__canvas">
<svg class="mono-graph__edges" aria-hidden="true"></svg>
<div class="mono-graph__node mono-graph__node--accent" data-node="s" style="--col: 34; --row: 8;">S</div>
<div class="mono-graph__node mono-graph__node--warm" data-node="t" style="--col: 34; --row: 22;">T</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa0" style="--col: 34; --row: 4;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa1" style="--col: 40; --row: 5;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa2" style="--col: 42; --row: 8;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa3" style="--col: 40; --row: 11;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa4" style="--col: 34; --row: 12;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa5" style="--col: 28; --row: 11;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa6" style="--col: 26; --row: 8;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa7" style="--col: 28; --row: 5;"></div>
<div class="mono-graph__node mono-graph__node--warm" data-node="tb0" style="--col: 34; --row: 26;"></div>
<div class="mono-graph__node mono-graph__node--warm" data-node="tb1" style="--col: 27; --row: 24;"></div>
<div class="mono-graph__node mono-graph__node--warm" data-node="tb2" style="--col: 27; --row: 20;"></div>
<div class="mono-graph__node mono-graph__node--warm" data-node="tb3" style="--col: 34; --row: 18;"></div>
<div class="mono-graph__node mono-graph__node--warm" data-node="tb4" style="--col: 41; --row: 20;"></div>
<div class="mono-graph__node mono-graph__node--warm" data-node="tb5" style="--col: 41; --row: 24;"></div>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa0"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa1"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa2"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa3"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa4"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa5"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa6"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa7"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="tb0" data-to="t"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="tb1" data-to="t"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="tb2" data-to="t"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="tb3" data-to="t"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="tb4" data-to="t"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="tb5" data-to="t"></span>
</div>
<figcaption>Get all the pages that **the start page links to**.</figcaption>
</figure>

<figure class="mono-graph mono-graph-animation__frame" style="--graph-cols: 68; --graph-rows: 30;">
<div class="mono-graph__canvas">
<svg class="mono-graph__edges" aria-hidden="true"></svg>
<div class="mono-graph__node mono-graph__node--accent" data-node="s" style="--col: 34; --row: 8;">S</div>
<div class="mono-graph__node mono-graph__node--warm" data-node="t" style="--col: 34; --row: 22;">T</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa0" style="--col: 34; --row: 4;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa1" style="--col: 40; --row: 5;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa2" style="--col: 42; --row: 8;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa3" style="--col: 40; --row: 11;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa4" style="--col: 34; --row: 12;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa5" style="--col: 28; --row: 11;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa6" style="--col: 26; --row: 8;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa7" style="--col: 28; --row: 5;"></div>
<div class="mono-graph__node mono-graph__node--warm" data-node="tb0" style="--col: 34; --row: 26;"></div>
<div class="mono-graph__node mono-graph__node--warm" data-node="tb1" style="--col: 27; --row: 24;"></div>
<div class="mono-graph__node mono-graph__node--warm" data-node="tb2" style="--col: 27; --row: 20;"></div>
<div class="mono-graph__node mono-graph__node--warm" data-node="tb3" style="--col: 34; --row: 18;"></div>
<div class="mono-graph__node mono-graph__node--warm" data-node="tb4" style="--col: 41; --row: 20;"></div>
<div class="mono-graph__node mono-graph__node--warm" data-node="tb5" style="--col: 41; --row: 24;"></div>
<div class="mono-graph__node mono-graph__node--warm" data-node="m2" style="--col: 27; --row: 15;"></div>
<div class="mono-graph__node mono-graph__node--warm" data-node="td0" style="--col: 34; --row: 29;"></div>
<div class="mono-graph__node mono-graph__node--warm" data-node="td1" style="--col: 24; --row: 28;"></div>
<div class="mono-graph__node mono-graph__node--warm" data-node="td2" style="--col: 19; --row: 24;"></div>
<div class="mono-graph__node mono-graph__node--warm" data-node="td3" style="--col: 19; --row: 19;"></div>
<div class="mono-graph__node mono-graph__node--warm" data-node="td6" style="--col: 41; --row: 15;"></div>
<div class="mono-graph__node mono-graph__node--warm" data-node="td7" style="--col: 49; --row: 19;"></div>
<div class="mono-graph__node mono-graph__node--warm" data-node="td8" style="--col: 49; --row: 24;"></div>
<div class="mono-graph__node mono-graph__node--warm" data-node="td9" style="--col: 44; --row: 28;"></div>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa0"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa1"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa2"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa3"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa4"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa5"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa6"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa7"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="tb0" data-to="t"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="tb1" data-to="t"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="tb2" data-to="t"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="tb3" data-to="t"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="tb4" data-to="t"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="tb5" data-to="t"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="td0" data-to="tb0"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="td1" data-to="tb1"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="td2" data-to="tb1"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="td2" data-to="tb2"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="td3" data-to="tb2"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="m2" data-to="tb2"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="m2" data-to="tb3"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="td6" data-to="tb3"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="td6" data-to="tb4"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="td7" data-to="tb4"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="td7" data-to="tb5"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="td8" data-to="tb5"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="td9" data-to="tb5"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="td1" data-to="tb0"></span>
</div>
<figcaption>Get all the pages that _can reach the target page_ in 2 links.</figcaption>
</figure>

<figure class="mono-graph mono-graph-animation__frame" style="--graph-cols: 68; --graph-rows: 30;">
<div class="mono-graph__canvas">
<svg class="mono-graph__edges" aria-hidden="true"></svg>
<div class="mono-graph__node mono-graph__node--accent" data-node="s" style="--col: 34; --row: 8;">S</div>
<div class="mono-graph__node mono-graph__node--warm" data-node="t" style="--col: 34; --row: 22;">T</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa0" style="--col: 34; --row: 4;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa1" style="--col: 40; --row: 5;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa2" style="--col: 42; --row: 8;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa3" style="--col: 40; --row: 11;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa4" style="--col: 34; --row: 12;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa5" style="--col: 28; --row: 11;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa6" style="--col: 26; --row: 8;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa7" style="--col: 28; --row: 5;"></div>
<div class="mono-graph__node mono-graph__node--warm" data-node="tb0" style="--col: 34; --row: 26;"></div>
<div class="mono-graph__node mono-graph__node--warm" data-node="tb1" style="--col: 27; --row: 24;"></div>
<div class="mono-graph__node mono-graph__node--warm" data-node="tb2" style="--col: 27; --row: 20;"></div>
<div class="mono-graph__node mono-graph__node--warm" data-node="tb3" style="--col: 34; --row: 18;"></div>
<div class="mono-graph__node mono-graph__node--warm" data-node="tb4" style="--col: 41; --row: 20;"></div>
<div class="mono-graph__node mono-graph__node--warm" data-node="tb5" style="--col: 41; --row: 24;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sc0" style="--col: 34; --row: 1;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sc1" style="--col: 42; --row: 2;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sc2" style="--col: 48; --row: 4;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sc3" style="--col: 50; --row: 8;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sc4" style="--col: 48; --row: 12;"></div>
<div class="mono-graph__node" data-node="m2" style="--col: 27; --row: 15;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sc8" style="--col: 20; --row: 12;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sc9" style="--col: 18; --row: 8;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sc10" style="--col: 20; --row: 4;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sc11" style="--col: 26; --row: 2;"></div>
<div class="mono-graph__node mono-graph__node--warm" data-node="td0" style="--col: 34; --row: 29;"></div>
<div class="mono-graph__node mono-graph__node--warm" data-node="td1" style="--col: 24; --row: 28;"></div>
<div class="mono-graph__node mono-graph__node--warm" data-node="td2" style="--col: 19; --row: 24;"></div>
<div class="mono-graph__node mono-graph__node--warm" data-node="td3" style="--col: 19; --row: 19;"></div>
<div class="mono-graph__node" data-node="td6" style="--col: 41; --row: 15;"></div>
<div class="mono-graph__node mono-graph__node--warm" data-node="td7" style="--col: 49; --row: 19;"></div>
<div class="mono-graph__node mono-graph__node--warm" data-node="td8" style="--col: 49; --row: 24;"></div>
<div class="mono-graph__node mono-graph__node--warm" data-node="td9" style="--col: 44; --row: 28;"></div>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa0"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa1"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa2"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa3"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa4"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa5"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa6"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa7"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa0" data-to="sc0"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa0" data-to="sc1"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa7" data-to="sc11"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa1" data-to="sc1"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa1" data-to="sc2"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa2" data-to="sc2"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa2" data-to="sc3"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa3" data-to="sc4"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa3" data-to="sc5"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa3" data-to="td6"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa4" data-to="m1"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa4" data-to="td6"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa5" data-to="m2"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa5" data-to="sc8"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa6" data-to="sc8"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa6" data-to="sc9"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa6" data-to="sc10"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa7" data-to="sc10"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="td6" data-to="tb3"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="m2" data-to="tb3"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="tb0" data-to="t"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="tb1" data-to="t"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="tb2" data-to="t"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="tb3" data-to="t"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="tb4" data-to="t"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="tb5" data-to="t"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="td7" data-to="tb5"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="td0" data-to="tb0"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="td1" data-to="tb1"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="td1" data-to="tb0"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="td2" data-to="tb1"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="td2" data-to="tb2"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="td3" data-to="tb2"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="m2" data-to="tb2"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="m1" data-to="tb3"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="td6" data-to="tb4"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="td7" data-to="tb4"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="td8" data-to="tb5"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="td9" data-to="tb5"></span>
</div>
<figcaption>Get all the pages that **the start page can reach** in 2 links.</figcaption>
</figure>

<figure class="mono-graph mono-graph-animation__frame" style="--graph-cols: 68; --graph-rows: 30;">
<div class="mono-graph__canvas">
<svg class="mono-graph__edges" aria-hidden="true"></svg>
<div class="mono-graph__node mono-graph__node--accent" data-node="s" style="--col: 34; --row: 8;">S</div>
<div class="mono-graph__node mono-graph__node--warm" data-node="t" style="--col: 34; --row: 22;">4</div>
<div class="mono-graph__node" data-node="sa0" style="--col: 34; --row: 4;"></div>
<div class="mono-graph__node" data-node="sa1" style="--col: 40; --row: 5;"></div>
<div class="mono-graph__node" data-node="sa2" style="--col: 42; --row: 8;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa3" style="--col: 40; --row: 11;">1</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa4" style="--col: 34; --row: 12;">1</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa5" style="--col: 28; --row: 11;">1</div>
<div class="mono-graph__node" data-node="sa6" style="--col: 26; --row: 8;"></div>
<div class="mono-graph__node" data-node="sa7" style="--col: 28; --row: 5;"></div>
<div class="mono-graph__node" data-node="tb0" style="--col: 34; --row: 26;"></div>
<div class="mono-graph__node" data-node="tb1" style="--col: 27; --row: 24;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="tb2" style="--col: 27; --row: 20;">3</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="tb3" style="--col: 34; --row: 18;">3</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="tb4" style="--col: 41; --row: 20;">3</div>
<div class="mono-graph__node" data-node="tb5" style="--col: 41; --row: 24;"></div>
<div class="mono-graph__node" data-node="sc0" style="--col: 34; --row: 1;"></div>
<div class="mono-graph__node" data-node="sc1" style="--col: 42; --row: 2;"></div>
<div class="mono-graph__node" data-node="sc2" style="--col: 48; --row: 4;"></div>
<div class="mono-graph__node" data-node="sc3" style="--col: 50; --row: 8;"></div>
<div class="mono-graph__node" data-node="sc4" style="--col: 48; --row: 12;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="m2" style="--col: 27; --row: 15;">2</div>
<div class="mono-graph__node" data-node="sc8" style="--col: 20; --row: 12;"></div>
<div class="mono-graph__node" data-node="sc9" style="--col: 18; --row: 8;"></div>
<div class="mono-graph__node" data-node="sc10" style="--col: 20; --row: 4;"></div>
<div class="mono-graph__node" data-node="sc11" style="--col: 26; --row: 2;"></div>
<div class="mono-graph__node" data-node="td0" style="--col: 34; --row: 29;"></div>
<div class="mono-graph__node" data-node="td1" style="--col: 24; --row: 28;"></div>
<div class="mono-graph__node" data-node="td2" style="--col: 19; --row: 24;"></div>
<div class="mono-graph__node" data-node="td3" style="--col: 19; --row: 19;"></div>
<div class="mono-graph__node mono-graph__node--accent" data-node="td6" style="--col: 41; --row: 15;">2</div>
<div class="mono-graph__node" data-node="td7" style="--col: 49; --row: 19;"></div>
<div class="mono-graph__node" data-node="td8" style="--col: 49; --row: 24;"></div>
<div class="mono-graph__node" data-node="td9" style="--col: 44; --row: 28;"></div>
<span class="mono-graph__edge" data-from="s" data-to="sa0"></span>
<span class="mono-graph__edge" data-from="s" data-to="sa1"></span>
<span class="mono-graph__edge" data-from="s" data-to="sa2"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa3"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa4"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa5"></span>
<span class="mono-graph__edge" data-from="s" data-to="sa6"></span>
<span class="mono-graph__edge" data-from="s" data-to="sa7"></span>
<span class="mono-graph__edge" data-from="sa0" data-to="sc0"></span>
<span class="mono-graph__edge" data-from="sa0" data-to="sc1"></span>
<span class="mono-graph__edge" data-from="sa7" data-to="sc11"></span>
<span class="mono-graph__edge" data-from="sa1" data-to="sc1"></span>
<span class="mono-graph__edge" data-from="sa1" data-to="sc2"></span>
<span class="mono-graph__edge" data-from="sa2" data-to="sc2"></span>
<span class="mono-graph__edge" data-from="sa2" data-to="sc3"></span>
<span class="mono-graph__edge" data-from="sa3" data-to="sc4"></span>
<span class="mono-graph__edge" data-from="sa3" data-to="sc5"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa3" data-to="td6"></span>
<span class="mono-graph__edge" data-from="sa4" data-to="m1"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa4" data-to="td6"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa5" data-to="m2"></span>
<span class="mono-graph__edge" data-from="sa5" data-to="sc8"></span>
<span class="mono-graph__edge" data-from="sa6" data-to="sc8"></span>
<span class="mono-graph__edge" data-from="sa6" data-to="sc9"></span>
<span class="mono-graph__edge" data-from="sa6" data-to="sc10"></span>
<span class="mono-graph__edge" data-from="sa7" data-to="sc10"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="td6" data-to="tb3"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="m2" data-to="tb3"></span>
<span class="mono-graph__edge" data-from="tb0" data-to="t"></span>
<span class="mono-graph__edge" data-from="tb1" data-to="t"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="tb2" data-to="t"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="tb3" data-to="t"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="tb4" data-to="t"></span>
<span class="mono-graph__edge" data-from="tb5" data-to="t"></span>
<span class="mono-graph__edge" data-from="td7" data-to="tb5"></span>
<span class="mono-graph__edge" data-from="td0" data-to="tb0"></span>
<span class="mono-graph__edge" data-from="td1" data-to="tb1"></span>
<span class="mono-graph__edge" data-from="td1" data-to="tb0"></span>
<span class="mono-graph__edge" data-from="td2" data-to="tb1"></span>
<span class="mono-graph__edge" data-from="td2" data-to="tb2"></span>
<span class="mono-graph__edge" data-from="td3" data-to="tb2"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="m2" data-to="tb2"></span>
<span class="mono-graph__edge" data-from="m1" data-to="tb3"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="td6" data-to="tb4"></span>
<span class="mono-graph__edge" data-from="td7" data-to="tb4"></span>
<span class="mono-graph__edge" data-from="td8" data-to="tb5"></span>
<span class="mono-graph__edge" data-from="td9" data-to="tb5"></span>
</div>
<figcaption>Find all the connections to the nodes where they intersect.</figcaption>
</figure>

<figure class="mono-graph mono-graph-animation__frame" style="--graph-cols: 68; --graph-rows: 30;">
<div class="mono-graph__canvas">
<svg class="mono-graph__edges" aria-hidden="true"></svg>
<div class="mono-graph__node mono-graph__node--accent" data-node="s" style="--col: 34; --row: 8;">S</div>
<div class="mono-graph__node mono-graph__node--warm" data-node="t" style="--col: 34; --row: 22;">4</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa3" style="--col: 40; --row: 11;">1</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa4" style="--col: 34; --row: 12;">1</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="sa5" style="--col: 28; --row: 11;">1</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="tb2" style="--col: 27; --row: 20;">3</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="tb3" style="--col: 34; --row: 18;">3</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="tb4" style="--col: 41; --row: 20;">3</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="m2" style="--col: 27; --row: 15;">2</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="td6" style="--col: 41; --row: 15;">2</div>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa3"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa4"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="s" data-to="sa5"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa3" data-to="td6"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa4" data-to="td6"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="sa5" data-to="m2"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="td6" data-to="tb3"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="m2" data-to="tb3"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="tb2" data-to="t"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="tb3" data-to="t"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="tb4" data-to="t"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="m2" data-to="tb2"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="td6" data-to="tb4"></span>
</div>
<figcaption>We have found the shortest paths from start to target!</figcaption>
</figure>

</div>
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
