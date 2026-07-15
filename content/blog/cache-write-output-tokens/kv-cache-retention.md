

## from [openai prompt caching page](https://developers.openai.com/api/docs/guides/prompt-caching)

Does Prompt Caching work on Zero Data Retention requests?

In-memory cache retention does not save any data to disk. Extended prompt caching may store key/value tensors in GPU-local storage, and the key-value tensors are derived from customer content. This data is not retained beyond cache expiration — the key-value tensors are retained for 1-2 hours (most usage) and at most 24 hours. Extended prompt caching requests are not blocked if Zero Data Retention is enabled for your project. Other Zero Data Retention still applies, such as excluding customer content from abuse logs and preventing use of store=True. See the Your data guide for more context on Zero Data Retention.

Does Prompt Caching work with Data Residency?

In-memory Prompt Caching does not store data and so does not impact Data Residency.

Extended caching temporarily stores data on GPU machines and will only be kept in-region when using Regional Inference.


> For gpt-5.5, gpt-5.5-pro, and future models, only 24h is supported.
> For older models that support both in_memory and 24h, the default depends on your organization’s data retention policy:

imo this implies that they definitely move the kv cache off the device and also maybe off the host. since 24 hour caching is explicitly not 'in_memory' so it is written to disk. aka external storage off of the `host`. so probably SSD. 
this is also why this counts as 'data retention' and isn't valid for Zero Data Retention (ZDR)


## from [sankalp](https://sankalp.bearblog.dev/how-prompt-caching-works/)

> Semi-related but OpenAI also recently rolled out 24 hour cache retention policy for the GPT-5.1 series and GPT-4.1 model. By default, cached prefixes stay in GPU VRAM for 5-10 minutes of inactivity. The extended 24hr retention offloads KV tensors to GPU-local storage (SSDs attached to GPU nodes) when idle, loading them back into VRAM on cache hit.






## anthropic https://platform.claude.com/docs/en/build-with-claude/prompt-caching#caching-with-thinking-blocks

> Request 2 caches its request content **(not the response)**

Request 1: User: "What's the weather in Paris?"
Response: [thinking_block_1] + [tool_use block 1]

Request 2:
User: ["What's the weather in Paris?"],
Assistant: [thinking_block_1] + [tool_use block 1],
User: [tool_result_1, cache=True]
Response: [thinking_block_2] + [text block 2]
# Request 2 caches its request content (not the response)
# The cache includes: user message, thinking_block_1, tool_use block 1, and tool_result_1

Request 3:
User: ["What's the weather in Paris?"],
Assistant: [thinking_block_1] + [tool_use block 1],
User: [tool_result_1, cache=True],
Assistant: [thinking_block_2] + [text block 2],
User: [Text response, cache=True]
# On earlier Opus/Sonnet and all Haiku models, non-tool-result user block causes prior thinking blocks to be stripped; on Opus 4.5+/Sonnet 4.6+ they are kept














## multi turn

<figure class="llm-context-diagram llm-context-diagram--token-costs" aria-label="later tool calling request and result">
<div class="llm-context-scroll llm-context-scroll--nowrap">
<div class="llm-context-grid llm-context-grid--pair">
<section class="llm-context-panel">
<div class="llm-context-panel-title">request N</div>
<div class="llm-context-stack">
<div class="llm-context-message llm-context-message--system cache-read">
<span class="llm-context-message-label">system message and tool definitions</span>
</div>
<div class="llm-context-message llm-context-message--user cache-read">
<span class="llm-context-message-label">user message</span>
</div>
<div class="llm-context-message llm-context-message--omitted cache-read" aria-label="prior turns omitted">
<span class="llm-context-message-label">...</span>
</div>
<div class="llm-context-message llm-context-message--tool-result cache-read">
<span class="llm-context-message-label">tool result(s)</span>
</div>
<div class="llm-context-message llm-context-message--assistant cache-write">
<span class="llm-context-message-label">assistant message</span>
</div>
<div class="llm-context-message llm-context-message--tool-call cache-write">
<span class="llm-context-message-label">tool call(s)</span>
</div>
<div class="llm-context-message llm-context-message--tool-result cache-write is-new">
<span class="llm-context-message-label">tool result(s)</span>
</div>
</div>
</section>
<section class="llm-context-panel">
<div class="llm-context-panel-title">result N</div>
<div class="llm-context-stack">
<div class="llm-context-message llm-context-message--system cache-read">
<span class="llm-context-message-label">system message and tool definitions</span>
</div>
<div class="llm-context-message llm-context-message--user cache-read">
<span class="llm-context-message-label">user message</span>
</div>
<div class="llm-context-message llm-context-message--omitted cache-read" aria-label="prior turns omitted">
<span class="llm-context-message-label">...</span>
</div>
<div class="llm-context-message llm-context-message--tool-result cache-read">
<span class="llm-context-message-label">tool result(s)</span>
</div>
<div class="llm-context-message llm-context-message--assistant cache-write">
<span class="llm-context-message-label">assistant message</span>
</div>
<div class="llm-context-message llm-context-message--tool-call cache-write">
<span class="llm-context-message-label">tool call(s)</span>
</div>
<div class="llm-context-message llm-context-message--tool-result cache-write">
<span class="llm-context-message-label">tool result(s)</span>
</div>
<div class="llm-context-message llm-context-message--assistant is-new">
<span class="llm-context-message-label">assistant message</span>
</div>
</div>
</section>
</div>
</div>
<figcaption>the same cache read, cache write, and append pattern repeats on later tool rounds</figcaption>
</figure>