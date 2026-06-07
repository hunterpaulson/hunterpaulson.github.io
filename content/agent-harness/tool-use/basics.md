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

## Application (local) tools

## MCP (remote) tools

These tools are remote in the sense that they are not built into the harness, but rather added by integration.

tools designed for _many_ types of agents


# innovations

## tool search


## tool result previews

Tool result previews helps reduce the impact of large tool outputs that can noisily clutter the context window without providing useful information. The harness keeps the head and tail tokens of tool outputs above a threshold number of tokens and offloads the full output to the filesystem so the model can access it if needed.