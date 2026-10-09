---
title: context window diagram preview
date: 2026-09-28
---

# tool example

{{ include "content/includes/diagrams/tool-search/first-tool-use/index.md" }}

# you pay for unused tools

{{ include "content/includes/diagrams/tool-search/tool-calling-with-unused-tools.html" }}

# adding tool invalidates kv cache

{{ include "content/includes/diagrams/tool-search/adding-tool-invalidates-cache.html" }}

# progressive disclosure

{{ include "content/includes/diagrams/tool-search/tool-search-progressive-disclosure.html" }}

# can reuse the cache across sessions


{{ include "content/includes/diagrams/tool-search/tool-search-cache-reuse.html" }}


# problem: search can return lots of results


{{ include "content/includes/diagrams/tool-search/tool-search-many-results.html" }}

# solution: give exact names in system prompt and have model load by exact name

{{ include "content/includes/diagrams/tool-search/tool-search-exact-load.html" }}

# is tool search all you need?

{{ include "content/includes/diagrams/tool-search/tool-search-skill-loading.html" }}

# testing icons

<figure id="tool-search-only-always-on" class="llm-context-diagram " aria-label="tool search as the only always-on tool">
<div class="llm-context-scroll">
<div class="llm-context-grid llm-context-grid--single">
<section class="llm-context-panel">
<div class="llm-context-panel-title">tool search as the always-on tool</div>
<div class="llm-context-stack">
<div class="llm-context-message llm-context-message--tool-definition"><span class="llm-context-message-body"></span></div>
<div class="llm-context-message llm-context-message--system"><span class="llm-context-message-body"></span></div>
<div class="llm-context-message llm-context-message--user"><span class="llm-context-message-body"></span></div>
<div class="llm-context-message llm-context-message--assistant"><span class="llm-context-message-body"></span></div>
<div class="llm-context-message llm-context-message--tool-call"><span class="llm-context-message-body"></span></div>
<div class="llm-context-message llm-context-message--tool-result"><span class="llm-context-message-body"></span></div>
<div class="llm-context-message llm-context-message--assistant"><span class="llm-context-message-body"></span></div>
<div class="llm-context-message llm-context-message--tool-call"><span class="llm-context-message-body"></span></div>
</div>
</section>
</div>
</div>
<figcaption>the search tool stays in every context while the tools it finds are disclosed only when needed</figcaption>
</figure>
