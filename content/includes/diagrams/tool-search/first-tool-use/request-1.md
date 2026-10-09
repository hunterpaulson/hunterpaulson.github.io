<figure id="tool-use-exchange-1" class="llm-context-diagram" aria-label="first tool-use request and response">
<div class="llm-context-scroll">
<div class="llm-context-grid llm-context-grid--single">
<section class="llm-context-panel">
<div class="llm-context-panel-title">request 1</div>
<div class="llm-context-stack">
<div class="llm-context-message llm-context-message--tools"><pre class="llm-context-message-body" data-whitespace="pre-wrap">name: web__search
description: Search the web
input_schema:
  properties:
    query: { type: string }</pre></div>
<div class="llm-context-message llm-context-message--system"><span class="llm-context-message-body">You report the weather</span></div>
<div class="llm-context-message llm-context-message--user"><span class="llm-context-message-body">What is the weather in Phoenix?</span></div>
</div>
</section>
<section class="llm-context-panel">
<div class="llm-context-panel-title">response 1</div>
<div class="llm-context-stack">
<div class="llm-context-message llm-context-message--assistant"><span class="llm-context-message-body">I&apos;ll check the weather in Phoenix.</span></div>
<div class="llm-context-message llm-context-message--tool-call"><pre class="llm-context-message-body" data-whitespace="pre-wrap">name: web__search
input:
  query: Current weather in Phoenix, AZ</pre></div>
</div>
</section>
</div>
</div>
</figure>
