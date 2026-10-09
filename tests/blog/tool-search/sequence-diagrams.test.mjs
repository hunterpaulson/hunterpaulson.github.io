import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { expandMarkdownIncludes } from "../../../scripts/expand-markdown-includes.mjs";

const articlePath = path.join(
  import.meta.dir,
  "../../../content/agent-harness/context-window/diagrams.md",
);
const stylesheetPath = path.join(
  import.meta.dir,
  "../../../src/styles/components/llm-context.css",
);
const toolSearchPath = path.join(
  import.meta.dir,
  "../../../content/agent-harness/tool-search.md",
);
const firstToolUsePath = path.join(
  import.meta.dir,
  "../../../content/includes/diagrams/tool-search/first-tool-use/index.md",
);

const articleDiagramIds = [
  "tool-use-exchange-1",
  "tool-use-exchange-2",
  "tool-calling-with-unused-tools",
  "adding-tool-invalidates-cache",
  "tool-search-progressive-disclosure",
  "tool-search-cache-reuse",
  "tool-search-many-results",
  "tool-search-exact-load",
  "tool-search-skill-loading",
];

const galleryOnlyDiagramIds = [
  "tool-search-only-always-on",
];

const diagramIds = [...articleDiagramIds, ...galleryOnlyDiagramIds];

function figureSource(markdown, id) {
  const start = markdown.indexOf(`id="${id}"`);
  assert.notEqual(start, -1, `${id} is present`);
  const end = markdown.indexOf("</figure>", start);
  assert.notEqual(end, -1, `${id} is closed`);
  return markdown.slice(start, end);
}

test("context diagrams use the shared LLM diagram structure", async () => {
  const markdown = await expandMarkdownIncludes(articlePath);

  for (const id of diagramIds) {
    const figure = figureSource(markdown, id);
    assert.match(figure, /llm-context-diagram/);
    assert.match(figure, /llm-context-grid--(?:single|pair)/);
    assert.match(figure, /llm-context-message-body/);
  }

  assert.equal(
    (markdown.match(/class="llm-context-diagram/g) ?? []).length,
    diagramIds.length,
  );

  const figureIds = [...markdown.matchAll(/<figure id="([^"]+)"/g)].map(
    ([, id]) => id,
  );
  assert.equal(new Set(figureIds).size, figureIds.length);
  assert.doesNotMatch(markdown, /llm-context-message-label/);
  assert.doesNotMatch(markdown, /llm-context-diagram--sequence/);
  assert.doesNotMatch(markdown, /llm-context-message-(?:info|cost)/);
  assert.doesNotMatch(markdown, /\bis-new\b/);
});

test("context diagrams use the shared auto-generated message headers", async () => {
  const [markdown, stylesheet] = await Promise.all([
    expandMarkdownIncludes(articlePath),
    readFile(stylesheetPath, "utf8"),
  ]);

  assert.match(stylesheet, /content: "SYSTEM  <#>"/);
  assert.match(stylesheet, /content: "TOOLS  \{#\}"/);
  assert.match(stylesheet, /content: "USER  \(\^_\^\)"/);
  assert.match(stylesheet, /content: "ASSISTANT  \[o_o\]"/);
  assert.match(stylesheet, /content: "TOOL CALL  →\{\}"/);
  assert.match(stylesheet, /content: "TOOL RESULT  ←\{\}"/);
  assert.match(stylesheet, /\.llm-context-message \.llm-context-message-meta/);
  assert.doesNotMatch(stylesheet, /llm-context-message-(?:info|cost)/);
  assert.match(markdown, /llm-context-diagram--focus/);
});

test("nested tool results distinguish the container from tool definitions", async () => {
  const [markdown, stylesheet] = await Promise.all([
    expandMarkdownIncludes(articlePath),
    readFile(stylesheetPath, "utf8"),
  ]);
  const figure = figureSource(markdown, "tool-search-many-results");

  assert.match(
    figure,
    /llm-context-message--tool-result[^>]*>[\s\S]*llm-context-message--tool-definition/,
  );
  assert.match(stylesheet, /content: "TOOL DEF  \{#\}"/);
});

test("loading a skill through tool search takes three model requests", async () => {
  const markdown = await expandMarkdownIncludes(articlePath);
  const figure = figureSource(markdown, "tool-search-skill-loading");

  assert.equal((figure.match(/llm-context-panel-title">model request [123]/g) ?? []).length, 3);
  assert.match(figure, /name: tools__search[\s\S]*query: read file/);
  assert.match(
    figure,
    /llm-context-message--tool-result[\s\S]*llm-context-message--tool-definition[\s\S]*name: filesystem__read_file/,
  );
  assert.match(figure, /name: filesystem__read_file[\s\S]*path: \/skills\/code-review\/SKILL\.md/);
  assert.match(figure, /# code review[\s\S]*Inspect the diff[\s\S]*Run relevant tests/);
  assert.doesNotMatch(figure, /same prefix|llm-context-message--omitted/);
  assert.equal(
    (figure.match(/llm-context-message--assistant is-important">\s*<div class="llm-context-message llm-context-message--tool-call is-important">/g) ?? []).length,
    2,
  );
});

test("focus muting yields to explicit tone and importance", async () => {
  const stylesheet = await readFile(stylesheetPath, "utf8");

  assert.match(
    stylesheet,
    /\.llm-context-diagram--focus \.llm-context-message:not\(\.is-important, \.is-danger, \.is-benefit\)/,
  );
});

test("omitted messages retain normal body-only message spacing", async () => {
  const stylesheet = await readFile(stylesheetPath, "utf8");
  const omittedStyles = stylesheet.match(
    /\.llm-context-message--omitted\s*\{([\s\S]*?)\}/,
  )?.[1] ?? "";

  assert.match(omittedStyles, /border-style:\s*dashed/);
  assert.doesNotMatch(
    omittedStyles,
    /place-items|min-height|padding(?:-top|-bottom)?|text-align/,
  );
});

test("preformatted message bodies survive the Pandoc conversion", async () => {
  const markdown = await expandMarkdownIncludes(articlePath);
  const figure = figureSource(markdown, "tool-use-exchange-1");
  const conversion = spawnSync(
    "pandoc",
    ["--from=markdown", "--to=html", "--wrap=none"],
    { encoding: "utf8", input: figure },
  );

  assert.equal(conversion.status, 0, conversion.stderr);
  assert.match(
    conversion.stdout,
    /<pre class="llm-context-message-body" data-whitespace="pre-wrap">name: web__search/,
  );
});

test("the first tool use reads as two request and response exchanges", async () => {
  const [diagramPartials, article] = await Promise.all([
    expandMarkdownIncludes(firstToolUsePath),
    expandMarkdownIncludes(toolSearchPath),
  ]);
  const markdown = article;
  const exchange1 = figureSource(markdown, "tool-use-exchange-1");
  const exchange2 = figureSource(markdown, "tool-use-exchange-2");

  assert.equal((markdown.match(/data-provider-code/g) ?? []).length, 0);
  assert.equal((markdown.match(/```typescript/g) ?? []).length, 4);
  assert.doesNotMatch(markdown, /```json/);
  assert.doesNotMatch(markdown, /data-provider=|client\.responses|function_call/);

  assert.match(exchange1, /llm-context-panel-title">request 1/);
  assert.match(exchange1, /llm-context-panel-title">response 1/);
  assert.equal((exchange1.match(/class="llm-context-panel"/g) ?? []).length, 2);

  assert.match(exchange2, /llm-context-panel-title">request 2/);
  assert.match(exchange2, /llm-context-panel-title">response 2/);
  assert.equal((exchange2.match(/class="llm-context-panel"/g) ?? []).length, 2);
  const request2 = exchange2.slice(0, exchange2.indexOf("response 2"));
  assert.match(
    request2,
    /llm-context-message--omitted[^>]*><span class="llm-context-message-body">same prefix: request 1 \+ response 1 \.\.\.<\/span>/,
  );
  assert.equal((request2.match(/llm-context-message--tool-result/g) ?? []).length, 1);
  assert.doesNotMatch(
    request2,
    /llm-context-message--(?:tools|system|user|assistant|tool-call)\b/,
  );

  assert.match(markdown, /const messages =/);
  assert.equal(
    (markdown.match(/const system = "You report the weather"/g) ?? []).length,
    1,
  );
  assert.equal((markdown.match(/system: "You report the weather"/g) ?? []).length, 0);
  assert.equal((markdown.match(/instructions: "You report the weather"/g) ?? []).length, 0);
  assert.equal((markdown.match(/instructions: system/g) ?? []).length, 0);
  assert.match(markdown, /messages\.push\([\s\S]*role: "assistant"/);
  assert.match(markdown, /content: response1\.content/);
  assert.match(markdown, /content: await executeTool\(toolUse\.name, toolUse\.input\)/);
  assert.match(markdown, /const response2 = await/);
  assert.doesNotMatch(markdown, /\bimport\b|max_tokens|additionalProperties|strict:/);
  assert.doesNotMatch(markdown, /console\.log|const result =|runTool\(/);
  assert.match(
    markdown,
    /\/\/ response1\.content[\s\S]*type: "text"[\s\S]*I'll check the weather in Phoenix\.[\s\S]*type: "tool_use"/,
  );
  assert.match(markdown, /\/\/ response2\.content[\s\S]*type: "text"/);
  assert.match(markdown, /messages\.create\(\{\s*tools,\s*system,\s*messages,/);

  const articleIntro = article.slice(0, article.indexOf("# _all_ tools"));
  assert.equal((articleIntro.match(/```typescript/g) ?? []).length, 2);
  assert.equal((articleIntro.match(/data-provider-code/g) ?? []).length, 0);
  assert.doesNotMatch(articleIntro, /TODO: (?:show code|break first example)/);
  assert.doesNotMatch(diagramPartials, /```typescript|^## request/m);
});

test("tool-search teaching content is Anthropic-only", async () => {
  const markdown = await expandMarkdownIncludes(toolSearchPath);

  assert.doesNotMatch(markdown, /data-provider=/);
  assert.doesNotMatch(markdown, /\bparameters:|\barguments:|client\.responses\.create/);
  assert.doesNotMatch(markdown, /openai/i);
  assert.match(markdown, /\binput_schema:/);
  assert.match(markdown, /\binput:/);
});

test("the Phoenix example uses one weather result and conclusion throughout", async () => {
  const markdown = await expandMarkdownIncludes(toolSearchPath);

  assert.equal((markdown.match(/temperature: 99°F\nhumidity: 15%/g) ?? []).length, 4);
  assert.equal((markdown.match(/hot(?:<\/em>)? and dry/g) ?? []).length, 6);
  assert.doesNotMatch(markdown, /condition: sunny|hot and sunny|<em>hot<\/em> in Phoenix/);
});

test("the article code shows eager and deferred Slack tool loading", async () => {
  const markdown = await expandMarkdownIncludes(toolSearchPath);
  const eagerStart = markdown.indexOf("## naive adding invalidates kv cache");
  const eagerEnd = markdown.indexOf("# solution: disclose tools progressively", eagerStart);
  const eagerExample = markdown.slice(eagerStart, eagerEnd);

  assert.doesNotMatch(
    markdown,
    /TODO: request showing adding slack mcp server|show how tool references look in tool results/,
  );
  assert.match(markdown, /name: "slack__thread_history"/);
  assert.match(markdown, /description: "Read a Slack thread"/);
  assert.match(
    eagerExample,
    /\/\/ \.\.\. existing tools[\s\S]*name: "slack__thread_history"[\s\S]*\/\/ additional slack tools/,
  );
  assert.match(eagerExample, /const system = "You search public and company knowledge"/);
  assert.doesNotMatch(eagerExample, /\.\.\.existingTools/);
  assert.match(markdown, /defer_loading: true/);
  assert.match(markdown, /defer_loading: true, \/\/ omit from the prompt prefix/);
  assert.match(markdown, /\/\/ additional slack tools/);
  assert.doesNotMatch(markdown, /\.\.\.otherDeferredTools/);
  assert.doesNotMatch(markdown, /system: "You search public and company knowledge"/);
  assert.equal(
    (markdown.match(/const system = "You search public and company knowledge"/g) ?? []).length,
    1,
  );
  assert.match(markdown, /name: "tools__search"/);
  assert.match(markdown, /type: "tool_result"/);
  assert.match(markdown, /type: "tool_reference", tool_name: "slack__thread_history"/);
  assert.doesNotMatch(markdown, /type: "tool_search_tool_result"/);
  assert.doesNotMatch(markdown, /\bdeferred: true/);
});

test("the article and preview gallery share the same diagram partials", async () => {
  const [articleSource, gallerySource, article, gallery] = await Promise.all([
    readFile(toolSearchPath, "utf8"),
    readFile(articlePath, "utf8"),
    expandMarkdownIncludes(toolSearchPath),
    expandMarkdownIncludes(articlePath),
  ]);

  for (const id of articleDiagramIds) {
    assert.match(article, new RegExp(`<figure id="${id}"`));
    assert.match(gallery, new RegExp(`<figure id="${id}"`));
  }
  assert.equal((articleSource.match(/\{\{ include "content\/includes\/diagrams\/tool-search\//g) ?? []).length, 9);
  assert.equal((gallerySource.match(/\{\{ include "content\/includes\/diagrams\/tool-search\//g) ?? []).length, 8);
});

test("diagram tool names use namespaced snake case", async () => {
  const markdown = await expandMarkdownIncludes(toolSearchPath);

  assert.match(markdown, /name: web__search/);
  assert.match(markdown, /name: slack__thread_history/);
  assert.match(markdown, /name: slack__channel_history/);
  assert.match(markdown, /name: slack__send_message/);
  assert.match(markdown, /name: slack__add_reaction/);
  assert.doesNotMatch(markdown, /name: [a-z0-9_]*__[a-z0-9_]*[A-Z]/);
});

test("cache diagrams carry figure-specific legends", async () => {
  const [markdown, stylesheet] = await Promise.all([
    expandMarkdownIncludes(toolSearchPath),
    readFile(stylesheetPath, "utf8"),
  ]);
  const invalidation = figureSource(markdown, "adding-tool-invalidates-cache");
  const reuse = figureSource(markdown, "tool-search-cache-reuse");
  const legendStyles = stylesheet.match(/\.llm-context-legend\s*\{([\s\S]*?)\}/)?.[1] ?? "";
  const recomputedStyles = stylesheet.match(/\.llm-context-key--recomputed\s*\{([\s\S]*?)\}/)?.[1] ?? "";

  assert.match(invalidation, /llm-context-key--cache-read/);
  assert.match(invalidation, /llm-context-key--cache-write/);
  assert.match(invalidation, /llm-context-key--recomputed/);
  assert.match(invalidation, /llm-context-legend-title">legend</);
  assert.match(reuse, /llm-context-key--cache-read/);
  assert.match(reuse, /llm-context-key--cache-write/);
  assert.doesNotMatch(reuse, /llm-context-key--recomputed/);
  assert.match(reuse, /llm-context-legend-title">legend</);
  assert.match(legendStyles, /justify-content:\s*center/);
  assert.match(recomputedStyles, /color:\s*var\(--text-color\)/);
  assert.match(
    recomputedStyles,
    /box-shadow:\s*inset var\(--llm-context-cache-bar-width\) 0 0\s*var\(--llm-role-risk\)/,
  );
  assert.doesNotMatch(recomputedStyles, /cache-write|calc\(-1/);
});
