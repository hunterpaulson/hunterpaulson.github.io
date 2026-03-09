---
title: just another abstraction
date: 2026-03-08
---

# just another abstraction

in the beginning we wrote machine code: raw binary instructions fed directly to the cpu.

assembly was the first abstraction. it gave us a set of human-readable cpu instructions that **assemblers** convert into machine code. we still managed every register, memory address, and clock cycle.

then came compiled languages like c and fortran, allowing us to write something that looked like math and logic while a **compiler** translates it down to assembly for us. we no longer thought about opcodes or registers but we still manually allocated and freed memory.

soon enough higher-level languages, like java and python, took that off our plate too. **garbage collectors** manage memory, we just had to write and run the code.

now even that is handled for us. **coding agents** compile intent into running software. we no longer need to memorize libraries, functions, or syntax.

[the _only_ programming language is natural language](https://x.com/karpathy/status/1617979122625712128). another layer of tooling has arrived and taken over more of the minutiae, giving us more time to think about which problems to solve. 

::: {=html}
<div aria-label="edit distance abstraction animation" style="margin:calc(var(--line-height) * 2) 0">
  <pre
    id="abstraction-screen"
    aria-live="off"
    tabindex="0"
    style="width:calc(round(down, 100%, 1ch)); height:calc(30 * var(--line-height)); margin:0; white-space:pre; overflow-x:auto; overflow-y:hidden; border:var(--border-thickness) solid var(--text-color)"
  >(loading abstraction...)</pre>
  <label style="width:auto; margin-top:var(--line-height)"><input type="checkbox" id="abstraction-reverse" /> reverse direction</label>
</div>
<script type="module" src="/src/abstraction_animation.mjs"></script>
:::
