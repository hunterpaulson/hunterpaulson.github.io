

# caches

## KV cache: the active per-token state used during prefill/decode.


## Prompt/prefix cache: a retention and lookup policy around that same K/V state across requests.

can be stored in many places. when in HBM this is just the KV cache. but is often offloaded between requests to save memory







# inference stages

## cache lookup/restore

> 1. prefix-cache lookup / restore cached KV to HBM of GPU doing prefill/decode

> Modern serving adds a cache-read step before prefill: find the longest cached prefix, attach or restore those K/V blocks, then prefill only the uncached suffix.

## prefill

> 2. prefill only the new suffix

Prefill’s job is not “generate all prompt tokens.” The prompt tokens are already known. Prefill is the parallel forward pass over the known input tokens that:

1. computes the K/V state for those input positions;
2. computes the hidden state/logits at the final input position;
3. samples or selects the first output token.


## decode

> 3. decode output tokens

## cache retain

> 4. optionally retain generated KV for future requests
