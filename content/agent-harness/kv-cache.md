
# kv cache

But the K/V for that first generated token is not computed during prefill.
The timeline is roughly:
```
prompt tokens: [system][user][assistant-start]

prefill:
  compute K/V for prompt tokens
  compute logits for next token
  sample assistant token #1

decode step 1:
  feed assistant token #1
  compute K/V for assistant token #1
  compute logits for assistant token #2
  sample assistant token #2

decode step 2:
  feed assistant token #2
  compute K/V for assistant token #2
  compute logits for assistant token #3
```

```
[system] = <system> ... </system> = <|im_start|>SYSTEM<|im_sep|> ... <|im_end|>
[user] = <user> ... </user> = <|im_start|>USER<|im_sep|> ... <|im_end|>
[assistant] = <assistant> ... </assistant> = <|im_start|>ASSISTATN<|im_sep|> ... <|im_end|>
[assistant-start] = <assistant> = <|im_start|>ASSISTATN<|im_sep|> 
```

## prompt prefix cache