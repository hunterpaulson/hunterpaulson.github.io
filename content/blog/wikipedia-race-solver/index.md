---
title: how to build the fastest wikipedia race solver on the internet
date: 2026-04-30
---

# how to build the fastest wikipedia race solver on the internet
<!-- # how to build an instantaneous Wikipedia solver -->
<!-- # how to build a real-time Wikipedia solver -->

<!-- to mom and dad: for getting me into computers -->

imagine you are reading the Wikipedia page for [Matcha](https://en.wikipedia.org/wiki/Matcha), and your trying to figure out how society got from this to [Labubu](https://en.wikipedia.org/wiki/Labubu)... but you can only navigate using links on the current page. no search bar. no back button. no CTRL+F. just blue links.

<figure class="wiki-page-pair">
<img src="/assets/blog/wikipedia-race-solver/matcha.png" alt="Screenshot of the Matcha Wikipedia page">
<img src="/assets/blog/wikipedia-race-solver/labubu.png" alt="Screenshot of the Labubu Wikipedia page">
</figure>

How long and how many clicks do you think it would take?

I wanted to answer both questions so I built a solver that can find the shortest path between _any_ two english Wikipedia pages in milliseconds.


# wikipedia is a _graph_

Every[^1] wikipedia page has links to other wikipedia pages and by clicking on one of those links we end up on that page.

[^1]: on [enwiki-20260401](https://dumps.wikimedia.org/enwiki/20260401/) there are 1,205 pages with _zero_ outgoing or incoming links, 2,247 with zero _outgoing_ links, and 283,534 (3.95842%) with zero _incoming_ links.

Because of this Wikipedia can be thought of as a graph where **each page is a node** and **each link is an edge**[^2].

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
<figcaption>You can get from [Matcha](https://en.wikipedia.org/wiki/Matcha) to [Labubu](https://en.wikipedia.org/wiki/Labubu) in [3 clicks](https://wikiarena.org/solver?start=Matcha&target=Labubu&mode=all_shortest)</figcaption>
</figure>

There is actually a semi-official game called [Wikiracing](https://en.wikipedia.org/wiki/Wikiracing) where "players compete to navigate from one Wikipedia page to another (chosen manually or randomly) using only the internal links of the page". 

There are two variants of Wikiracing. One tries to reach the goal in the _fewest number of clicks_ and the the other tries to get there in the _shortest amount of time_. So I challenged myself to build **the fastest Wikipedia solver on the internet**[^3] at both...

[^3]: that I know of. [please tell me if I am misinformed](https://xkcd.com/386/) so I have a benchmark to target.

You can play with it [here](https://wikiarena.org/solver). 

For the rest of this blog I am going to try my best to walk through how it works in a way show shows how you could have arrived at building it too.

# brute force

In computer science class I was taught to always think about the brute force solution to your problem first. computers are pretty fast so this is usually a great way to get a feel for its complexity.

We havent even defined our problem yet so lets do that first:

> Given a Start and Target page: (S, T). Get from the S to the T using only links on the current page at each step. 

So imagine we start out on a random page that we know is part of a larger graph. Our goal is to find a specific page but we have no idea where it is on the graph. The only information we have is the pages that our current page links to, but unfortunately none of them our our target page. So somehow we have to use those links to find our target page.

What should we do?

idk, ¯\\\_(ツ)_/¯, lets try brute force... imagine we had infinite time and infinite browser tabs. what could we do? 

... we could **click every link** on the start page.

And if none of them linked to the target page we could click every link[^4] on every one of those pages. 

[^4]: that we haven't visited already.

If none of them linked to the target page we could do it again...

and then again...

and again...

until we found the target page.

{{ include "content/includes/animations/wikipedia-bfs.html" }}

We just performed what is called [breadth-first search](https://en.wikipedia.org/wiki/Breadth-first_search).

It was a lot of work, but some how we found the our way to the target page.

But notice, we didn't just find any way from the start to the target, **we actually _all_ shortest paths between the two pages**.

We should take a second to appreciate this. By expanding our web of pages one ring at a time we actually are guaranteed to find all shortest paths. If a shorter path was possible we would have found it one ring earlier.

As you can see we had to check a lot of pages that were not part of any shortest paths. This wasted computation is unavoidable since we have no way of knowing ex ante which pages will be on the shortest paths.

# can we do better?

If our initial approach is already guarantted to find all shortest paths as soon as possible, how can we make it more efficient and therefore faster? 

The issue with our approach is that the amount of work we have to do for each successive ring grows exponentially. Similar to how the area of a circle grows proportionally to the square of its radius, but much worse. The amount of work we have to do on the start page approximately the same as the amount of work we have do on every page that it links to in the first ring. Roughly speaking _it takes more work to explore the next ring than it took to explore all previous rings combined_.

So to minimize total work we need to minimize the number of rings we have to explore... 

But aren't we already exploring the minimum number of rings?

Yes... if we explore only from the start page. 

Remember, initially we know about one other page: the target page.

But, careful, we cant naively apply this same process to the target page because the links on the target page link **away** from the target page. We need the the pages that link _towards_ the target page.

These are called the target page's 'backlinks'. For example, if there is a **link** from page A to page B, then we can also think of it as a _backlink_ from page B to page A.

So if we have a way to explore all the 'backlinks' into a page then we can run this process in reverse as well starting from the target page. I will explain how we build this later but for now lets see it in action.

# the algorithm: bidirectional breadth-first search

I like to visualize this process kinda as two expanding solar systems centered on the start and target page that grow until they overlap. Every step of the algorithm we add an new further out orbit to one of the solar systems. As soon as the two outermost orbits intersect we know that we have found the shortest path(s).

Our previous approach was called breadth-first search, so it won't surprise you that this new approach is called [bidirectional breadth-first search](https://en.wikipedia.org/wiki/Bidirectional_search).

{{ include "content/includes/animations/wikipedia-bidirectional-bfs.html" }}

## so its just brute force in both directions? 

Pretty much, yes. The additional complexity is that we now have to decide which direction to expand at each step.

Here are the steps to the algorithm:

1. Initially we only know about the **start** and _target_ page and we have no idea how far apart they are. 

2. We begin by checking either all the **outgoing** links for the start page or all the _incoming_ links for the target page. In order to guarantee we find the shortest path we have no choice but to check every outgoing and incoming link for every page we encounter from here on out.

3. Since we got all the incoming links to the target page in the previous step we now need to get all the outgoing links from the start page. Both of our solar systems have their first orbital ring. We call the outer ring of pages that are all exactly K links away from the center node the 'frontier'.

4. Now we need to decide which frontier to explore next. Our goal is to minimize the number of pages we have to check so we explore the frontier with the _fewest_ pages[^6]. Since our target frontier has _6_ pages and our start frontier has **8** we explore the target frontier. Notice that this is exactly what we just did in step 3 when start frontier had one page.

5. Repeat the previous step until our frontiers intersect. We iteratively continue this process until we encounter a page that is part of the other solar system.

6. Once our frontiers intersect at at least one page we know that we have found the shortest path between the start and target page.

[^6]: The astute among you will notice that we actually want to expand the frontier with the fewest _edges_ (not _nodes_). However we don't actually know how many edges each frontier has without summing them up for every page in **both** frontiers. requiring a memory read for every page in both frontiers plus the required work to get all the edges of the smaller frontier. We can save some time and effort with a simple heuristic: since wikipedia has an equal number of incoming and outgoing links we know that number of edges in a frontier is proportional to the number of nodes in the frontier. by chosing the frontier with the fewest nodes we make the optimal choice in expectation.

<!-- TODO: test this empirically
The reads to sum up the frontier size is pretty cheap since you it is just (out_offsets[page + 1] - out_offsets[page]) for each page. And we can reuse this read when actually fetching and in future steps when need to recheck the frontier size again we will already have the size for 1/2. Is the extra work worth _always_ doing the optimal expansion. Are we optimizing for the average or worst case performance?
-->

## pretty cool right?

I first learned about this approach from [Six Degrees of Wikipedia](https://www.sixdegreesofwikipedia.com/). They were an inspiration and baseline for this work. One of the reasons I built this was to measure if the [six degrees of separation](https://en.wikipedia.org/wiki/Wikipedia:Six_degrees_of_Wikipedia) hypothesis is empirically true.

Unfortunately it turns out that, at least for Wikipedia, it is empirically **false**. The [diameter](https://en.wikipedia.org/wiki/Graph_diameter) of english Wikipedia is **41**[^7].

[^7]: The shortest path between 'Yu ssi samdaerok' and '2009 California League season' is [41 steps](https://wikiarena.org/solver?start=Yu+ssi+samdaerok&target=2009+California+League+season&mode=all_shortest)

# making it _fast_

Now that we intuitively know how the algorithm works we have to teach a computer how to do it since they are much much faster than me clicking links.

## representing a graph on a computer

Computers operate on sequences of bits. So how do we turn circles with arrows between them into a continuous sequence of 1s and 0s?

Lets start by looking at this from the perspective of a single node on the graph and its links. We can then apply the same logic to any graph. Here is a toy graph of a [Bittern](https://en.wikipedia.org/wiki/Bittern) and its neighbors.

<figure class="mono-graph" style="--graph-cols: 62; --graph-rows: 16;">
<div class="mono-graph__canvas">
<svg class="mono-graph__edges" aria-hidden="true"></svg>
<div class="mono-graph__node mono-graph__node" data-node="bittern" style="--col: 29; --row: 8;">Bittern</div>
<div class="mono-graph__node mono-graph__node--warm" data-node="avocet" style="--col: 7; --row: 3;">Avocet</div>
<div class="mono-graph__node mono-graph__node--warm" data-node="curlew" style="--col: 50; --row: 3;">Curlew</div>
<div class="mono-graph__node mono-graph__node--warm" data-node="finch" style="--col: 29; --row: 15;">Finch</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="egret" style="--col: 19; --row: 2;">Egret</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="heron" style="--col: 43; --row: 7;">Heron</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="ibis" style="--col: 44; --row: 12;">Ibis</div>
<div class="mono-graph__node mono-graph__node--accent" data-node="lark" style="--col: 12; --row: 12;">Lark</div>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="avocet" data-to="bittern"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="curlew" data-to="bittern"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="finch" data-to="bittern"></span>
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

We can start by just listing the pages that each page links to. 

<figure class="csr-figure">
<pre class="csr-diagram" aria-label="Bittern neighborhood as an adjacency list">
page     links to
───────  ───────────────────────────
Avocet   Bittern
Bittern  Egret, Heron, Ibis, Lark
Curlew   Bittern
Finch    Bittern
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
Avocet     link     .       .       .       .
Bittern    .        link    link    link    link
Curlew     link     .       .       .       .
Finch      link     .       .       .       .
</pre>
</figure>

If we replace the 'link' with a 1 and the '.' with a 0 we get the following matrix:

<figure class="csr-figure">
<pre class="csr-diagram" aria-label="Bittern neighborhood as an adjacency matrix">
from \ to  Bittern  Egret   Heron   Ibis    Lark
─────────  ───────  ──────  ──────  ──────  ──────
Avocet     1        0       0       0       0
Bittern    0        1       1       1       1
Curlew     1        0       0       0       0
Finch      1        0       0       0       0
</pre>
<figcaption>Bittern graph as an adjacency matrix of **outgoing** links</figcaption>
</figure>

FUN FACT: The matrix of _incoming_ links is just the [transpose](https://en.wikipedia.org/wiki/Transpose) of the matrix of **outgoing** links.

## turning wikipedia into a sequence of numbers

Computers love to store matricies. Since you can just append each row to the previous and store them as a continuous sequence without any padding.

Our matrix:

<figure class="csr-figure">
<pre class="csr-diagram" aria-label="Bittern neighborhood as an adjacency matrix">
1  0  0  0  0
0  1  1  1  1
1  0  0  0  0
1  0  0  0  0
</pre>
</figure>
becomes
<figure class="csr-figure">
<pre class="csr-diagram" aria-label="Bittern neighborhood as an adjacency matrix">
[0  1  1  1  1][1  0  0  0  0][1  0  0  0  0][1  0  0  0  0]
</pre>
</figure>

So can we just store wikipedia this way? 

Not quite.

Every page in our graph is a row and column of our adjacency matrix. There are >7 Million wikipedia pages so our matrix would take 7M * 7M = 49 Trillion bits (5.125 Terrabytes) to store.

However you probably noticed that because every page does not link to every other page there is alot of empty space (zeros) in this matrix. Matrices like this, with lots of zeros, are called [sparse matrices](https://en.wikipedia.org/wiki/Sparse_matrix).

We can actually represent the same data with a lot less bytes by using a [compressed sparse row](https://en.wikipedia.org/wiki/Sparse_matrix#Compressed_sparse_row_(CSR,_CRS_or_Yale_format)) (CSR).


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
title   │Bittern│ Duck  │ Egret │ Heron │ Ibis  │ Lark  │Bittern│ Wren  │
        └───────┴───────┴───────┴───────┴───────┴───────┴───────┴───────┘
                        └─── Bittern links to [2..6) ───┘
</pre>
<figcaption>How we store that Bittern links to [Egret, Heron, Ibis, Lark]</figcaption>
</figure>

Each page's ID tells us where it is in the sequence of out_offsets. Then we use that to find the pages it links to in the continuous sequence of out_neighbors. 

<!-- FOOTNOTE we only store a map from id to title.
since titles are sorted we don't need a map from title to memory.
given a title we can use binary search to find its id.
since we have 7,162,815 pages worst case we have to do ceil(log2(7162815)) = 23 reads to find the id. -->

This saves us a lot of space. The tradeoff is that we have to store both the **out** and _in_ rows. Because we can no longer transpose our metrix to get the backlinks.

<figure class="mono-graph" style="--graph-cols: 52; --graph-rows: 12;">
<div class="mono-graph__canvas">
<svg class="mono-graph__edges" aria-hidden="true"></svg>
<div class="mono-graph__node mono-graph__node" data-node="bittern" style="--col: 24; --row: 6;">Bittern</div>
<div class="mono-graph__node mono-graph__node--warm" data-node="avocet" style="--col: 7; --row: 2;">Avocet</div>
<div class="mono-graph__node mono-graph__node--warm" data-node="curlew" style="--col: 42; --row: 3;">Curlew</div>
<div class="mono-graph__node mono-graph__node--warm" data-node="finch" style="--col: 24; --row: 11;">Finch</div>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="avocet" data-to="bittern"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="curlew" data-to="bittern"></span>
<span class="mono-graph__edge mono-graph__edge--warm" data-from="finch" data-to="bittern"></span>
</div>
<figcaption>[Avocet, Curlew, Finch] have a link to Bittern</figcaption>
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
title   │ Crane │ Crow  │Avocet │Curlew │ Finch │ Swan  │ Tern  │
        └───────┴───────┴───────┴───────┴───────┴───────┴───────┘
                        └[2..5) links to Bittern┘
</pre>
<figcaption>How we store that [Avocet, Curlew, Finch] have a link to Bittern</figcaption>
</figure>

We store all of these continuously in memory as one continuous string of bytes.

In total our entire graph takes up 4.1 Billion bytes or ~4.1 GB. Making it small enough to fit entirely into RAM on most modern machines. This extremely important because [>15x faster](https://static.googleusercontent.com/media/sre.google/en//static/pdf/rule-of-thumb-latency-numbers-letter.pdf) to read from RAM than from an SSD.

<!-- do exact calcualtion to show total bytes -->

<!-- This layout matches the way modern machines want to read memory. if a page has four neighbors, i can pull those four ids from a contiguous region instead of bouncing around memory one pointer at a time. -->

# preprocessing the graph

coming soon...
