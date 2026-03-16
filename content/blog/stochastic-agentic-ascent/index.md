---
title: stochastic agentic ascent
date: 2026-03-15
---

# stochastic agentic ascent

building software is starting to feel like training a neural network.

modern neural networks have [>1 Trillion](https://huggingface.co/moonshotai/Kimi-K2.5) parameters.
meanwhile, the largest neural network we fully understand has only [10,000 neurons](https://distill.pub/2020/circuits/). 

because of this we don't fully understand how a Large Language Models (LLM) predict the next token. but, as long as they do it accurately, we don't really care. instead we care that for any given input it gives us the expected output.

LLMs are black boxes. we grow them through the process of optimization.
using a tight optimization loop. software is starting to be grown the same way.

[agentic engineering](https://x.com/karpathy/status/2019137879310836075?lang=en) is like training a neural network. the code is the weights, your vibes are the objective function, and your coding agent is the optimizer trying to maximize your vibes one update step at a time. 

each of your prompt is new feedback telling the optimizer to take another step in program space. across a session, updates from previous turns accumulate [momentum](https://arxiv.org/abs/1412.6980).

software is quickly becoming a black box too. one that is updated at a speed that we cannot track, at a scale that we can no longer comprehend, and written in languages that we don't understand.

but for users and CEOs this is nothing new. software has always been black box for most of them. as long as the output matches their expectations, users don't care how it's computed. [CEOs](https://x.com/jack/status/2027129697092731343?lang=en) feel the same way, as long as the system predictably improves on [their objective function](https://en.wikipedia.org/wiki/Shareholder_value).

::: {=html}
<div style="margin:calc(var(--line-height) * 2) 0">
  <pre
    id="stochastic-agentic-ascent-kernel-scroll-screen"
    aria-label="scrollable ascii animation of full CUDA matmul kernel code changing across optimization steps"
    aria-live="off"
    tabindex="0"
    style="width:calc(round(down, 100%, 1ch)); height:calc(22 * var(--line-height)); margin:0; white-space:pre; overflow-x:auto; overflow-y:hidden"
  >(loading stochastic agentic ascent kernel...)</pre>
  <pre
    id="stochastic-agentic-ascent-chart-screen"
    aria-label="ascii chart of CUDA matmul GFLOPs per second across optimization steps"
    aria-live="off"
    style="width:calc(round(down, 100%, 1ch)); height:calc(20 * var(--line-height)); margin:var(--line-height) 0 0; white-space:pre; overflow-x:auto; overflow-y:hidden"
  >(loading stochastic agentic ascent chart...)</pre>
</div>
<script type="module" src="/src/blog/stochastic-agentic-ascent/animation.mjs"></script>
:::
