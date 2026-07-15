# What is a tool?

a function that can be called by a language model

technically the LLM does not execute the tool. it just requests execution of the tool. The harness parses this request, executes the correct function, and returns the result to the LLM.

tools allow language models to observe and take action in the real world.

They are one of the fundamental properties of an **agent**.

agent = llm + tools + prompt

however tools have a cost: both their definition and their results take up precious context.

longer contexts do not generate better responses

# types of tools

depends on where the tool is executed: on the client or on the server.
- tbh its all just APIs. the llm does not care

nvm it kinda does. as llms becomre more stateful and they have their own _workspaces_ the tool either edits their workspace or it edits some shared workspace.

## Application (local) tools

## MCP (remote) tools

These tools are remote in the sense that they are not built into the harness, but rather added by integration.

tools designed for _many_ types of agents


# innovations

## tool search

absolutely necessary

how it looks to the model

names of tools (and short summary if available) are shown to model so it knows what to search for 
- notice this is just like skills
- both are same pattern of [progressive disclosure]

result of tool search tool returns tool schema as a tool result

## tool result offloading

Tool result previews helps reduce the impact of large tool outputs that can noisily clutter the context window without providing useful information. The harness keeps the head and tail tokens of tool outputs above a threshold number of tokens and offloads the full output to the filesystem so the model can access it if needed.

## progress yeild await

instead of waiting forever for long running tools you send progress chunks to the model and give it a tool to read future chunks or the result in subsequent model requests.

when combined with things like sleep this lets the model 'babysit' a long running tool


## model context protocol

yes imo this is an innovation. however it is one that absolutely requires Tool Search.

this got a bad rap because it was invented before tool search but it is worth understanding the problem this solves.

it gives a standard interface for defining and _executing_ tools.
making it easy for people to build and/or bring their own tools to _any_ agent.

IMO even pi agent will add support for this now that they added tool search.