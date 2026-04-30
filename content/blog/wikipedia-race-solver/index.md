---
title: how to build the fastest wikipedia race solver on the internet
date: 2026-04-30
---

# how to build the fastest wikipedia race solver on the internet

<!-- TODO: needs a better title
TODO: needs a hook here
- do I claim to be the fastest here? does that hurt the likelihood of my mom and dad understanding it or does that hook even them?

to mom and dad: for getting me into computers -->


# wikipedia is a _graph_

Every<sup>[^1]</sup> wikipedia page has links to other wikipedia pages and by clicking on one of those links we end up on that page.

[^1]: on [enwiki-20260401](https://dumps.wikimedia.org/enwiki/20260401/) there are 1,205 pages with _zero_ outgoing or incoming links, 2,247 with zero _outgoing_ links, and 283,534 (3.95842%) with zero _incoming_ links.

Because of this Wikipedia can be thought of as a graph where **each page is a node** and **each link is an edge**<sup>[^2]</sup>.

[^2]: redirect links are equivalent to edges even though wikipedia stores them as separate pages. see more in the preprocessing section.

<figure class="mono-graph" style="--graph-cols: 68; --graph-rows: 22;">
<div class="mono-graph__canvas">
<svg class="mono-graph__edges" aria-hidden="true"></svg>
<div class="mono-graph__node mono-graph__node--warm" data-node="dune" style="--col: 28; --row: 11;">Dune (novel)</div>
<div class="mono-graph__node" data-node="davidlynch" style="--col: 28; --row: 3;">David Lynch</div>
<div class="mono-graph__node" data-node="frankherbert" style="--col: 43; --row: 5;">Frank Herbert</div>
<div class="mono-graph__node" data-node="starwars" style="--col: 51; --row: 11;">Star Wars</div>
<div class="mono-graph__node" data-node="zendaya" style="--col: 46; --row: 17;">Zendaya</div>
<div class="mono-graph__node" data-node="denisvilleneuve" style="--col: 26; --row: 19;">Denis Villeneuve</div>
<div class="mono-graph__node" data-node="ecology" style="--col: 14; --row: 17;">Ecology</div>
<div class="mono-graph__node" data-node="hugoaward" style="--col: 7; --row: 11;">Hugo Award</div>
<div class="mono-graph__node" data-node="scifi" style="--col: 10; --row: 5;">Science fiction</div>
<span class="mono-graph__edge" data-from="dune" data-to="davidlynch"></span>
<span class="mono-graph__edge" data-from="dune" data-to="frankherbert"></span>
<span class="mono-graph__edge" data-from="dune" data-to="starwars"></span>
<span class="mono-graph__edge" data-from="dune" data-to="zendaya"></span>
<span class="mono-graph__edge" data-from="dune" data-to="denisvilleneuve"></span>
<span class="mono-graph__edge" data-from="dune" data-to="ecology"></span>
<span class="mono-graph__edge" data-from="dune" data-to="hugoaward"></span>
<span class="mono-graph__edge" data-from="dune" data-to="scifi"></span>
<span class="mono-graph__edge" data-from="davidlynch" data-to="frankherbert"></span>
<span class="mono-graph__edge" data-from="scifi" data-to="starwars"></span>
<span class="mono-graph__edge" data-from="frankherbert" data-to="hugoaward"></span>
<span class="mono-graph__edge" data-from="hugoaward" data-to="scifi"></span>
<span class="mono-graph__edge" data-from="denisvilleneuve" data-to="zendaya"></span>
<span class="mono-graph__edge" data-from="denisvilleneuve" data-to="frankherbert"></span>
<span class="mono-graph__edge" data-from="scifi" data-to="frankherbert"></span>
</div>
<figcaption>Eight of 'Dune (novel)'s 723 outgoing links</figcaption>
</figure>

We traverse the graph by clicking on a link to another page. If we click on the right sequence of links we can get from one page to almost any other page.
- footnote: wikipedia is not a [fully connected graph](https://en.wikipedia.org/wiki/Connected_graph) so not every page is reachable from every other page.

<figure class="mono-graph" style="--graph-cols: 60; --graph-rows: 21;">
<div class="mono-graph__canvas">
<svg class="mono-graph__edges" aria-hidden="true"></svg>
<div class="mono-graph__node" data-node="sushi" style="--col: 8; --row: 3;">Sushi</div>
<div class="mono-graph__node" data-node="matcha" style="--col: 25; --row: 1;">Matcha</div>
<div class="mono-graph__node" data-node="greentea" style="--col: 40; --row: 3;">Green tea</div>
<div class="mono-graph__node" data-node="starbucks" style="--col: 5; --row: 9;">Starbucks</div>
<div class="mono-graph__node" data-node="matchalatte" style="--col: 22; --row: 7;">Matcha Latte</div>
<div class="mono-graph__node" data-node="tiktok" style="--col: 43; --row: 9;">TikTok</div>
<div class="mono-graph__node" data-node="clairo" style="--col: 5; --row: 15;">Clairo</div>
<div class="mono-graph__node" data-node="perfmale" style="--col: 19; --row: 13;">Performative Male</div>
<div class="mono-graph__node" data-node="genz" style="--col: 44; --row: 15;">Generation Z</div>
<div class="mono-graph__node" data-node="labubu" style="--col: 25; --row: 19;">Labubu</div>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="matcha" data-to="matchalatte"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="matchalatte" data-to="perfmale"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="perfmale" data-to="labubu"></span>
<span class="mono-graph__edge" data-from="matcha" data-to="sushi"></span>
<span class="mono-graph__edge" data-from="matcha" data-to="greentea"></span>
<span class="mono-graph__edge" data-from="matchalatte" data-to="starbucks"></span>
<span class="mono-graph__edge" data-from="matchalatte" data-to="tiktok"></span>
<span class="mono-graph__edge" data-from="perfmale" data-to="clairo"></span>
<span class="mono-graph__edge" data-from="perfmale" data-to="genz"></span>
</div>
<figcaption>You can get from [Matcha](https://en.wikipedia.org/wiki/Matcha) to [Labubu](https://en.wikipedia.org/wiki/Labubu) in 3 clicks</figcaption>
</figure>

There is actually a semi-official game called [Wikiracing](https://en.wikipedia.org/wiki/Wikiracing) where "players compete to navigate from one Wikipedia page to another (chosen manually or randomly) using only the internal links of the page". 

There are two variants of Wikiracing. One minimizes the _number of clicks_ and the the other minimizes the _time to complete the race_. I thought it would be a fun challenge to see if I could build a system that is the fastest in the internet at both.

Here is how it works...
TODO: should the below section be hook?
So here is how I built fastest wikipedia race solver on the internet<sup>[^3]</sup>. You can play with my solver [here](https://wikiarena.org/solver) and try overload it.

[^3]: that I know of. [please tell me if I am wrong](https://xkcd.com/386/)

# the algorithm: bidirectional breadth-first search

To start we need an algorithm to find the shortest path was between _any_ two randomly selected pages on Wikipedia.

The only information we start with is the page we are initially on: the **start page (S)**. and the page we want to get to: the _target page (T)_.

I like to visualize this process kinda as two expanding solar systems centered on the start and target page that grow until they overlap. Every step of the algorithm we add an new further out orbit to one of the solar systems. As soon as the two outermost orbits intersect we know that we have found the shortest path(s).

<div class="mono-graph-animation" data-interval="1400">

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

As you can see the algorithm is pretty straight forward and brute force. 

1. Initially we only know about the **start** and _target_ page. And we have no idea how far apart they are. 

2. We begin by checking either all the **outgoing** links for the start page or all the _incoming_ links for the target page. In order to guarantee we find the shortest path we have no choice but to check every outgoing and incoming link for every page we encounter from here on out.

3. Since we got all the incoming links to the target page in the previous step we now need to get all the outgoing links from the start page. Both of our solar systems have their first orbital ring. We call the outer ring of pages that are all exactly K links away from the center node the frontier.

4. Now we need to decide which frontier to grow next. Our goal is to minimize the number of pages we have to check so we expand the frontier with the _fewest_ pages<sup>[^4]</sup>. Since our target frontier has _6_ pages and our start frontier has **8** we expand the target frontier. Notice that this is exactly what we just did in step 3 when start frontier had one page.

5. Repeat the previous step until our frontiers intersect. We iteratively continue this process until we encounter a page that is part of the other solar system.

6. Once our frontiers intersect at at least one page we know that we have found the shortest path between the start and target page.

7. As you can see we had to check a lot of pages that were not on the shortest path. This wasted computation is unavoidable since we have no way of knowing ex ante which pages will be on the shortest path.

[^4]: The astute among you will notice that we actually want to expand the frontier with the fewest _edges_ (not _nodes_). However we don't actually know how many edges each frontier has without summing them up for every page in **both** frontiers. requiring a memory read for every page in both frontiers plus the required work to get all the edges of the smaller frontier. We can save some time and effort with a simple heuristic: since wikipedia has an equal number of incoming and outgoing links we know that number of edges in a frontier is proportional to the number of nodes in the frontier. by chosing the frontier with the fewest nodes we make the optimal choice in expectation.

<!-- TODO: test this empirically
The reads to sum up the frontier size is pretty cheap since you it is just (out_offsets[page + 1] - out_offsets[page]) for each page. And we can reuse this read when actually fetching and in future steps when need to recheck the frontier size again we will already have the size for 1/2. Is the extra work worth _always_ doing the optimal expansion. Are we optimizing for the average or worst case performance?
-->

## sounds easy right?

I first learned about this approach through [Six Degrees of Wikipedia](https://www.sixdegreesofwikipedia.com/). They were an inspiration and baseline for this work. One of the reasons I built this was to measure if the [six degrees of separation](https://en.wikipedia.org/wiki/Six_degrees_of_separation) hypothesis is empirically true.

Unfortunately it turns out that, at least for Wikipedia, it is **false**. The [diameter](https://en.wikipedia.org/wiki/Graph_diameter) of Wikipedia is **41**<sup>[^5]</sup>.

[^5]: The shortest path between 'Yu ssi samdaerok' and '2009 California League season' is [41 steps](https://wikiarena.org/solver?start=Yu+ssi+samdaerok&target=2009+California+League+season&mode=all_shortest)

<!-- # making it _fast_

Now that we intuitively know how the algorithm works we have to teach a computer how to do it since they are much much faster than me clicking links.

## representing a graph on a computer

Computers operate on sequences of bits. So how do we turn circles with arrows between them into a continuous sequence of 1s and 0s?

Lets start by looking at this from the perspective of a single node on the graph and its links. We can then apply the same logic to any graph. Here is a toy graph of a [Bittern](https://en.wikipedia.org/wiki/Bittern) and its neighbors.

<figure class="mono-graph" style="--graph-cols: 62; --graph-rows: 16;">
<div class="mono-graph__canvas">
<svg class="mono-graph__edges" aria-hidden="true"></svg>
<div class="mono-graph__node mono-graph__node" data-node="bittern" style="--col: 29; --row: 8;">Bittern</div>
<div class="mono-graph__node mono-graph__node--warm" data-node="eagle" style="--col: 7; --row: 3;">Eagle</div>
<div class="mono-graph__node mono-graph__node--warm" data-node="finch" style="--col: 50; --row: 3;">Finch</div>
<div class="mono-graph__node mono-graph__node--warm" data-node="raven" style="--col: 29; --row: 15;">Raven</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="egret" style="--col: 19; --row: 2;">Egret</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="heron" style="--col: 43; --row: 7;">Heron</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="ibis" style="--col: 44; --row: 12;">Ibis</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="lark" style="--col: 12; --row: 12;">Lark</div>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="eagle" data-to="bittern"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="finch" data-to="bittern"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="raven" data-to="bittern"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="bittern" data-to="egret"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="bittern" data-to="heron"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="bittern" data-to="ibis"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="bittern" data-to="lark"></span>
</div>
<figcaption></figcaption>
</figure>

Bittern has a link to Egret, Heron, Lark, and Ibis. While Eagle, Finch, and Raven each link to Bittern.

There are two ways to represent a graph like this on a computer.

## 1. an adjacency list

We can start by just listing the other pages that each page links to. 

<figure class="csr-figure">
<pre class="csr-diagram" aria-label="Bittern neighborhood as an adjacency list">
page     links to
───────  ───────────────────────────
Bittern  Egret, Heron, Ibis, Lark
Eagle    Bittern
Finch    Bittern
Raven    Bittern
</pre>
<figcaption>Bittern graph as an adjacency list</figcaption>
</figure>

Notice that links are directional so we only have a row for each page that has an outgoing link.

## 2. an adjacency matrix 

You may have noticed that the above table kinda looks like a matrix. So lets convert it to a matrix where the rows are the source pages and the columns are the destination pages. We will write 'link' if there is a link from source to destination.

<figure class="csr-figure">
<pre class="csr-diagram" aria-label="Bittern neighborhood as an adjacency matrix">
from \ to  Bittern  Egret   Heron   Ibis    Lark
─────────  ───────  ──────  ──────  ──────  ──────
Bittern    .        link    link    link    link
Eagle      link     .       .       .       .
Finch      link     .       .       .       .
Raven      link     .       .       .       .
</pre>
</figure>

If we replace the 'link' with a 1 and the '.' with a 0 we get the following matrix:

<figure class="csr-figure">
<pre class="csr-diagram" aria-label="Bittern neighborhood as an adjacency matrix">
from \ to  Bittern  Egret   Heron   Ibis    Lark
─────────  ───────  ──────  ──────  ──────  ──────
Bittern    0        1       1       1       1
Eagle      1        0       0       0       0
Finch      1        0       0       0       0
Raven      1        0       0       0       0
</pre>
<figcaption>Bittern graph as an adjacency matrix of **outgoing** links</figcaption>
</figure>

FUN FACT: The matrix of _incoming_ links is just the [transpose](https://en.wikipedia.org/wiki/Transpose) of the matrix of **outgoing** links.

## turning wikipedia into a sequence of numbers

Computers love to store matricies. Since you can just append each row to the previous and store them as a continuous sequence without any padding.

Our matrix:

<figure class="csr-figure">
<pre class="csr-diagram" aria-label="Bittern neighborhood as an adjacency matrix">
0  1  1  1  1
1  0  0  0  0
1  0  0  0  0
</pre>
</figure>
becomes
<figure class="csr-figure">
<pre class="csr-diagram" aria-label="Bittern neighborhood as an adjacency matrix">
[0  1  1  1  1][1  0  0  0  0][1  0  0  0  0][1  0  0  0  0][1  0  0  0  0]
</pre>
</figure>

So can we just store wikipedia this way? 

no

Every page in our graph is a row and column of our adjacency matrix. There are >7 Million wikipedia pages so our matrix would take 7M * 7M = 49 Trillion bits or 5.125 Terrabytes to store.

However you probably noticed that because every page does not link to every other page there is alot of empty space (zeros) in this matrix. Matrices like this, with lots of zeros, are called [sparse matrices](https://en.wikipedia.org/wiki/Sparse_matrix).

We can actually represent this the same data with a lot less bytes by using a [compressed sparse row](https://en.wikipedia.org/wiki/Sparse_matrix#Compressed_sparse_row_(CSR,_CRS_or_Yale_format)) (CSR).


<figure class="mono-graph" style="--graph-cols: 56; --graph-rows: 14;">
<div class="mono-graph__canvas">
<svg class="mono-graph__edges" aria-hidden="true"></svg>
<div class="mono-graph__node mono-graph__node" data-node="bittern" style="--col: 25; --row: 7;">Bittern</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="egret" style="--col: 9; --row: 2;">Egret</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="heron" style="--col: 43; --row: 3;">Heron</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="ibis" style="--col: 42; --row: 11;">Ibis</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="lark" style="--col: 10; --row: 12;">Lark</div>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="bittern" data-to="egret"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="bittern" data-to="heron"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="bittern" data-to="ibis"></span>
<span class="mono-graph__edge mono-graph__edge--accent" data-from="bittern" data-to="lark"></span>
</div>
<figcaption>Bittern has outgoing links to [Egret, Heron, Ibis, Lark]</figcaption>
</figure>

<figure class="csr-figure">
<pre class="csr-diagram" aria-label="outgoing links represented as compressed sparse row arrays">
out_offsets
page       ...   Avocet  Bittern Curlew   ...
        ┌───────┬───────┬───────┬───────┬───────┐
offset  │  ...  │   0   │   2   │   6   │  ...  │
        └───────┴───────┼───────┼───────┴───────┘
                        │       │
                        │       │
                        │       └───────────────────────┐
out_neighbors           │                               │
index    0       1      │2       3       4       5      │6       7
        ┌───────┬───────┼───────┬───────┬───────┬───────┼───────┬───────┐
title   │ Dove  │ Duck  │ Egret │ Heron │ Ibis  │ Lark  │ Owl   │ Wren  │
        └───────┴───────┴───────┴───────┴───────┴───────┴───────┴───────┘
                        └─── Bittern links to [2..6) ───┘
</pre>
<figcaption>How we store that Bittern links to [Egret, Heron, Ibis, Lark]</figcaption>
</figure>

The only drawback is that we have to store both the **out** and _in_ rows.

<figure class="mono-graph" style="--graph-cols: 52; --graph-rows: 12;">
<div class="mono-graph__canvas">
<svg class="mono-graph__edges" aria-hidden="true"></svg>
<div class="mono-graph__node mono-graph__node" data-node="bittern" style="--col: 24; --row: 6;">Bittern</div>
<div class="mono-graph__node mono-graph__node--warm" data-node="eagle" style="--col: 7; --row: 2;">Eagle</div>
<div class="mono-graph__node mono-graph__node--warm" data-node="finch" style="--col: 42; --row: 3;">Finch</div>
<div class="mono-graph__node mono-graph__node--warm" data-node="raven" style="--col: 24; --row: 11;">Raven</div>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="eagle" data-to="bittern"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="finch" data-to="bittern"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="raven" data-to="bittern"></span>
</div>
<figcaption>[Eagle, Finch, Raven] have a link to Bittern</figcaption>
</figure>

<figure class="csr-figure">
<pre class="csr-diagram" aria-label="incoming links represented as compressed sparse row arrays">
in_offsets
page       ...   Avocet  Bittern Curlew    ...
        ┌───────┬───────┬───────┬───────┬───────┐
offset  │  ...  │   0   │   2   │   5   │  ...  │
        └───────┴───────┼───────┼───────┴───────┘
                        │       │
                        │       │
                        │       └───────────────┐
in_neighbors            │                       │
index    0       1      │2       3       4      │5       6
        ┌───────┬───────┼───────┬───────┬───────┼───────┬───────┐
title   │ Crane │ Crow  │ Eagle │ Finch │ Raven │ Swan  │ Tern  │
        └───────┴───────┴───────┴───────┴───────┴───────┴───────┘
                        └[2..5) links to Bittern┘
</pre>
<figcaption>How we store that [Eagle, Finch, Raven] have a link to Bittern</figcaption>
</figure>

we store this continuously in memory

this layout matches the way modern machines want to read memory. if a page has four neighbors, i can pull those four ids from a contiguous region instead of bouncing around memory one pointer at a time.

FOOTNOTE we only store a map from id to title.
since titles are sorted we don't need a map from title to memory.
given a title we can use binary search to find its id.
since we have 7,162,815 pages worst case we have to do ceil(log2(7162815)) = 23 reads to find the id. -->