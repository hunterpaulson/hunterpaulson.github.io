---
title: LLM API providers are charging you _twice_ for output tokens
date: 2026-07-04
description: once during generation and then again during cache write for the following request
social-image: /assets/blog/cache-write-output-tokens/social/cache-write-kv-current-pair-with-legend.png
social-image-alt: KV cache diagram showing current APIs retaining input token KVs while generated output token KVs are not retained across requests.
toc: true
toc-title: Contents
toc-depth: 1
---

# LLM API providers are charging you _twice_ for output tokens

Under agentic inference patterns current APIs charge you twice for output tokens. Once when they are generated, at output price, and again when they are written to the prompt prefix cache, at cache write price, on the subsequent API call.

It doesn't have to be this way. Open source inference engines, [SGLang](https://github.com/sgl-project/sglang) and [vLLM](https://github.com/vllm-project/vllm), retain the KV cache for _both_ prompts and generations.

LLM API providers' inference engines are almost surely capable of this under the hood as well, however current APIs don't give their users a way to request the retention of KVs for output tokens.

There needs to be a way for API users to signal, or even [pay](#proposed-new-pricing-model), providers to store output tokens as well.

## _all_ APIs only cache the prompt (input), not the output.

LLM APIs allow their users to request that KVs computed for input tokens be retained so that they can be reused on future requests with the same prompt prefix. This is aptly called [prompt](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) [caching](https://developers.openai.com/api/docs/guides/prompt-caching).

This worked fine for chatbots ([see appendix](#prompt-caching-was-built-for-chatbots-not-agents)), but is no longer sufficient for agents. The core of every agent, the [agent loop](https://code.claude.com/docs/en/agent-sdk/agent-loop), always^[except for the final message with no tool calls] reuses the output from the previous result on the following API request. Because the output from the previous request was not cached we must pay to write it to the cache on the next request.

Let's walk through a minimal example of what this looks like from the perspective of someone using Anthropic's [Fable 5](https://platform.claude.com/docs/en/about-claude/models/introducing-claude-fable-5-and-claude-mythos-5) through the API. This looks identical for OpenAI and Gemini APIs just with different pricing.

<figure id="cache-write-context-legend-current" class="llm-context-diagram llm-context-diagram--token-costs" aria-label="cache context diagram legend">
<figcaption>legend</figcaption>
<div class="llm-context-legend">
<span><span class="llm-context-key llm-context-key--cache-write llm-context-key--new"></span>cache write;</span>
<span><span class="llm-context-key llm-context-key--cache-write"></span>written to cache;</span>
<span><span class="llm-context-key llm-context-key--cache-read"></span>cache read;</span>
<span><span class="llm-context-key llm-context-key--new"></span>new this step;</span>
</div>
</figure>

<figure id="cache-write-context-current-request-1" class="llm-context-diagram llm-context-diagram--token-costs" aria-label="standard tool calling context sequence">
<div class="llm-context-scroll llm-context-scroll--nowrap">
<div class="llm-context-grid llm-context-grid--pair">
<section class="llm-context-panel">
<div class="llm-context-panel-title">request 1</div>
<div class="llm-context-stack">
<div class="llm-context-message llm-context-message--system cache-write is-new">
<span class="llm-context-message-label">system message and tool definitions</span>
<span class="llm-context-message-body">You report the weather</span>
<span class="llm-context-message-cost">$12.50 / 1M</span>
</div>
<div class="llm-context-message llm-context-message--user cache-write is-new">
<span class="llm-context-message-label">user message</span>
<span class="llm-context-message-body">what is the weather in Tokyo?</span>
<span class="llm-context-message-cost">$12.50 / 1M</span>
</div>
</div>
</section>
<section class="llm-context-panel">
<div class="llm-context-panel-title">result 1</div>
<div class="llm-context-stack">
<div class="llm-context-message llm-context-message--system cache-write">
<span class="llm-context-message-label">system message and tool definitions</span>
<span class="llm-context-message-body">You report the weather</span>
<span class="llm-context-message-cost">$12.50 / 1M</span>
</div>
<div class="llm-context-message llm-context-message--user cache-write">
<span class="llm-context-message-label">user message</span>
<span class="llm-context-message-body">what is the weather in Tokyo?</span>
<span class="llm-context-message-cost">$12.50 / 1M</span>
</div>
<div class="llm-context-message llm-context-message--assistant is-new">
<span class="llm-context-message-label">assistant message</span>
<span class="llm-context-message-body">I'll use my get_weather tool to get the weather in Tokyo</span>
<span class="llm-context-message-cost">$50.00 / 1M</span>
</div>
<div class="llm-context-message llm-context-message--tool-call is-new">
<span class="llm-context-message-label">tool call(s)</span>
<span class="llm-context-message-body">\<tool name=get_weather></span>
<span class="llm-context-message-body">\<param name=city>Tokyo\</param></span>
<span class="llm-context-message-body">\</tool></span>
<span class="llm-context-message-cost">$50.00 / 1M</span>
</div>
</div>
</section>
</div>
</div>
<figcaption>initial request _only retains input tokens_ in the prompt cache even though all messages will be in prefix of next request</figcaption>
</figure>

<figure id="cache-write-context-current-request-2" class="llm-context-diagram llm-context-diagram--token-costs" aria-label="second tool calling request and result">
<div class="llm-context-scroll llm-context-scroll--nowrap">
<div class="llm-context-grid llm-context-grid--pair">
<section class="llm-context-panel">
<div class="llm-context-panel-title">request 2</div>
<div class="llm-context-stack">
<div class="llm-context-message llm-context-message--system cache-read">
<span class="llm-context-message-label">system message and tool definitions</span>
<span class="llm-context-message-body">You report the weather</span>
<span class="llm-context-message-cost">$1.00 / 1M</span>
</div>
<div class="llm-context-message llm-context-message--user cache-read">
<span class="llm-context-message-label">user message</span>
<span class="llm-context-message-body">what is the weather in Tokyo?</span>
<span class="llm-context-message-cost">$1.00 / 1M</span>
</div>
<div class="llm-context-message llm-context-message--assistant cache-write is-new is-danger">
<span class="llm-context-message-label">assistant message</span>
<span class="llm-context-message-body">I'll use my get_weather tool to get the weather in Tokyo</span>
<span class="llm-context-message-cost">$12.50 / 1M</span>
</div>
<div class="llm-context-message llm-context-message--tool-call cache-write is-new is-danger">
<span class="llm-context-message-label">tool call(s)</span>
<span class="llm-context-message-body">\<tool name=get_weather></span>
<span class="llm-context-message-body">\<param name=city>Tokyo\</param></span>
<span class="llm-context-message-body">\</tool></span>
<span class="llm-context-message-cost">$12.50 / 1M</span>
</div>
<div class="llm-context-message llm-context-message--tool-result cache-write is-new">
<span class="llm-context-message-label">tool result(s)</span>
<span class="llm-context-message-body">Cloudy</span>
<span class="llm-context-message-cost">$12.50 / 1M</span>
</div>
</div>
</section>
<section class="llm-context-panel">
<div class="llm-context-panel-title">result 2</div>
<div class="llm-context-stack">
<div class="llm-context-message llm-context-message--system cache-read">
<span class="llm-context-message-label">system message and tool definitions</span>
<span class="llm-context-message-body">You report the weather</span>
<span class="llm-context-message-cost">$1.00 / 1M</span>
</div>
<div class="llm-context-message llm-context-message--user cache-read">
<span class="llm-context-message-label">user message</span>
<span class="llm-context-message-body">what is the weather in Tokyo?</span>
<span class="llm-context-message-cost">$1.00 / 1M</span>
</div>
<div class="llm-context-message llm-context-message--assistant cache-write">
<span class="llm-context-message-label">assistant message</span>
<span class="llm-context-message-body">I'll use my get_weather tool to get the weather in Tokyo</span>
<span class="llm-context-message-cost">$12.50 / 1M</span>
</div>
<div class="llm-context-message llm-context-message--tool-call cache-write">
<span class="llm-context-message-label">tool call(s)</span>
<span class="llm-context-message-body">\<tool name=get_weather></span>
<span class="llm-context-message-body">\<param name=city>Tokyo\</param></span>
<span class="llm-context-message-body">\</tool></span>
<span class="llm-context-message-cost">$12.50 / 1M</span>
</div>
<div class="llm-context-message llm-context-message--tool-result cache-write">
<span class="llm-context-message-label">tool result(s)</span>
<span class="llm-context-message-body">Cloudy</span>
<span class="llm-context-message-cost">$12.50 / 1M</span>
</div>
<div class="llm-context-message llm-context-message--assistant is-new">
<span class="llm-context-message-label">assistant message</span>
<span class="llm-context-message-body">The weather in Tokyo is **Cloudy**</span>
<span class="llm-context-message-cost">$50.00 / 1M</span>
</div>
</div>
</section>
</div>
</div>
<figcaption>since the assistant message and tool call weren't cached after output you have to pay _cache write_ input price for tokens you **already paid full output price** for</figcaption>
</figure>

Notice that you pay for assistant tokens with tool calls twice.

For every token generated before the last API request in the agent loop you pay output tokens at least 2 times. First you pay for the tokens as they are generated (result 1). Then on the very next request, after you execute the tools and append the tool results to the context, you pay to add the tokens to the 'prompt prefix cache' (request 2). Then you pay to read them from cache on every following request before compaction.

<!-- ## but I don't pay API prices? this still burns through your limits 20% faster. -->
<!-- Say you prompt `claude-fable-5` in Claude Code to see why it is burning through your limit so fast. -->

## how much are we actually paying for output tokens?

> ~**16-25%** more than advertised

Naively, if we are paying output price upon generation and then cache write input price on the next request then we can just add up their costs to get an estimate of how much we are really paying for 'agentic output tokens'^[output tokens that contain tool calls that must be executed and returned on the next request].

```{filename="Claude Fable 5"}
output + cache WRITE input = cost of 'agentic output tokens'
$50.00 + $12.50            = $62.50 / 1M tokens

$62.50 / $50.00 = 1.25 => 25% more than advertised output price
```

```{filename="GPT 5.6 Sol"}
output + cache WRITE input = cost of 'agentic output tokens'
$30.00 + $5.00             = $35.00 / 1M tokens

$35.00 / $30.00 = 1.1667 => 16.67% more than advertised output price
```

note: we have to pay for every token in every request, so 'agentic output tokens' will always have some cost for each request. However, as we will see, that cost should be at **cache read** pricing, not _cache write_ which is [10](https://developers.openai.com/api/docs/pricing)-[12.5](https://platform.claude.com/docs/en/build-with-claude/prompt-caching#pricing)x more expensive.

# it doesn't have to be this way

From the perspective of the prompt prefix cache there is no difference between input and output tokens, it is all just tokens.

Just like they retain the KV cache blocks for input tokens, providers can **retain the KV cache blocks created during generation** so we no longer have to pay for cache write on the next call.

Let's take a look at what goes on under the hood with the prompt prefix cache for our two requests in the example above.

<figure id="cache-write-kv-legend" class="llm-cache-visual" aria-label="legend for token and KV cache diagrams">
<figcaption>legend</figcaption>
<div class="llm-cache-legend">
<span class="llm-cache-legend-item"><span class="llm-cache-swatch llm-cache-swatch--input"></span>input token</span>
<span class="llm-cache-legend-item"><span class="llm-cache-swatch llm-cache-swatch--output"></span>output token</span>
<span class="llm-cache-legend-item"><span class="llm-cache-swatch llm-cache-swatch--write"></span>cache write retained</span>
<span class="llm-cache-legend-item"><span class="llm-cache-swatch llm-cache-swatch--read"></span>cache read</span>
<span class="llm-cache-legend-item"><span class="llm-cache-swatch llm-cache-swatch--not-retained"></span>not retained</span>
</div>
</figure>

### request 1:

<figure id="cache-write-kv-current-request-1" class="llm-cache-visual">
<div class="llm-cache-scroll">
<div class="llm-token-sequence">
<section class="llm-token-group">
<div class="llm-token-group-label">prefill</div>
<div class="llm-token-columns">
<div class="llm-token-column">
<div class="llm-token-cell llm-token-cell--input">system</div>
<div class="llm-kv-pair llm-kv-pair--cache-write"><span>K</span><span>V</span></div>
</div>
<div class="llm-token-column">
<div class="llm-token-cell llm-token-cell--input">user</div>
<div class="llm-kv-pair llm-kv-pair--cache-write"><span>K</span><span>V</span></div>
</div>
</div>
</section>
<section class="llm-token-group">
<div class="llm-token-group-label">decode</div>
<div class="llm-token-columns">
<div class="llm-token-column">
<div class="llm-token-cell llm-token-cell--output">assistant</div>
<div class="llm-kv-pair llm-kv-pair--not-retained"><span>K</span><span>V</span></div>
</div>
<div class="llm-token-column">
<div class="llm-token-cell llm-token-cell--output">tool call</div>
<div class="llm-kv-pair llm-kv-pair--not-retained"><span>K</span><span>V</span></div>
</div>
</div>
</section>
</div>
</div>
<figcaption>during prefill and decode KVs are generated for input and output tokens respectively. However only KVs for input tokens are retained in the prompt prefix cache between requests</figcaption>
</figure>

### request 2:

<figure id="cache-write-kv-current-request-2" class="llm-cache-visual">
<div class="llm-cache-scroll">
<div class="llm-token-sequence">
<section class="llm-token-group">
<div class="llm-token-group-label">cache lookup/restore</div>
<div class="llm-token-columns">
<div class="llm-token-column">
<div class="llm-token-cell llm-token-cell--input">system</div>
<div class="llm-kv-pair llm-kv-pair--cache-read"><span>K</span><span>V</span></div>
</div>
<div class="llm-token-column">
<div class="llm-token-cell llm-token-cell--input">user</div>
<div class="llm-kv-pair llm-kv-pair--cache-read"><span>K</span><span>V</span></div>
</div>
</div>
</section>
<section class="llm-token-group">
<div class="llm-token-group-label">prefill</div>
<div class="llm-token-columns">
<div class="llm-token-column">
<div class="llm-token-cell llm-token-cell--input">assistant</div>
<div class="llm-kv-pair llm-kv-pair--cache-write"><span>K</span><span>V</span></div>
</div>
<div class="llm-token-column">
<div class="llm-token-cell llm-token-cell--input">tool call</div>
<div class="llm-kv-pair llm-kv-pair--cache-write"><span>K</span><span>V</span></div>
</div>
<div class="llm-token-column">
<div class="llm-token-cell llm-token-cell--input">result</div>
<div class="llm-kv-pair llm-kv-pair--cache-write"><span>K</span><span>V</span></div>
</div>
</div>
</section>
<section class="llm-token-group">
<div class="llm-token-group-label">decode</div>
<div class="llm-token-columns">
<div class="llm-token-column">
<div class="llm-token-cell llm-token-cell--output">assistant</div>
<div class="llm-kv-pair llm-kv-pair--not-retained"><span>K</span><span>V</span></div>
</div>
</div>
</section>
</div>
</div>
<figcaption>assistant and tool call KVs that weren't retained from the previous request are now _recomputed_ during prefill</figcaption>
</figure>

During inference, Key and Value vectors (KVs) are generated for every token. KVs for input tokens are generated all at once during prefill. And the K and V for each output token is generated one at a time during autoregressive decode[^prefill-assistant-tokens].

[^prefill-assistant-tokens]: we are abstracting some small details a little bit by looking at this on the level of messages. however LLMs work on tokens so the line between prefill and decode actually cuts across assistant messages

    ```
                       prefill | decode
    ...</tool_result><assistant>The tool returned ... </assistant>
    ```

    notice how the chat template tokens for the start of the assistant message (shown here as just `<assistant>`, but can look like `<|im_start|>ASSISTANT<|im_sep|>` where `im` stands for imaginary monologue) and the _first_ token within the assistant message are generated during prefill.




After decode is complete (because LLM completed a tool call) blocks^[the prompt prefix cache is not 1 block per message. instead it is split into fixed size blocks (e.g 16 tokens) that often do not split cleanly on message boundaries as shown in my diagrams. I show the KV cache blocks on the message level here for simplicity. since theoretically the blocks _could_ all land on the message boundaries if each message had length, in tokens, of an exact multiple of the block size.] of KVs are _retained_ in cache so they can be reused, instead of recomputed, during the subsequent request.

However only KV blocks for input tokens are _retained_, meaning that output tokens from request 1 must be `recomputed` during prefill stage of request 2.

If this sounds redundant that's because it is. There is nothing preventing them from retaining the KV blocks for the output tokens too. In fact this is exactly what the open source inference engines [SGLang](https://github.com/sgl-project/sglang)^[SGLang’s [RadixAttention](https://www.lmsys.org/blog/2024-01-17-sglang/) retains the KV cache for **both prompts and generation results** in a radix tree, and reuses them when a later prompt shares the prefix. Their tree diagram shows the assistant 'answer' becoming reusable cache for the next turn.] and [vLLM](https://github.com/vllm-project/vllm)^[vLLM’s [automatic prefix caching](https://docs.vllm.ai/en/stable/design/prefix_caching/) similarly caches KV blocks of entire requests and reuses them when a new request has the same prefix.] do.

# how it should look

<!-- > Never refill tokens you just `decoded`. -->
> Never `prefill` tokens you just `decoded`

Instead of discarding the KVs for output tokens providers can just retain their blocks with the rest of the prompt prefix cache at the end of request 1.

Then on the next request (request 2) all KV blocks from request 1 will be in the prompt prefix cache, saving the inference engine from recomputing anything during prefill.

<figure id="cache-write-kv-legend" class="llm-cache-visual" aria-label="legend for token and KV cache diagrams">
<figcaption>legend</figcaption>
<div class="llm-cache-legend">
<span class="llm-cache-legend-item"><span class="llm-cache-swatch llm-cache-swatch--input"></span>input token</span>
<span class="llm-cache-legend-item"><span class="llm-cache-swatch llm-cache-swatch--output"></span>output token</span>
<span class="llm-cache-legend-item"><span class="llm-cache-swatch llm-cache-swatch--write"></span>cache write retained</span>
<span class="llm-cache-legend-item"><span class="llm-cache-swatch llm-cache-swatch--read"></span>cache read</span>
</div>
</figure>

### request 1:

<figure id="cache-write-kv-retained-request-1" class="llm-cache-visual">
<div class="llm-cache-scroll">
<div class="llm-token-sequence">
<section class="llm-token-group">
<div class="llm-token-group-label">prefill</div>
<div class="llm-token-columns">
<div class="llm-token-column">
<div class="llm-token-cell llm-token-cell--input">system</div>
<div class="llm-kv-pair llm-kv-pair--cache-write"><span>K</span><span>V</span></div>
</div>
<div class="llm-token-column">
<div class="llm-token-cell llm-token-cell--input">user</div>
<div class="llm-kv-pair llm-kv-pair--cache-write"><span>K</span><span>V</span></div>
</div>
</div>
</section>
<section class="llm-token-group">
<div class="llm-token-group-label">decode</div>
<div class="llm-token-columns">
<div class="llm-token-column">
<div class="llm-token-cell llm-token-cell--output">assistant</div>
<div class="llm-kv-pair llm-kv-pair--cache-write"><span>K</span><span>V</span></div>
</div>
<div class="llm-token-column">
<div class="llm-token-cell llm-token-cell--output">tool call</div>
<div class="llm-kv-pair llm-kv-pair--cache-write"><span>K</span><span>V</span></div>
</div>
</div>
</section>
</div>
</div>
<figcaption>KVs generated during decode are _retained_ with the rest of the prompt prefix cache so they can be reused in the next request</figcaption>
</figure>

### request 2:

<figure id="cache-write-kv-retained-request-2" class="llm-cache-visual">
<div class="llm-cache-scroll">
<div class="llm-token-sequence">
<section class="llm-token-group">
<div class="llm-token-group-label">cache lookup/restore</div>
<div class="llm-token-columns">
<div class="llm-token-column">
<div class="llm-token-cell llm-token-cell--input">system</div>
<div class="llm-kv-pair llm-kv-pair--cache-read"><span>K</span><span>V</span></div>
</div>
<div class="llm-token-column">
<div class="llm-token-cell llm-token-cell--input">user</div>
<div class="llm-kv-pair llm-kv-pair--cache-read"><span>K</span><span>V</span></div>
</div>
<div class="llm-token-column">
<div class="llm-token-cell llm-token-cell--input">assistant</div>
<div class="llm-kv-pair llm-kv-pair--cache-read"><span>K</span><span>V</span></div>
</div>
<div class="llm-token-column">
<div class="llm-token-cell llm-token-cell--input">tool call</div>
<div class="llm-kv-pair llm-kv-pair--cache-read"><span>K</span><span>V</span></div>
</div>
</div>
</section>
<section class="llm-token-group">
<div class="llm-token-group-label">prefill</div>
<div class="llm-token-columns">
<div class="llm-token-column">
<div class="llm-token-cell llm-token-cell--input">result</div>
<div class="llm-kv-pair llm-kv-pair--cache-write"><span>K</span><span>V</span></div>
</div>
</div>
</section>
<section class="llm-token-group">
<div class="llm-token-group-label">decode</div>
<div class="llm-token-columns">
<div class="llm-token-column">
<div class="llm-token-cell llm-token-cell--output">assistant</div>
<div class="llm-kv-pair llm-kv-pair--cache-write"><span>K</span><span>V</span></div>
</div>
</div>
</section>
</div>
</div>
<figcaption>now only the KVs for the _tool result_ are computed during prefill since KVs for output tokens from the previous request were retained</figcaption>
</figure>

Notice how there is no longer any overlap between prefill and decode across requests.


## how this looks from the API user perspective

If API providers retain output tokens in the prompt prefix cache then users only have to pay **cache read** price for every subsequent request that contains them.

<figure id="cache-write-context-legend-retained" class="llm-context-diagram llm-context-diagram--token-costs" aria-label="cache context diagram legend">
<figcaption>legend</figcaption>
<div class="llm-context-legend">
<span><span class="llm-context-key llm-context-key--cache-write llm-context-key--new"></span>cache write & new this step;</span>
<span><span class="llm-context-key llm-context-key--cache-write"></span>written to cache;</span>
<span><span class="llm-context-key llm-context-key--cache-read"></span>cache read;</span>
</div>
</figure>

<figure id="cache-write-context-retained-request-1" class="llm-context-diagram llm-context-diagram--token-costs" aria-label="standard tool calling context sequence">
<div class="llm-context-scroll llm-context-scroll--nowrap">
<div class="llm-context-grid llm-context-grid--pair">
<section class="llm-context-panel">
<div class="llm-context-panel-title">request 1</div>
<div class="llm-context-stack">
<div class="llm-context-message llm-context-message--system cache-write is-new">
<span class="llm-context-message-label">system message and tool definitions</span>
<span class="llm-context-message-body">You report the weather</span>
<span class="llm-context-message-cost">$12.50 / 1M</span>
</div>
<div class="llm-context-message llm-context-message--user cache-write is-new">
<span class="llm-context-message-label">user message</span>
<span class="llm-context-message-body">what is the weather in Tokyo?</span>
<span class="llm-context-message-cost">$12.50 / 1M</span>
</div>
</div>
</section>
<section class="llm-context-panel">
<div class="llm-context-panel-title">result 1</div>
<div class="llm-context-stack">
<div class="llm-context-message llm-context-message--system cache-write">
<span class="llm-context-message-label">system message and tool definitions</span>
<span class="llm-context-message-body">You report the weather</span>
<span class="llm-context-message-cost">$12.50 / 1M</span>
</div>
<div class="llm-context-message llm-context-message--user cache-write">
<span class="llm-context-message-label">user message</span>
<span class="llm-context-message-body">what is the weather in Tokyo?</span>
<span class="llm-context-message-cost">$12.50 / 1M</span>
</div>
<div class="llm-context-message llm-context-message--assistant cache-write is-new">
<span class="llm-context-message-label">assistant message</span>
<span class="llm-context-message-body">I'll use my get_weather tool to get the weather in Tokyo</span>
<span class="llm-context-message-cost">$50.00 / 1M</span>
</div>
<div class="llm-context-message llm-context-message--tool-call cache-write is-new">
<span class="llm-context-message-label">tool call(s)</span>
<span class="llm-context-message-body">\<tool name=get_weather></span>
<span class="llm-context-message-body">\<param name=city>Tokyo\</param></span>
<span class="llm-context-message-body">\</tool></span>
<span class="llm-context-message-cost">$50.00 / 1M</span>
</div>
</div>
</section>
</div>
</div>
<figcaption>Now assistant message and tool call are retained in prompt prefix cache</figcaption>
</figure>

<figure id="cache-write-context-retained-request-2" class="llm-context-diagram llm-context-diagram--token-costs" aria-label="second tool calling request and result">
<div class="llm-context-scroll llm-context-scroll--nowrap">
<div class="llm-context-grid llm-context-grid--pair">
<section class="llm-context-panel">
<div class="llm-context-panel-title">request 2</div>
<div class="llm-context-stack">
<div class="llm-context-message llm-context-message--system cache-read">
<span class="llm-context-message-label">system message and tool definitions</span>
<span class="llm-context-message-body">You report the weather</span>
<span class="llm-context-message-cost">$1.00 / 1M</span>
</div>
<div class="llm-context-message llm-context-message--user cache-read">
<span class="llm-context-message-label">user message</span>
<span class="llm-context-message-body">what is the weather in Tokyo?</span>
<span class="llm-context-message-cost">$1.00 / 1M</span>
</div>
<div class="llm-context-message llm-context-message--assistant cache-read is-benefit">
<span class="llm-context-message-label">assistant message</span>
<span class="llm-context-message-body">I'll use my get_weather tool to get the weather in Tokyo</span>
<span class="llm-context-message-cost">$1.00 / 1M</span>
</div>
<div class="llm-context-message llm-context-message--tool-call cache-read is-benefit">
<span class="llm-context-message-label">tool call(s)</span>
<span class="llm-context-message-body">\<tool name=get_weather></span>
<span class="llm-context-message-body">\<param name=city>Tokyo\</param></span>
<span class="llm-context-message-body">\</tool></span>
<span class="llm-context-message-cost">$1.00 / 1M</span>
</div>
<div class="llm-context-message llm-context-message--tool-result cache-write is-new">
<span class="llm-context-message-label">tool result(s)</span>
<span class="llm-context-message-body">Cloudy</span>
<span class="llm-context-message-cost">$12.50 / 1M</span>
</div>
</div>
</section>
<section class="llm-context-panel">
<div class="llm-context-panel-title">result 2</div>
<div class="llm-context-stack">
<div class="llm-context-message llm-context-message--system cache-read">
<span class="llm-context-message-label">system message and tool definitions</span>
<span class="llm-context-message-body">You report the weather</span>
<span class="llm-context-message-cost">$1.00 / 1M</span>
</div>
<div class="llm-context-message llm-context-message--user cache-read">
<span class="llm-context-message-label">user message</span>
<span class="llm-context-message-body">what is the weather in Tokyo?</span>
<span class="llm-context-message-cost">$1.00 / 1M</span>
</div>
<div class="llm-context-message llm-context-message--assistant cache-read">
<span class="llm-context-message-label">assistant message</span>
<span class="llm-context-message-body">I'll use my get_weather tool to get the weather in Tokyo</span>
<span class="llm-context-message-cost">$1.00 / 1M</span>
</div>
<div class="llm-context-message llm-context-message--tool-call cache-read">
<span class="llm-context-message-label">tool call(s)</span>
<span class="llm-context-message-body">\<tool name=get_weather></span>
<span class="llm-context-message-body">\<param name=city>Tokyo\</param></span>
<span class="llm-context-message-body">\</tool></span>
<span class="llm-context-message-cost">$1.00 / 1M</span>
</div>
<div class="llm-context-message llm-context-message--tool-result cache-write">
<span class="llm-context-message-label">tool result(s)</span>
<span class="llm-context-message-body">Cloudy</span>
<span class="llm-context-message-cost">$12.50 / 1M</span>
</div>
<div class="llm-context-message llm-context-message--assistant cache-write is-new">
<span class="llm-context-message-label">assistant message</span>
<span class="llm-context-message-body">The weather in Tokyo is **Cloudy**</span>
<span class="llm-context-message-cost">$50.00 / 1M</span>
</div>
</div>
</section>
</div>
</div>
<figcaption>On the next request input assistant message and tool call are charged at cache **read** pricing. Only the tool result needs to pay cache input price</figcaption>
</figure>

Notice how now API users only pay full price for new input or output tokens the first time they appear. From then on they are always 'cache read input tokens'.

## how much money would this save?

> ~**12.9-18.4%** on output tokens, depending on the provider.

Now that we understand how prompt prefix caching should work let's estimate how much this would save API users^[this is an estimate since the true cost depends on how many more times we reuse these tokens on subsequent requests before compaction. However the incremental cost will be identical since both will be getting cache read price after the second request].

```{filename="Claude Fable 5"}
output + cache WRITE input = CURRENT cost of output tokens
$50.00 + $12.50            = $62.50 / 1M tokens

output + cache READ  input = IDEAL   cost of output tokens
$50.00 + $1.00             = $51.00 / 1M tokens

$62.50 - $51.00 = $11.50 extra per 1M output tokens
$51.00 / $62.50 = 0.816 => 18.4% savings
```


```{filename="GPT 5.6 Sol"}
output + cache WRITE input = CURRENT cost of output tokens
$30.00 + $5.00             = $35.00 / 1M tokens

output + cache READ  input = IDEAL   cost of output tokens
$30.00 + $0.50             = $30.50 / 1M tokens

$35.00 - $30.50 = $4.50 extra per 1M output tokens
$30.50 / $35.00 = 0.871 => 12.9% savings
```

## this improves performance too

<!-- The purpose of the prompt prefix cache isn't just to save money. Its primary purpose is to reduce the amount of precious compute that needs to be done for every request.
Running GPUs costs money so saving a even a few FLOPs^[FLoating point OPerations, the total number of adds and multiplies.] per request can lower response time as well as cost. -->

`Time to first token (TTFT):`

No^[the inference engine may have to recompute the final few tokens that aren't part of a complete cache block] recomputation means less computation done during prefill. and prefill is [compute bound](https://jax-ml.github.io/scaling-book/roofline/) so less computation means users get their first token faster.


<!-- From [OpenAI's prompt caching docs](https://developers.openai.com/api/docs/guides/prompt-caching#how-it-works):

> Cache Hit: If a matching prefix is found, the system uses the cached result. This significantly decreases latency and reduces costs. -->

<!-- NOTE: it takes time to fetch KVs from their location in the memory hierarchy so depending on where they are stored and the trend of the memory wall it may eventually be faster to recompute.  -->

`Cache Hit Rate:`

the [SGLang Radix Attention Paper](https://arxiv.org/pdf/2312.07104) defines the "cache hit rate as number of `cached prompt tokens / number of prompt tokens`"

Since output tokens are part of the subsequent prompt it is trivial to see that having them cached will improve the cache hit rate, up to its theoretical limit.

however it is impossible to reach 100% under this definition since entirely new tokens are appended to the context each model request, e.g. tool results or new user prompts. instead everyone should measure `cache read input tokens` / `total tokens at the end of previous request` to have higher signal into true cache reuse and more easily see when a request invalidates the prompt prefix cache.

# how can API providers support this?

APIs need to have a way for users to request that the output token blocks are retained in the prompt prefix cache.

For providers with _implicit_ caching like [OpenAI](https://developers.openai.com/api/docs/guides/prompt-caching#requirements) and [Gemini](https://ai.google.dev/gemini-api/docs/caching#implicit-caching) they can make this change entirely on the backend since they already handle caching for their users.

For providers with _explicit_ caching like [Anthropic](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) this requires an update to the API.

## proposed Anthropic API implementation

if people are already using [automatic caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching#automatic-caching), Anthropic could extend their top level `cache_control` object with an optional key.

```python
# call
response = client.messages.create(
    model="claude-fable-5",
    max_tokens=1024,
    ####################################
    cache_control={ # existing automatic caching param
        "cache_output": True, # new, indicates to cache output
        "type": "ephemeral", # or e.g. "intelligent" to only retain cache if stop_reason == "tool_use"
        "ttl": "5m"
    },
    ####################################
    system="You are a helpful assistant.",
    messages=[
        {
            "role": "user",
            "content": "do something agentic (call tools in a loop for me) please",
        }
    ],
)

# response
{
  "content": ...
  "usage": {
    "input_tokens": 2048,
    "cache_read_input_tokens": 1800,
    "cache_creation_input_tokens": 248,
    "output_tokens": 503,
    "cache_creation_output_tokens" 503, # new
  }
}
```

## proposed new pricing model

Again, providers where caching is already priced in[^cache-write-input-pricing] don't need to change anything.

[^cache-write-input-pricing]: OpenAI and Gemini don't charge you extra for 'cache write' tokens because all input tokens are treated like cache write tokens. I wish they gave us actual cache write numbers in the `usage` obj of the response.

    related: imo when reading Anthropic's pricing you should only read the cache write price for input tokens. because that is what you will actually be paying. their input pricing number can be misleading since ~all tokens during an agent loop are either cache reads or cache writes. you are almost _never_ paying the headline input token price.


however Anthropic charges extra for storing the KV cache between requests. they charge 25% of the price of input tokens to store these in cache for up to 5 minutes. essentially this is a flat fee paid per token when that token is retained in the prompt prefix cache between API requests. currently it is only applied to input tokens but since there is no fundamental difference between caching input and output tokens it would make sense to have a single price for caching any type of token.

If they continue with the same pricing model they would likely need to add something akin to a `cache_retention_per_1M_tokens`. let's assume this would be at the same 0.25x input token price it is currently.

so for Fable 5 this would be `$10.00 * 0.25 = $2.50` per 1M tok

```{filename="Claude Fable 5"}
output + cache WRITE fee + cache READ input = LIKELY cost of output tokens
$50.00 + $2.50           + $1.00            = $53.50 / 1M tokens

$62.50 - $53.50 = $9.00 saved per 1M output tokens
$53.50 / $62.50 = 0.856 => 14.4% savings
```

Not quite as good as the 18.4% from [above](#how-much-money-would-this-save) but still a free almost 15% savings.

## why don't APIs already support this?

we don't yet have a real answer so I will do my best to provide a plausible explanation since the simplest explanation is usually the best one.

> APIs were initially [built for Chat applications](#prompt-caching-was-built-for-chatbots-not-agents) a la ChatGPT

there are 3 primary LLM API formats: OpenAI's [Chat Completions](https://developers.openai.com/api/reference/chat-completions/overview), OpenAI's [Responses](https://developers.openai.com/api/reference/responses/overview), and Anthropic's [Messages](https://platform.claude.com/docs/en/api/messages). Other providers may have their own format (e.g. Gemini) but they usually have an API that is compatible with either Chat Completions or Messages.

these APIs were designed in the era of chatbot applications like ChatGPT.
and when you have APIs with a lot of users it becomes almost [impossible to change](https://xkcd.com/1172/) them. lucky for us, both Chat Completions and Responses use implicit caching so those providers should be able to support this without any changes to the api.

a more speculative reason could be due to lack of incentive. this 'feature' would lead to both lower margins^[LLM API margins are reportedly [70-80%](https://www.seangoedecke.com/ai-inference-is-obviously-profitable/) so they can afford it] and increased memory usage during a [shortage](https://en.wikipedia.org/wiki/2025%E2%80%93present_global_memory_supply_shortage).

providers could be in a [prisoner's dilemma](https://en.wikipedia.org/wiki/Prisoner%27s_dilemma) situation where the current equilibrium is optimal. until one lab defects by adding this to their API to capture market share, forcing everyone else to follow. Ultimately leaving everyone with lower margins and less memory.

It is practically guaranteed that their internal inference engines^[see vLLM and SGLang] for RL and internal API use already do this since this is a literal [compute multiplier](https://nonint.com/2023/11/05/compute-multipliers/). There is just not enough of an incentive to update the external API since nobody else's API supports it and this doesn't impact internal LLM usage.

<!-- Anthropic seems to be doing all they can to dampen demand: increased prices^[fable is 2x the cost of opus], staggered releases,   -->

<!-- however, since demand is for intelligence seems to be elastic this efficiency gain may just lead to higher total token usage than before. -->

<!-- While it is possible that providers already do this under the hood but since that would be a PR nightmare I doubt it. -->

# why did I write this?

my goal with writing this is not to point blame at any lab or provider, nobody is at fault here. I wrote this simply because I want faster and cheaper tokens so that I can get more out of my 5hr and weekly limits.

and apparently you can [just tweet and people will fix things](https://x.com/levelsio/status/2039729463403909567).

I also wanted to get some reps in to practice my writing and technical communication.

ty for reading. I hope you learned something about LLM APIs, KV cache retention, and inference.

# appendix

## what about the final assistant message at the end of a turn?

as we discussed earlier, we expect _every_ assistant message with tool calls to have a follow up API request, with tool results, before the cache [expiration](https://platform.claude.com/docs/en/build-with-claude/prompt-caching#ttl-support).

however eventually there are no more tool calls and the agent loop stops. what should we do with those output[^conditional-cache-retention] tokens? should we cache them too?

[^conditional-cache-retention]:Notice that this doesn't just have to apply to the proposed cache write output tokens. we can apply this conditional cache retention to all new tokens in this request.

    this would be huge because it would allow callers to not request a cache write for _any_ new tokens (input and output) if there aren't any tool calls.

if the session gets a follow up request within the [next 5 minutes](https://developers.openai.com/api/docs/guides/prompt-caching#prompt-cache-retention) that reuses those tokens even once then [it is worth it to cache](#when-should-i-write-to-the-cache).

so how do we know if we will get a follow up request?

we don't ... but the application or harness might.

If this session has an active [`/goal`](https://developers.openai.com/codex/use-cases/follow-goals) or [`/loop`](https://code.claude.com/docs/en/scheduled-tasks#run-a-prompt-repeatedly-with-/loop) running then the harness knows it will reuse these tokens immediately.

But if not the application could try to predict^[providers could even use different levels in their inference cluster's memory hierarchy for storing KV cache blocks depending on the expected delay until their inference engine receives the following request] whether or not the user will follow up before the cache expires.

I am sure there will be many more opportunities for similar harness/inference co-design as both continue to evolve.

<!-- ## history of prompt caching APIs -->
## evolution of LLM API usage

I don't believe that prompt caching APIs are purposely built to charge you twice for the current most common usage pattern (append-only agentic inference). The issue is that _common usage patterns have shifted significantly_ since the APIs were first designed.

## prompt caching was built for chatbots, not agents^[it's not x but y]

prompt caching APIs were initially designed for chat applications (e.g ChatGPT) where it allowed users of the API to reuse the cache for the system message across chats for all users.

<figure id="cache-write-chatbot-legend-single-turn" class="llm-context-diagram llm-context-diagram--token-costs" aria-label="cache context diagram legend">
<figcaption>legend</figcaption>
<div class="llm-context-legend">
<span><span class="llm-context-key llm-context-key--cache-write llm-context-key--new"></span>cache write;</span>
<span><span class="llm-context-key llm-context-key--cache-write"></span>written to cache;</span>
<span><span class="llm-context-key llm-context-key--cache-read"></span>cache read;</span>
<span><span class="llm-context-key llm-context-key--new"></span>new this step / not cached;</span>
</div>
</figure>

### Chat 1:

<figure id="cache-write-chatbot-single-turn" class="llm-context-diagram llm-context-diagram--token-costs" aria-label="standard tool calling context sequence">
<div class="llm-context-scroll llm-context-scroll--nowrap">
<div class="llm-context-grid llm-context-grid--pair">
<section class="llm-context-panel">
<div class="llm-context-panel-title">request 1</div>
<div class="llm-context-stack">
<div class="llm-context-message llm-context-message--system cache-write is-new">
<span class="llm-context-message-label">system message and tool definitions</span>
<span class="llm-context-message-body">You are a helpful assistant</span>
<span class="llm-context-message-cost">$12.50 / 1M</span>
</div>
<div class="llm-context-message llm-context-message--user is-new">
<span class="llm-context-message-label">user message</span>
<span class="llm-context-message-body">How many r's are in "strawberry"?</span>
<span class="llm-context-message-cost">$10.00 / 1M</span>
</div>
</div>
</section>
<section class="llm-context-panel">
<div class="llm-context-panel-title">result 1</div>
<div class="llm-context-stack">
<div class="llm-context-message llm-context-message--system cache-write">
<span class="llm-context-message-label">system message and tool definitions</span>
<span class="llm-context-message-body">You are a helpful assistant</span>
<span class="llm-context-message-cost">$12.50 / 1M</span>
</div>
<div class="llm-context-message llm-context-message--user">
<span class="llm-context-message-label">user message</span>
<span class="llm-context-message-body">How many r's are in "strawberry"?</span>
<span class="llm-context-message-cost">$12.50 / 1M</span>
</div>
<div class="llm-context-message llm-context-message--assistant is-new">
<span class="llm-context-message-label">assistant message</span>
<span class="llm-context-message-body">There are 3 r's in "strawberry"</span>
<span class="llm-context-message-cost">$50.00 / 1M</span>
</div>
</div>
</section>
</div>
</div>
<figcaption>neither user or assistant message is retained in the prompt</figcaption>
</figure>

### Chat 2:

could be the same user or a different user

<figure id="cache-write-chatbot-shared-prefix" class="llm-context-diagram llm-context-diagram--token-costs" aria-label="standard tool calling context sequence">
<div class="llm-context-scroll llm-context-scroll--nowrap">
<div class="llm-context-grid llm-context-grid--pair">
<section class="llm-context-panel">
<div class="llm-context-panel-title">request 2</div>
<div class="llm-context-stack">
<div class="llm-context-message llm-context-message--system cache-read">
<span class="llm-context-message-label">system message and tool definitions</span>
<span class="llm-context-message-body">You are a helpful assistant</span>
<span class="llm-context-message-cost">$1.00 / 1M</span>
</div>
<div class="llm-context-message llm-context-message--user is-new">
<span class="llm-context-message-label">user message</span>
<span class="llm-context-message-body">Which is greater, 9.9 or 9.11?</span>
<span class="llm-context-message-cost">$10.00 / 1M</span>
</div>
</div>
</section>
<section class="llm-context-panel">
<div class="llm-context-panel-title">result 2</div>
<div class="llm-context-stack">
<div class="llm-context-message llm-context-message--system cache-read">
<span class="llm-context-message-label">system message and tool definitions</span>
<span class="llm-context-message-body">You are a helpful assistant</span>
<span class="llm-context-message-cost">$1.00 / 1M</span>
</div>
<div class="llm-context-message llm-context-message--user">
<span class="llm-context-message-label">user message</span>
<span class="llm-context-message-body">Which is greater, 9.9 or 9.11?</span>
<span class="llm-context-message-cost">$10.00 / 1M</span>
</div>
<div class="llm-context-message llm-context-message--assistant is-new">
<span class="llm-context-message-label">assistant message</span>
<span class="llm-context-message-body">9.9 is greater than 9.11</span>
<span class="llm-context-message-cost">$50.00 / 1M</span>
</div>
</div>
</section>
</div>
</div>
<figcaption>another chat can reuse the cached prompt prefix (e.g. the shared system message)</figcaption>
</figure>


### multi-turn conversations: what if the user asks a follow up question?

prompt caching works alright for this as well. but tbh we could have seen this issue back then. both SGLang and vLLM did.

<figure id="cache-write-agent-loop-legend" class="llm-context-diagram llm-context-diagram--token-costs" aria-label="cache context diagram legend">
<figcaption>legend</figcaption>
<div class="llm-context-legend">
<span><span class="llm-context-key llm-context-key--cache-write llm-context-key--new"></span>cache write;</span>
<span><span class="llm-context-key llm-context-key--cache-write"></span>written to cache;</span>
<span><span class="llm-context-key llm-context-key--cache-read"></span>cache read;</span>
<span><span class="llm-context-key llm-context-key--new"></span>new this step;</span>
</div>
</figure>

<figure id="cache-write-agent-loop-request-1" class="llm-context-diagram llm-context-diagram--token-costs" aria-label="standard tool calling context sequence">
<div class="llm-context-scroll llm-context-scroll--nowrap">
<div class="llm-context-grid llm-context-grid--pair">
<section class="llm-context-panel">
<div class="llm-context-panel-title">request 1</div>
<div class="llm-context-stack">
<div class="llm-context-message llm-context-message--system cache-write is-new">
<span class="llm-context-message-label">system message and tool definitions</span>
<span class="llm-context-message-body">You are a helpful assistant.</span>
<span class="llm-context-message-cost">$12.50 / 1M</span>
</div>
<div class="llm-context-message llm-context-message--user cache-write is-new">
<span class="llm-context-message-label">user message</span>
<span class="llm-context-message-body">How many r's are in "strawberry"?</span>
<span class="llm-context-message-cost">$12.50 / 1M</span>
</div>
</div>
</section>
<section class="llm-context-panel">
<div class="llm-context-panel-title">result 1</div>
<div class="llm-context-stack">
<div class="llm-context-message llm-context-message--system cache-write">
<span class="llm-context-message-label">system message and tool definitions</span>
<span class="llm-context-message-body">You are a helpful assistant.</span>
<span class="llm-context-message-cost">$12.50 / 1M</span>
</div>
<div class="llm-context-message llm-context-message--user cache-write">
<span class="llm-context-message-label">user message</span>
<span class="llm-context-message-body">How many r's are in "strawberry"?</span>
<span class="llm-context-message-cost">$12.50 / 1M</span>
</div>
<div class="llm-context-message llm-context-message--assistant is-new">
<span class="llm-context-message-label">assistant message</span>
<span class="llm-context-message-body">There are 3 r's in "strawberry"</span>
<span class="llm-context-message-cost">$50.00 / 1M</span>
</div>
</div>
</section>
</div>
</div>
<!-- <figcaption>initial request _only retains input tokens_ in the prompt cache even though all messages will be prefix of next request</figcaption> -->
</figure>

<figure id="cache-write-agent-loop-request-2" class="llm-context-diagram llm-context-diagram--token-costs" aria-label="second tool calling request and result">
<div class="llm-context-scroll llm-context-scroll--nowrap">
<div class="llm-context-grid llm-context-grid--pair">
<section class="llm-context-panel">
<div class="llm-context-panel-title">request 2</div>
<div class="llm-context-stack">
<div class="llm-context-message llm-context-message--system cache-read">
<span class="llm-context-message-label">system message and tool definitions</span>
<span class="llm-context-message-body">You are a helpful assistant.</span>
<span class="llm-context-message-cost">$1.00 / 1M</span>
</div>
<div class="llm-context-message llm-context-message--user cache-read">
<span class="llm-context-message-label">user message</span>
<span class="llm-context-message-body">How many r's are in "strawberry"?</span>
<span class="llm-context-message-cost">$1.00 / 1M</span>
</div>
<div class="llm-context-message llm-context-message--assistant cache-write is-new is-danger">
<span class="llm-context-message-label">assistant message</span>
<span class="llm-context-message-body">There are 3 r's in "strawberry"</span>
<span class="llm-context-message-cost">$12.50 / 1M</span>
</div>
<div class="llm-context-message llm-context-message--user cache-write is-new">
<span class="llm-context-message-label">user message</span>
<span class="llm-context-message-body">Which is greater, 9.9 or 9.11?</span>
<span class="llm-context-message-cost">$12.50 / 1M</span>
</div>
</div>
</section>
<section class="llm-context-panel">
<div class="llm-context-panel-title">result 2</div>
<div class="llm-context-stack">
<div class="llm-context-message llm-context-message--system cache-read">
<span class="llm-context-message-label">system message and tool definitions</span>
<span class="llm-context-message-body">You are a helpful assistant.</span>
<span class="llm-context-message-cost">$1.00 / 1M</span>
</div>
<div class="llm-context-message llm-context-message--user cache-read">
<span class="llm-context-message-label">user message</span>
<span class="llm-context-message-body">How many r's are in "strawberry"?</span>
<span class="llm-context-message-cost">$1.00 / 1M</span>
</div>
<div class="llm-context-message llm-context-message--assistant cache-write">
<span class="llm-context-message-label">assistant message</span>
<span class="llm-context-message-body">There are 3 r's in "strawberry"</span>
<span class="llm-context-message-cost">$12.50 / 1M</span>
</div>
<div class="llm-context-message llm-context-message--user cache-write">
<span class="llm-context-message-label">user message</span>
<span class="llm-context-message-body">Which is greater, 9.9 or 9.11?</span>
<span class="llm-context-message-cost">$12.50 / 1M</span>
</div>
<div class="llm-context-message llm-context-message--assistant is-new">
<span class="llm-context-message-label">assistant message</span>
<span class="llm-context-message-body">9.9 is greater than 9.11</span>
<span class="llm-context-message-cost">$50.00 / 1M</span>
</div>
</div>
</section>
</div>
</div>
<figcaption>since the assistant message wasn't cached after the first result you have to pay _cache write_ input price for tokens you **already paid full output price** for</figcaption>
</figure>

notice that each request after the first writes the assistant message from the previous turn to the cache.

### when should I write to the cache?

> if you use the cache _even once_ it is worth the price

cache_write = 1.25 x input
cache_read = 0.1 x input

so if you write 1000 tokens to the cache you pay for 1250 tokens
then on next API call, with the same prefix, you get a cache hit and read all those 1000 cached tokens at the price of 100 tokens.
so you paid for the equivalent of 1350 input tokens.

however if you don't cache you pay regular price for 1000 tokens
then if you make a request with the same prefix you pay regular price _again_ for 1000 tokens.
so on the _second_ request you already paid more than if you had cached.
not to mention that caching also improves API response time as well.

<!-- TODO: I could draw some graph here with probability of reusing the prefix to see where phase change is -->

my takeaway from this is:

> if you are going to make another LLM API call with the same prompt prefix, in the next 5 minutes, you should write that prefix to cache

in vanilla^[no tools] multi-turn conversation it is unrealistic to predict whether or not the user will ask a follow up question ex ante so builders on the API either always or never pay the cache write cost depending on their apps usage patterns.

notice how with the shift from vanilla multi-turn conversations to agent loops it actually got easier to predict whether or not the cache will be reused: if the assistant calls a tool in its response then the harness knows it will reuse the cache in the very next request. This is why builders now _always_ pay the cache write cost.

## minimal append-only agent loop

```python
messages: list[Message] = [
    SystemMessage(content="You report the weather."),
    UserMessage(content="What is the weather in Tokyo?"),
]

while True:
    assistant_message: AssistantMessage = llm.generate(messages)
    messages.append(assistant_message.content)

    # if there are no tool calls, we are done
    if not assistant_message.tool_calls:
        return assistant_message.content

    # otherwise execute tool calls, append tool results and repeat
    for tool_call in assistant_message.tool_calls:
        tool_result: ToolResultMessage = execute_tool(tool_call)
        messages.append(tool_result.content)
```
