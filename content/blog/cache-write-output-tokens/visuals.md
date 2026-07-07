---
title: cache visuals lab
---

# cache visuals lab

this page is a playground for reusable token, kv-cache, and cache-retention diagrams. the goal is to keep the primitives composable enough to reuse in later inference posts.

## context animation prototypes

These use the same stepper pattern as the Wikipedia graph animations: each frame is one API boundary, while the viewport keeps the size of the largest frame so the controls stay put.

### current API behavior

{{ include "content/includes/animations/cache-write-context-current.html" }}

### with retained output tokens

{{ include "content/includes/animations/cache-write-context-retained.html" }}


<div class="llm-cache-design-note">
off-by-one detail: a sampled token receives its K/V when it is fed into the next decode step. therefore all generated tokens except possibly the final sampled token already have reusable K/V state.
</div>

variant A is probably the better main-post diagram because it gives the conclusion immediately. variant B is more technically precise and may belong directly after it or in the appendix.

## retention — variant A: same blocks, different lifetime

<figure class="llm-cache-visual" aria-label="comparison between discarding generated key value state at the API response boundary and retaining it for the next request">
<div class="llm-cache-scroll">
<div class="llm-cache-lifecycle">
<section class="llm-cache-lane">
<div class="llm-cache-lane-title">discard at response boundary</div>
<div class="llm-cache-stage llm-cache-stage--live">
<div class="llm-cache-stage-label">response N finishes · active HBM</div>
<div class="llm-mini-kv-strip">
<div class="llm-kv-pair"><span>K</span><span>V</span></div>
<div class="llm-kv-pair"><span>K</span><span>V</span></div>
<div class="llm-kv-pair"><span>K</span><span>V</span></div>
<div class="llm-kv-pair llm-kv-pair--cache-write"><span>K</span><span>V</span></div>
</div>
</div>
<div class="llm-cache-action">response returned ↓</div>
<div class="llm-cache-stage llm-cache-stage--missing">
<div class="llm-cache-stage-label">generated K/V discarded</div>
<div>× × × ×</div>
</div>
<div class="llm-cache-action">request N+1 ↓</div>
<div class="llm-cache-stage">
<div class="llm-cache-stage-label">prefill generated prefix again</div>
<div>pay cache write / uncached input</div>
</div>
</section>
<section class="llm-cache-lane">
<div class="llm-cache-lane-title">retain for the continuation</div>
<div class="llm-cache-stage llm-cache-stage--live">
<div class="llm-cache-stage-label">response N finishes · active HBM</div>
<div class="llm-mini-kv-strip">
<div class="llm-kv-pair"><span>K</span><span>V</span></div>
<div class="llm-kv-pair"><span>K</span><span>V</span></div>
<div class="llm-kv-pair"><span>K</span><span>V</span></div>
<div class="llm-kv-pair llm-kv-pair--cache-write"><span>K</span><span>V</span></div>
</div>
</div>
<div class="llm-cache-action">retain / evict ↓</div>
<div class="llm-cache-stage llm-cache-stage--retained">
<div class="llm-cache-stage-label">prefix cache · same K/V blocks</div>
<div class="llm-mini-kv-strip">
<div class="llm-kv-pair llm-kv-pair--cache-write"><span>K</span><span>V</span></div>
<div class="llm-kv-pair llm-kv-pair--cache-write"><span>K</span><span>V</span></div>
<div class="llm-kv-pair llm-kv-pair--cache-write"><span>K</span><span>V</span></div>
<div class="llm-kv-pair llm-kv-pair--cache-write"><span>K</span><span>V</span></div>
</div>
</div>
<div class="llm-cache-action">matching request N+1 ↑</div>
<div class="llm-cache-stage llm-cache-stage--live">
<div class="llm-cache-stage-label">restore prefix; prefill only new suffix</div>
<div>pay cache read</div>
</div>
</section>
</div>
</div>
<figcaption>prompt-prefix caching is a retention policy around the K/V state inference already produced</figcaption>
</figure>

this comparison is the strongest bridge from the context-window diagrams to the proposed API. the data blocks do not change; only what happens at the response boundary changes.

## retention — variant B: possible memory tiers

<figure class="llm-cache-visual" aria-label="possible memory hierarchy for active and retained key value cache blocks">
<div class="llm-cache-scroll">
<div class="llm-memory-hierarchy">
<section class="llm-memory-tier llm-memory-tier--hbm">
<div class="llm-memory-tier-name">device GPU HBM</div>
<div>active decode batch · read K/V every generated token</div>
<div class="llm-memory-tier-tradeoff">fastest / scarce</div>
</section>
<div class="llm-memory-arrow">offload ↓ &nbsp;&nbsp; ↑ load</div>
<section class="llm-memory-tier llm-memory-tier--host">
<div class="llm-memory-tier-name">host CPU DRAM</div>
<div>node-local prefix cache · useful while tools execute</div>
<div class="llm-memory-tier-tradeoff">medium / expensive</div>
</section>
<div class="llm-memory-arrow">store ↓ &nbsp;&nbsp; ↑ prefetch</div>
<section class="llm-memory-tier llm-memory-tier--remote">
<div class="llm-memory-tier-name">external storage</div>
<div>optional shared or persistent retention across workers</div>
<div class="llm-memory-tier-tradeoff">slow / cheap</div>
</section>
</div>
</div>
<figcaption>memory hierarchy used used for storing kv cache depends on LRU</figcaption>
</figure>

<div class="llm-cache-design-note">
implementation caveat: prefix caches do not universally move from HBM to host DRAM. a hot entry may remain in HBM; another system may offload to host memory or an external KV store. the portable idea is retention and reuse, not one mandatory memory hierarchy.
</div>

## current recommendation

use the token ledger and response-boundary comparison in the main article. together they make the argument in two moves:

1. decode already creates K/V for generated output.
2. the provider can retain that state across the response boundary instead of making the next request write it again.

keep the single-step decode and memory-tier diagrams as optional technical depth. they answer the two predictable objections — the decode off-by-one and the physical cost of retaining large caches — without slowing down the main narrative.

## technical anchors

- the [JAX scaling book inference chapter](https://jax-ml.github.io/scaling-book/inference/) describes prefill as creating a KV cache and generation as appending one token's K/V state at each step. it also discusses retaining cache entries in unused HBM or host DRAM.
- [vLLM automatic prefix caching](https://docs.vllm.ai/en/stable/design/prefix_caching/) defines prefix caching directly as reusing KV-cache blocks from processed requests.
- the [SGLang RadixAttention paper](https://arxiv.org/abs/2312.07104) is the strongest precedent for retaining K/V from both prompts and generation results across requests.
