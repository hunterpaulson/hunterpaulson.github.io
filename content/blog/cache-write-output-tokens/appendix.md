
# stack

- caps vs lowercase

# why don't APIs already support this?

## Prefill-Decode disaggregation

the diagrams above make inference look pretty simple. and tbh it is on a single inference node. however apis require much more than a single node to serve all the traffic. this makes inference, and by extension managing KV cache, a distributed systems problem. 


so the diagrams above _lie_ to you, by omission, in two ways:

1. they imply that prefill that and decode are on the same inference instance.
1. other users requests are being computed in batches with yours and they arrive and complete at different times.
1. they hide the memory hierarchy.


to make things worse the KV cache is HUGE. and it needs to be moved into VRAM (HBM) before we can start generating tokens.


aside: why is prefill and decode disaggregated?
better to have prefill on a separate instance so it doesn't slow down decode of _other_ requests.

short answer is they have different gpu resource utilizations so it is better to have like with like.
slightly longer answer is because prefill is compute bound and decode is memory bound 

### bi-directional KV cache transfers

both vLLM and SGLang and [implemented](https://github.com/vllm-project/vllm/pull/32553) [this](https://github.com/sgl-project/sglang/pull/19746) in early May^[though it was [proposed](https://github.com/vllm-project/vllm/issues/32733) in January and took a couple months to get approved and merged]

## chatbots 



## why section

if i get more tokens for my $ and they come faster I may even buy more: jevons paradox

- proposed impl
    - is True proper json do people use strings?



# appendix

![Multi-turn prompt caching from [anthropic's prompt caching docs](https://code.claude.com/docs/en/prompt-caching#how-the-cache-is-organized)](/assets/blog/cache-creation-output-tokens/recomputed.png)

Notice the legend literally say 'New or _recomputed_' in the diagram. So they know that the kv cache for the Replys (assistant messages) are being recomputed.




## true cost of tokens




```
I_n = non-cached input tokens
I_r = cache read input tokens
I_w = cache write input tokens
O_n = non-cached output tokens
O_r = cache read output tokens
O_w = cache write output tokens

W = cache write input tokens
R = cache read input tokens
O = output tokens (not cached)

output + cache write input = real cost of output tokens
$50.00 + $12.50             = $62.50 

output + cache read input = theoretical cost of output tokens
$50.00 + $1.00            = $51.00 

real cost / theoretical cost = overpayment
$62.50 / $51.00 = 1.225      = 22.5% overpayment
```



### cache read

This is a naive estimate because it doesn't assumes cache read input tokens are free. which they are not

NOTE: this doesn't take into account the counterfactual where we should be paying 'cache read input' price instead. to see a full breakdown of the real cost of tokens see this section in the appendix.

```
Claude Fable 5: 
output + cache write input = real cost of output tokens
$50.00 + $1.00             = $51.00 / 1M tokens
                           
$51.00 / $50.00 = 1.02 => 2% more than advertized output price

GPT-5.6 Sol:
output + cache write input = real cost of output tokens
$30.00 + $0.50             = $30.50 / 1M tokens

$30.50 / $30.00 = 1.01667 => 1.67% more than advertized output price
```

This means you have to pay 2% of their original price to use those output tokens again. This is pretty reasonable.


## napkin math

<!-- Lets do some napkin math with current `claude-fable-5` prices to see how much 'agent tokens'[^ output tokens with tool calls] really cost.

Say you have [thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking) and [tools](https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools) turned on and Claude generates 1000 tokens in a single llm api response [^ realistic with a high thinking/reasoning [effort](https://platform.claude.com/docs/en/build-with-claude/effort) and tool calls].

Anthropic charges $50 for 1M output tokens so you pay `$50.00 * 1_000 / 1_000_000 = $0.05`. 5 cents for _just_ the output tokens for that request.

Then Claude Code executes the tools, appends the results to the context and calls the anthropic api again. 

The price for caching is [1.25x input price](https://platform.claude.com/docs/en/build-with-claude/prompt-caching#pricing) which is $10 per 1M for Fable 5 so you pay `$10 * 1.25 * 1_000 / 1_000_000 = $0.0125` so a little over 1 cent. 

That may not sound like much, but remember you already paid full output price for these tokens. 

you are essentially paying **25% more** for output tokens than advertized: -->

<!-- Instead you should be paying the cache read price `$10 * 0.1 * 1_000 / 1_000_000 = $0.001` which is less than 1/12th of the price of cache write. -->



### example implementation

```python
assistant_message = client.messages.create(
    max_tokens=1024,
    messages=[
        {
            "role": "system",
            "content": "You are a helpful assistant.",
            # cache system prompt so it can be reused across all users (if identical)
            "cache_control": {
                "type": "ephemeral",
            },
        },
        {
            "role": "user",
            "content": "what is in the KV cache?",
            # cache this message
            "cache_control": {
                "type": "ephemeral",
            },
        }
    ],
    model="claude-fable-5",

print(assistant_message.model_dump_json())
"""
{
  "content": "Key and Value vectors from every attention head for each token in the cached prefix"
  "usage": {
    "input_tokens": 2048,
    "cache_read_input_tokens": 1800,
    "cache_creation_input_tokens": 248,
    "output_tokens": 503,
  }
}
"""
```
<!-- todo use real api calls for this -->
<!-- where are the non-cached input tokens? -->

non_cached_input_tokens are your classic input tokens. charted at the stated input token price.

cache_read_input_tokens are your **cache hit**. charged at 0.1x input token price. (90% discount!)

cache_creation_input_tokens are your *cache write*. charged at 1.25x input token price. (25% tax for anthropic to store these for you for up to 5 minutes)

input_tokens = cache_read_input_tokens + cache_creation_input_tokens + non_cached_input_tokens

output_tokns = thinking tokens + assistant response tokens + tool call tokens



<!-- [^kv-prompt-prefix-cache]: the terminology is a bit confusing here. 
    during autoregressive token generation. the Key and Value (KV) vectors are generated, and cached in the KV cache, for _every_ input and output token.

    this is different from the 'cache' that the apis are referring to. between requests provier apis move the KV cache for the tokens you paid for out of HBM and into cheaper, and slower, storage (like DRAM or NAND) so they can free up HBM for others requests. -->


## why is this no longer sufficient? Agent Loops

tldr: agent loops

```
Request  1: [ System ] [ User ]
            |---cache WRITE---|
Response 1: [ System ] [ User ] [ Assistant + Tool Calls ]

Request  2: [ System ] [ User ] [ Assistant + Tool Calls ] [ Tool Results ]
            |---cache READ----| |--------------cache WRITE----------------|
Response 2: [ System ] [ User ] [ Assistant + Tool Calls ] [ Tool Results ] [ Assistant + Tool Calls ]
... 

Request  N: [ System ] [ User ] ... [ Tool Results ] [ Assistant + Tool Calls ] [ Tool Results ]
            |---cache READ-------------------------| |--------------cache WRITE----------------|
Response N: [ System ] [ User ] ... [ Tool Results ] [ Assistant + Tool Calls ] [ Tool Results ] [ Assistant ]
```



The agent when assistant doesn't call any tools (no tool calls with assistant message)

tldr every token should be cached for the next call.

