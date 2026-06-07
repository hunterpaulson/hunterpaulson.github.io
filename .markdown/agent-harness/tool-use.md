---
title: tool use
lang: en
noindex: true
canonical-url: "https://hunterpaulson.dev/agent-harness/tool-use/"
description: "Hunter Paulson's personal website for writing, art, projects, and experiments in computer science."
og-type: "website"
site-name: "hunter paulson"
social-description: "Hunter Paulson's personal website for writing, art, projects, and experiments in computer science."
social-image-alt: "ASCII black hole animation from Hunter Paulson's personal website."
social-image-height: 769
social-image-type: "image/gif"
social-image-url: "https://hunterpaulson.dev/assets/social/home-blackhole.gif"
social-image-width: 769
social-title: "hunter paulson | tool use"
twitter-card: "summary_large_image"
---

# tool use

this page recreates an old excalidraw sketch as real site diagrams. the point is not the exact pixels. the point is to make the context-window mechanics editable, inspectable, and eventually animated.

tool definitions are tokens too. there is no law that says every possible tool has to sit at the top of every context window forever.

<figure class="agent-flow-diagram" aria-label="legend for tool use context diagrams">
<figcaption>legend</figcaption>
<div class="agent-flow-legend">
<span><span class="agent-flow-key agent-flow-key--system"></span>system</span>
<span><span class="agent-flow-key agent-flow-key--developer"></span>developer</span>
<span><span class="agent-flow-key agent-flow-key--tools"></span>tool definitions</span>
<span><span class="agent-flow-key agent-flow-key--user"></span>user</span>
<span><span class="agent-flow-key agent-flow-key--assistant"></span>assistant</span>
<span><span class="agent-flow-key agent-flow-key--tool-call"></span>tool call</span>
<span><span class="agent-flow-key agent-flow-key--tool-result"></span>tool result</span>
<span><span class="agent-flow-key agent-flow-key--cache-read"></span>cache read</span>
<span><span class="agent-flow-key agent-flow-key--cache-write"></span>cache write</span>
</div>
</figure>

# standard way of calling tools

the simple implementation gives the model every tool definition on every request. it works, but unused tools still cost tokens, latency, and sometimes tool-choice accuracy.

<figure class="agent-flow-diagram" aria-label="standard tool calling context sequence">
<figcaption>all tools are always in context</figcaption>
<div class="agent-flow-scroll">
<div class="agent-flow-grid">
<section class="agent-flow-panel">
<div class="agent-flow-panel-title">request 1</div>
<div class="agent-flow-stack">
<div class="agent-flow-message agent-flow-message--tools cache-write">
<span class="agent-flow-message-label">TOOL DEFINITIONS</span>
<span class="agent-flow-message-body">all tools</span>
</div>
<div class="agent-flow-message agent-flow-message--system cache-write">
<span class="agent-flow-message-label">SYSTEM</span>
<span class="agent-flow-message-body">system prompt</span>
</div>
<div class="agent-flow-message agent-flow-message--user cache-write">
<span class="agent-flow-message-label">USER</span>
<span class="agent-flow-message-body">user message</span>
</div>
</div>
</section>
<section class="agent-flow-panel">
<div class="agent-flow-panel-title">result 1</div>
<div class="agent-flow-stack">
<div class="agent-flow-message agent-flow-message--tools cache-read">
<span class="agent-flow-message-label">tool definitions</span>
<span class="agent-flow-message-body">all tools</span>
</div>
<div class="agent-flow-message agent-flow-message--system cache-read">
<span class="agent-flow-message-label">system</span>
<span class="agent-flow-message-body">system prompt</span>
</div>
<div class="agent-flow-message agent-flow-message--user cache-read">
<span class="agent-flow-message-label">user</span>
<span class="agent-flow-message-body">user message</span>
</div>
<div class="agent-flow-message agent-flow-message--assistant cache-write">
<span class="agent-flow-message-label">assistant</span>
<span class="agent-flow-message-body">assistant message</span>
</div>
<div class="agent-flow-message agent-flow-message--tool-call cache-write">
<span class="agent-flow-message-label">tool call</span>
<span class="agent-flow-message-body">tool call(s)</span>
</div>
</div>
</section>
<section class="agent-flow-panel">
<div class="agent-flow-panel-title">request 2</div>
<div class="agent-flow-stack">
<div class="agent-flow-message agent-flow-message--tools cache-read">
<span class="agent-flow-message-label">tool definitions</span>
<span class="agent-flow-message-body">all tools</span>
</div>
<div class="agent-flow-message agent-flow-message--system cache-read">
<span class="agent-flow-message-label">system</span>
<span class="agent-flow-message-body">system prompt</span>
</div>
<div class="agent-flow-message agent-flow-message--user cache-read">
<span class="agent-flow-message-label">user</span>
<span class="agent-flow-message-body">user message</span>
</div>
<div class="agent-flow-message agent-flow-message--assistant cache-read">
<span class="agent-flow-message-label">assistant</span>
<span class="agent-flow-message-body">assistant message</span>
</div>
<div class="agent-flow-message agent-flow-message--tool-call cache-read">
<span class="agent-flow-message-label">tool call</span>
<span class="agent-flow-message-body">tool call(s)</span>
</div>
<div class="agent-flow-message agent-flow-message--tool-result cache-write">
<span class="agent-flow-message-label">tool result</span>
<span class="agent-flow-message-body">tool response</span>
</div>
</div>
</section>
<section class="agent-flow-panel">
<div class="agent-flow-panel-title">result 2</div>
<div class="agent-flow-stack">
<div class="agent-flow-message agent-flow-message--tools cache-read">
<span class="agent-flow-message-label">tool definitions</span>
<span class="agent-flow-message-body">all tools</span>
</div>
<div class="agent-flow-message agent-flow-message--system cache-read">
<span class="agent-flow-message-label">system</span>
<span class="agent-flow-message-body">system prompt</span>
</div>
<div class="agent-flow-message agent-flow-message--user cache-read">
<span class="agent-flow-message-label">user</span>
<span class="agent-flow-message-body">user message</span>
</div>
<div class="agent-flow-message agent-flow-message--assistant cache-read">
<span class="agent-flow-message-label">assistant</span>
<span class="agent-flow-message-body">assistant message</span>
</div>
<div class="agent-flow-message agent-flow-message--tool-call cache-read">
<span class="agent-flow-message-label">tool call</span>
<span class="agent-flow-message-body">tool call(s)</span>
</div>
<div class="agent-flow-message agent-flow-message--tool-result cache-read">
<span class="agent-flow-message-label">tool result</span>
<span class="agent-flow-message-body">tool response</span>
</div>
<div class="agent-flow-message agent-flow-message--assistant cache-write">
<span class="agent-flow-message-label">assistant</span>
<span class="agent-flow-message-body">assistant message</span>
</div>
</div>
</section>
</div>
</div>
</figure>

# search before use

the better shape is to keep a small set of always-on tools in context, then search for the task-specific tools only when the model needs them.

<figure class="agent-flow-diagram" aria-label="tool search implementation comparison">
<figcaption>two versions of the same idea</figcaption>
<div class="agent-flow-compare">
<section>
<h2>server-side tool search</h2>
<p>in the excalidraw this was labeled anthropic's implementation. the tool-search loop happens inside one provider call, so the client receives one response that already contains the searched tool set and the final tool call.</p>
<div class="agent-flow-scroll">
<div class="agent-flow-grid">
<section class="agent-flow-panel">
<div class="agent-flow-panel-title">request 1</div>
<div class="agent-flow-stack">
<div class="agent-flow-message agent-flow-message--tools cache-write">
<span class="agent-flow-message-label">tool definitions</span>
<span class="agent-flow-message-body">always-on tools</span>
</div>
<div class="agent-flow-message agent-flow-message--system cache-write">
<span class="agent-flow-message-label">system</span>
<span class="agent-flow-message-body">system prompt</span>
</div>
<div class="agent-flow-message agent-flow-message--user cache-write">
<span class="agent-flow-message-label">user</span>
<span class="agent-flow-message-body">user message</span>
</div>
</div>
</section>
<section class="agent-flow-panel">
<div class="agent-flow-panel-title">result 1</div>
<div class="agent-flow-stack">
<div class="agent-flow-message agent-flow-message--tools cache-read">
<span class="agent-flow-message-label">tool definitions</span>
<span class="agent-flow-message-body">always-on tools</span>
</div>
<div class="agent-flow-message agent-flow-message--system cache-read">
<span class="agent-flow-message-label">system</span>
<span class="agent-flow-message-body">system prompt</span>
</div>
<div class="agent-flow-message agent-flow-message--user cache-read">
<span class="agent-flow-message-label">user</span>
<span class="agent-flow-message-body">user message</span>
</div>
<div class="agent-flow-message agent-flow-message--assistant cache-write">
<span class="agent-flow-message-label">assistant</span>
<span class="agent-flow-message-body">assistant message</span>
</div>
<div class="agent-flow-message agent-flow-message--tool-call cache-write">
<span class="agent-flow-message-label">internal tool call</span>
<span class="agent-flow-message-body">tool search</span>
</div>
<div class="agent-flow-message agent-flow-message--tool-result cache-write">
<span class="agent-flow-message-label">internal result</span>
<span class="agent-flow-message-body">result tools</span>
</div>
<div class="agent-flow-message agent-flow-message--assistant cache-write">
<span class="agent-flow-message-label">assistant</span>
<span class="agent-flow-message-body">assistant message</span>
</div>
<div class="agent-flow-message agent-flow-message--tool-call cache-write">
<span class="agent-flow-message-label">tool call</span>
<span class="agent-flow-message-body">tool call(s)</span>
</div>
</div>
</section>
</div>
</div>
<div class="agent-flow-callout">
notice how an entire tool-call loop happened server side. the client sees two assistant messages in the response, but it did not have to make a second public request.
</div>
</section>
<section>
<h2>client-side tool search</h2>
<p>our implementation can expose tool search as a normal tool. that is more general, but loading found tool definitions at the top of the next request changes the prefix.</p>
<div class="agent-flow-scroll">
<div class="agent-flow-grid">
<section class="agent-flow-panel">
<div class="agent-flow-panel-title">request 1</div>
<div class="agent-flow-stack">
<div class="agent-flow-message agent-flow-message--tools cache-write">
<span class="agent-flow-message-label">tool definitions</span>
<span class="agent-flow-message-body">always-on tools</span>
</div>
<div class="agent-flow-message agent-flow-message--system cache-write">
<span class="agent-flow-message-label">system</span>
<span class="agent-flow-message-body">system prompt</span>
</div>
<div class="agent-flow-message agent-flow-message--user cache-write">
<span class="agent-flow-message-label">user</span>
<span class="agent-flow-message-body">user message</span>
</div>
</div>
</section>
<section class="agent-flow-panel">
<div class="agent-flow-panel-title">result 1</div>
<div class="agent-flow-stack">
<div class="agent-flow-message agent-flow-message--tools cache-read">
<span class="agent-flow-message-label">tool definitions</span>
<span class="agent-flow-message-body">always-on tools</span>
</div>
<div class="agent-flow-message agent-flow-message--system cache-read">
<span class="agent-flow-message-label">system</span>
<span class="agent-flow-message-body">system prompt</span>
</div>
<div class="agent-flow-message agent-flow-message--user cache-read">
<span class="agent-flow-message-label">user</span>
<span class="agent-flow-message-body">user message</span>
</div>
<div class="agent-flow-message agent-flow-message--assistant cache-write">
<span class="agent-flow-message-label">assistant</span>
<span class="agent-flow-message-body">assistant message</span>
</div>
<div class="agent-flow-message agent-flow-message--tool-call cache-write">
<span class="agent-flow-message-label">tool call</span>
<span class="agent-flow-message-body">tool_search</span>
</div>
</div>
</section>
<section class="agent-flow-panel agent-flow-panel--invalidated">
<div class="agent-flow-panel-title">request 2</div>
<div class="agent-flow-panel-note">found tools are inserted before the old prefix</div>
<div class="agent-flow-stack">
<div class="agent-flow-message agent-flow-message--tools cache-read">
<span class="agent-flow-message-label">tool definitions</span>
<span class="agent-flow-message-body">always-on tools</span>
</div>
<div class="agent-flow-message agent-flow-message--risk is-inserted cache-write">
<span class="agent-flow-message-label">new tool definitions</span>
<span class="agent-flow-message-body">found tool(s)</span>
</div>
<div class="agent-flow-message agent-flow-message--system cache-write">
<span class="agent-flow-message-label">system</span>
<span class="agent-flow-message-body">system prompt</span>
</div>
<div class="agent-flow-message agent-flow-message--user cache-write">
<span class="agent-flow-message-label">user</span>
<span class="agent-flow-message-body">user message</span>
</div>
<div class="agent-flow-message agent-flow-message--assistant cache-write">
<span class="agent-flow-message-label">assistant</span>
<span class="agent-flow-message-body">assistant message</span>
</div>
<div class="agent-flow-message agent-flow-message--tool-call cache-write">
<span class="agent-flow-message-label">tool call</span>
<span class="agent-flow-message-body">tool_search</span>
</div>
<div class="agent-flow-message agent-flow-message--tool-result cache-write">
<span class="agent-flow-message-label">tool result</span>
<span class="agent-flow-message-body">tool response</span>
</div>
</div>
</section>
<section class="agent-flow-panel">
<div class="agent-flow-panel-title">result 2</div>
<div class="agent-flow-stack">
<div class="agent-flow-message agent-flow-message--tools cache-read">
<span class="agent-flow-message-label">tool definitions</span>
<span class="agent-flow-message-body">always-on tools</span>
</div>
<div class="agent-flow-message agent-flow-message--tools cache-read">
<span class="agent-flow-message-label">new tool definitions</span>
<span class="agent-flow-message-body">found tool(s)</span>
</div>
<div class="agent-flow-message agent-flow-message--system cache-read">
<span class="agent-flow-message-label">system</span>
<span class="agent-flow-message-body">system prompt</span>
</div>
<div class="agent-flow-message agent-flow-message--user cache-read">
<span class="agent-flow-message-label">user</span>
<span class="agent-flow-message-body">user message</span>
</div>
<div class="agent-flow-message agent-flow-message--assistant cache-read">
<span class="agent-flow-message-label">assistant</span>
<span class="agent-flow-message-body">assistant message</span>
</div>
<div class="agent-flow-message agent-flow-message--tool-call cache-read">
<span class="agent-flow-message-label">tool call</span>
<span class="agent-flow-message-body">tool_search</span>
</div>
<div class="agent-flow-message agent-flow-message--tool-result cache-read">
<span class="agent-flow-message-label">tool result</span>
<span class="agent-flow-message-body">tool response</span>
</div>
<div class="agent-flow-message agent-flow-message--assistant cache-write">
<span class="agent-flow-message-label">assistant</span>
<span class="agent-flow-message-body">assistant message</span>
</div>
<div class="agent-flow-message agent-flow-message--tool-call cache-write">
<span class="agent-flow-message-label">tool call</span>
<span class="agent-flow-message-body">tool call(s)</span>
</div>
</div>
</section>
</div>
</div>
<div class="agent-flow-callout agent-flow-callout--risk">
kv-cache invalidation: if the harness inserts found tool definitions before the old system/user/assistant prefix, the provider cannot reuse the old prefix past that insertion point.
</div>
</section>
</div>
</figure>

# tool placement

the deeper point from the sketch is that tools are just json tokens. always-on tools are useful for a small control surface, but most tools should be searchable and loaded only when needed.

<figure class="agent-flow-diagram" aria-label="always-on tools versus searchable tools">
<figcaption>small always-on set, large searchable set</figcaption>
<div class="agent-flow-split">
<section class="agent-flow-panel">
<div class="agent-flow-panel-title">always-on tools</div>
<div class="agent-flow-stack">
<div class="agent-flow-message agent-flow-message--tool-call">
<span class="agent-flow-message-label">used</span>
<span class="agent-flow-message-body">tool_A</span>
</div>
<div class="agent-flow-message agent-flow-message--tool-call">
<span class="agent-flow-message-label">used</span>
<span class="agent-flow-message-body">tool_I</span>
</div>
<div class="agent-flow-message agent-flow-message--risk">
<span class="agent-flow-message-label">unused</span>
<span class="agent-flow-message-body">tool_J</span>
</div>
<div class="agent-flow-message agent-flow-message--risk">
<span class="agent-flow-message-label">unused</span>
<span class="agent-flow-message-body">tool_N</span>
</div>
</div>
</section>
<section class="agent-flow-panel">
<div class="agent-flow-panel-title">searchable tools</div>
<div class="agent-flow-stack">
<div class="agent-flow-message agent-flow-message--tool-call">
<span class="agent-flow-message-label">loaded when needed</span>
<span class="agent-flow-message-body">tool_A</span>
</div>
<div class="agent-flow-message agent-flow-message--tool-call">
<span class="agent-flow-message-label">loaded when needed</span>
<span class="agent-flow-message-body">tool_I</span>
</div>
<div class="agent-flow-message agent-flow-message--muted">
<span class="agent-flow-message-label">not in context</span>
<span class="agent-flow-message-body">tool_J</span>
</div>
<div class="agent-flow-message agent-flow-message--muted">
<span class="agent-flow-message-label">not in context</span>
<span class="agent-flow-message-body">tool_N</span>
</div>
</div>
</section>
</div>
</figure>
