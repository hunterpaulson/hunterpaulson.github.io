---
title: agent harness anatomy
lang: en
noindex: true
---

# agent harness anatomy

agent harnesses are the product layer around language models.

The model is no longer the product. now **the harness is the product**.

this is where I am collecting the mental models I use when building them: what belongs in the context window, how tool calls change the trajectory, why context is more like a stack than a log, and how the harness should eventually let the model participate in memory management.

this wants to be a living reference more than a dated blog post. individual pages can become essays later, but the URLs should stay stable while the ideas keep sharpening.

# map

<ul class="agent-page-list">
  <li><a href="/agent-harness/context-window/">context window</a> — the harness's core object of control.</li>
  <li><a href="/agent-harness/tool-use/">tool use</a> — how tool definitions, tool calls, tool results, and tool search move through context.</li>
  <li>context lifecycle — invoker, context collection, api calls, tool execution, and final user-facing output.</li>
  <li>context management — truncation, compaction, stack frames, and kv-cache invalidation.</li>
  <li>subagents — fresh context, forked context, delegated work, and micro-compaction on return.</li>
  <li>harness innovations — tool results as files, tool search, context editing, and model-directed memory.</li>
</ul>

# toc

## Large Language Model

A is a natural language system that can be trained to understand and generate human language.