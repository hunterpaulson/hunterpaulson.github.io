---
title: tool search
description: how tools work in all modern harnesses
author: Hunter Paulson
status: published
# social-image: /assets/agent-harness/social/...png
# social-image-alt: KV cache diagram showing current APIs retaining input token KVs while generated output token KVs are not retained across requests.
toc: true
toc-title: Contents
toc-depth: 1
---

<!-- target audience: people using agents since people building agents will understand too and they use agents to build agents so they are a subset not disjoint.

TODO:
- try right justifying user messages (like texting)
- maybe also tool results

format tool schema
- json?, xml? ts functions!
- standard name format

put multiple tool defs or calls or results within a larger tool section spans (delete/move div)

should we put tool calls inside assistant messages?
 -->

# how tool use works

say you want your agent to be able to provide up-to-date infromation without hallucinating. then you need to give them a way to search the web.

we do this by giving the model the schema of our web search function: e.g `search(query)`.

we then add that to the top level `tools` array and call the llm api.

depending on your question the llm will then generate a tool call block with the parameters of our function filled in.

## request 1

```typescript
// define the schema of your tools
const tools = [{
  name: "web__search",
  description: "Search the web",
  input_schema: {
    properties: { query: { type: "string" } },
  },
}];

const system = "You report the weather";

const messages = [{
  role: "user",
  content: "What is the weather in Phoenix?",
}];

const response1 = await client.messages.create({
  tools,
  system,
  messages,
});

// response1.content
[
  { type: "text", text: "I'll check the weather in Phoenix." },
  {
    type: "tool_use",
    id: "toolu_123",
    name: "web__search",
    input: { query: "Current weather in Phoenix, AZ" },
  },
]
```

{{ include "content/includes/diagrams/tool-search/first-tool-use/request-1.md" }}

we then pass the parameters the llm filled out to our function and send the result back to the model.
don't forget to append the the assistant message and tool call to the messages array.

the llm then can use the result to answer your question.

## request 2

```typescript
messages.push({ role: "assistant", content: response1.content });

const toolUse = response1.content.find((block) => block.type === "tool_use");
messages.push({
  role: "user",
  content: [{
    type: "tool_result",
    tool_use_id: toolUse.id,
    content: await executeTool(toolUse.name, toolUse.input),
  }],
});

const response2 = await client.messages.create({
  tools,
  system,
  messages,
});

// response2.content
[{ type: "text", text: "It's hot and dry in Phoenix right now." }]
```

{{ include "content/includes/diagrams/tool-search/first-tool-use/request-2.md" }}

# _all_ tools are part of _every_ request

all tools an agent _may_ need to answer your question need to be in the prompt before your query.

this means that you pay for every tool in every session even if the model does not need or use it to complete your ask.

cost of each request grows linearly with the number of capabilities you want your agent to have. even if you are willing to pay the cost, context is finite so you will eventually run out of space in the context window for the model to actually call tools and complete the task.

here is how much of the context window is already used at the start of every Claude Code session.

```
❯ /context
  ⎿  Context Usage
     ⛁ ⛁ ⛁ ⛁ ⛁ ⛁ ⛁ ⛁ ⛁ ⛁   Opus 5.5
     ⛁ ⛁ ⛁ ⛁ ⛁ ⛁ ⛁ ⛀ ⛁ ⛀   claude-opus-5-5
     ⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶   37.2k/200k tokens (19%)
     ⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶
     ⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶   Estimated usage by category
     ⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶   ⛁ System prompt: 3.9k tokens (1.9%)
     ⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶   ⛁ System tools: 29.8k tokens (14.9%)
     ⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶   ⛁ Memory files: 1.3k tokens (0.6%)
     ⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶   ⛁ Skills: 2k tokens (1.0%)
     ⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶   ⛁ Messages: 141 tokens (0.1%)
                               ⛶ Free space: 162.8k (81.4%)
```
<!-- TODO: `/context` with mcp connected naively to show so many tools -->

say you want to add the ability for claude to manage jira tickets and read confluence pages. then you need to add all those tools to every request. what if you also want your agent to be able to interact with slack. you've gotta add all those tools too.

even tho most messages in most sessions won't need either of those capabilities you still pay for the tokens they take up in every request.

{{ include "content/includes/diagrams/tool-search/tool-calling-with-unused-tools.html" }}

worst of all, additional tools doesn't only increase cost. It decreases performance both in terms of accuracy and latency.

<!-- TODO: add citation for context rot paper -->

## most tasks won't need _all_ tools

if adding tools increases cost and decreases performance why don't we just give the model only the tools it need to complete the current task?

this would require us to be able to accurately predict the tools needed for a task given only the prompt. If you underestimate, or miss any, then it will be impossible for the model to fully complete the task. If you overestimate, or add too many, then we are back where we started paying for tools that were not necessary.

is there an alternative?

lets reframe the problem, since if a problem is framed correctly the solution becomes obvious
<!-- what is the original quote here ^ -->

problem: **we pay for tools we don't need**

so we need to find a way to _only pay for a tool when we are sure the llm is going to use it_

## naive adding invalidates kv cache

first idea would be to just add tools to context when they are needed

Here since the second session references slack so we add the slack tools to the payload

```typescript
const tools = [
  // ... existing tools
  {
    name: "slack__thread_history",
    description: "Read a Slack thread",
    input_schema: {
      properties: {
        channel_id: { type: "string" },
        thread_ts: { type: "string" },
      },
    },
  },
  // additional slack tools
];

const system = "You search public and company knowledge";

await client.messages.create({
  tools,
  system,
  messages: [{
    role: "user",
    content: "Summarize this Slack thread: acme.slack.com/C123456/123456.7890",
  }],
});
```

its common to cache the system prompt and tools so they can be used across sessions. however, because _tools come at the beginning of the context window_, changing the tools (adding or removing) invalidates the prompt prefix/kv cache for both the tools and system. so you to pay for a cache write every time you change the `tools` array.


{{ include "content/includes/diagrams/tool-search/adding-tool-invalidates-cache.html" }}

<!-- TODO: add source: ant 'what invalidates the prompt cache' -->

this works quickly becomes prohibitively expensive in both $ and latency. so we need a way to add tools so that the prefix is the same as the previous request so we can reuse the kv cache

# solution: disclose tools progressively

<!-- how can we append tools to the context window without them invalidating the prompt prefix cache -->

turns out we can with a simple tool that returns other tools.

{{ include "content/includes/diagrams/tool-search/tool-search-progressive-disclosure.html" }}

here is how this looks in code

```typescript
const tools = [
  {
    name: "tools__search",
    description: "Search available tools",
    input_schema: {
      properties: { query: { type: "string" } },
    },
  },
  {
    name: "slack__thread_history",
    description: "Read a Slack thread",
    input_schema: {
      properties: {
        channel_id: { type: "string" },
        thread_ts: { type: "string" },
      },
    },
    defer_loading: true, // omit from the prompt prefix
  },
  // additional slack tools
];

await client.messages.create({
  tools,
  system,
  messages: [{
    role: "user",
    content: "Summarize this Slack thread: acme.slack.com/C123456/123456.7890",
  }],
});

const toolSearchResult = {
  type: "tool_result",
  tool_use_id: "toolu_123",
  content: [
    { type: "tool_reference", tool_name: "slack__thread_history" },
  ],
};
```

we still add the tools to the top level tools array. but this time we set `defer_loading: true` so that when the inference server converts our request into the chat template it doesn't generate the tokens for those tools.

it only generates them later when it sees `tool_reference` blocks in the tool result.

# can reuse the cache across sessions

since the `TOOLS` and `SYSTEM` blocks are identical we can now reuse the cache across sessions.

{{ include "content/includes/diagrams/tool-search/tool-search-cache-reuse.html" }}

# problem: search can return lots of results

the astute readers will have realized that fuzzy search is not guaranteed to return the right tool every time. it may return zero tools or it may return more than necessary. which means we are paying for tools that we aren't using again.

{{ include "content/includes/diagrams/tool-search/tool-search-many-results.html" }}

<!-- TODO lets look at the definition of progressive disclosure

and learn from [skills](need to make blog for this) -->

# solution: give exact names in system prompt and have model load by exact name

if we write the name of the tool (and optionally a short description) the model can use that exact name to load the specific tool it needs, when it needs it.

{{ include "content/includes/diagrams/tool-search/tool-search-exact-load.html" }}

# is tool search is all you need?

in theory the only tool the model needs all the time is the tool search tool.

however, tool search has a non-negligible cost: every time the model needs a tool for the first time requires a full round trip.

if you don't invalidate the kv cache this costs only on the order of the cache write input price for the size of your tool schema in tokens. however the main cost is latency, since it now takes two model requests to call the tool.

{{ include "content/includes/diagrams/tool-search/tool-search-skill-loading.html" }}

this is why _all_ harnesses have a small set of 'always on' tools that are in every session and can can be used at all times.

TODO: show this set for claude, codex, pi, opencode, etc (needs harness anatomy page)

<!-- # appendix

## this assumes tools don't change, get added, or removed

lmk if you want a post on how to add and remove tools without invalidating the kv cache

super nerd stuff

changing a tool's schema invalidates kv cache _both_ for direct and deferred tools that _were loaded_ in the context. since tool references only reference by name when ant replaces that ref with actual schema tokens are different and you get an invalidation

## innovations

allowing tool schemas to be anywhere in context (not in tool section)

hard parts: llm apis are stateless. clients like claude code need to maintain state -->
