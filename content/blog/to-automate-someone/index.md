---
title: you won't be replaced when AI is better than you
listed: false
noindex: true
date: 2026-02-20
---

<!-- # You won't be replaced by AI alone -->
<!-- # You won't be replaced when AI is better than you -->
<!-- # You aren't competing against AI alone -->
# Replacement is a 2v1 not a 1v1

Instead you will be replaced when AI outcompetes you paired with another AI.
<!-- subtitle -->

> To automate someone you need to outcompete the pairing of a human with the tool too
> [Nathan Lambert](https://open.substack.com/pub/robotic/p/thoughts-on-the-curve?selection=1f429e92-c74d-4e10-805c-0db6b964a90b)


I’ve heard many people say AGI will be a “drop in remote worker”

<!-- source? -->

I believe it will look more like human + better and better tool working, literally pair programming, together.

even when llms reach 95%+ win rate on GDPval I believe we won’t see a [white collar blood bath](link to dariq quote)


The remote labor index claims to be: "Measuring AI Automation of Remote Work".


## benchmarks results are not indicators of replacement potential

which one uses automation rate? explain that this is a misleading term.

state of the art models are currenlty at about 5% automation on the [Remote Labor Index](https://www.remotelabor.ai/).

The remote labor index is pretty cool. similar to [GDPval](https://evals.openai.com/gdpval/leaderboard).

These benchmarks are valuable but I don’t they either is a great indicator of labor automation. both compare an *unaided* human to a *fully autonomous* LLM harness. Your day-to-day work work with these tools should make it obvious that this is an unrealistic comparison.


these benchmarks will be come the ‘hill to climb’ so to speak for Frontier labs over the next couple years. I expect to see new model and product releases flex their perf on these evals. As they start to saturate I am sure someone will create a ‘human + tool’ version of these as well. and the cycle will repeat.

models continuously improve on anything we can concretely evaluate.

soon they will be consistently winning against (unaided) humans on these benchmarks. but we won't see any evidence of replacement in the gdp numbers. because these benchmarks do not measure replacement. they are supposed to measure ability to create economic value (source?). 

it will be difficult to create a human + tool version of these benchmarks because it is a moving target. as models improve the tools will, by definition, improve as well. 

[^ ] both of these are great benchmarks that will lead to real progress. I am just arguing that scores on them can be misleading when taken out of context.





Our emotions make us compare ourselves to ai alone. apples to apples. this is the wrong framing. instead we should compare our aggregate output with ai to ai alone.


<!-- REFRAME -->

<!-- I understand if this is unintuitive. I struggle with this 'absolute advantage' thinking too. it is easy to compare myself, unaided, to llms on competitive programming since in that environment it is cheating to use LLMs. but at work I am allowed to pair with the tool and so my output is much greater -->

it has been human + tool for many OOMs of compute.

human + abacus
human + slide rule
human + punch cards
human + calculator
human + terminal
human + compiler
human + ide (e.g. spreadsheet, word processor)
<!-- human + git -->
<!-- human + linter -->
<!-- human + auto scaling / k8 / slurm -->
human + autocomplete
human + cursor tab
human + claude code

<!-- TODO: this may be a cool place to use one of my bar chart race animations -->

## inherent advantages of you paired with AI

<!-- should this be before or after comparative advantage?  -->


human verbs:
accountability
continual learning
generalizes to unknown unknowns (global generalization)
human touch (some people want to interact with another human)

both:
taste
goals
generator
verifier

AI:
scalable
breadth of knowledge
tireless (some word(s) to elicit that ai never sleeps)
patience (never gives up or gets frustrated, maybe perpetual?)
(willing to do any task no matter how mundane)
(does not compete for status)

<figure>
<pre>
    ┌────────────────────────────────────┐
    │ HUMAN                              │
    │                                    │
    │  accountability        ┌───────────┼───────────────────────┐
    │  human touch           │           │                    AI │
    │  global generalization | taste     │                       │
    │  countinual learning   │ goals     │  scalable             │
    │                        │ generator │  breadth of knowledge │
    │                        │ verifier  │  indefatigable        │
    │                        │           │  high-throughput      │
    └────────────────────────┼───────────┘  egoless              │
                             │                                   │
                             └───────────────────────────────────┘
</pre>
<figcaption><code>HUMAN ∪ AI > AI</code></figcaption>
</figure>
<!-- the tense(?) of these don't all match -->


or _humans make ai better_ and will for the forseeable future

### accountability

> A computer can never be held accountable. Therefore, a computer must never make a management decision.
>-[1979 IBM](https://x.com/bumblebike/status/832394003492564993)

- what recourse do you have when [claude truncates your production table]





our society will eventually find ways to "hold machines responsible"<sup>[^1]</sup> for the actions they take. but these things won’t come until after broad deployment and subsequent landmark social and legal events. <!-- looking for better word than events here -->

[^1]: likely either the company that operates them or the company that provides the intelligence (tokens if you will) for them.

human + ai allows providers to have the human shoulder the blame even as these tools far surpass the capabilities of the individual they are paired with

> management is not just about making good decisions. It’s about being accountable for the decisions you make, good or bad... An engineer is not just someone who writes good code. They’re somebody who can be trusted: specifically, someone who non-technical executives can trust to answer technical questions and deliver technical projects.
> -[Sean Goedecke](https://www.seangoedecke.com/what-llms-cant-do/)

human must be “in the loop” for some actions. 
many important business and political decisions are done remotely. do you really think the general population wants every one of these to be made by a computer. in fact it we will likely find public opinion favor the opposite. capitalist pressures will drive automation decisions despite sociopolitical pressure

waymo and tesla are both still human + tool
maybe this is a good counter example that I need to be ready for.
computers have flown planes for [a while](link to source of first time) but we do not let them [takeoff](source, ai takeoff joke?) or land.

I believe that that very (emotionally) important actions <!-- high risk to reward ratio-->, like landing a plane or a medical diagnosis, will still require a human to bear responsibility. Regardless of how much of the actual ‘work’ they do.

We saw this with the fatal Uber self driving car accident. a lot of the blame was directed at the human driver not the system.

### continual learning

humans already are continual learners. until [continual learning] is solved, or [becomes a non-issue], humans will continually learn how to get more and more out of their artificial teammates.

why not take advantage of the current reference class of continual learners

### unknown unknowns (global generalization)

better coverage of failure modes

humans can fill the gaps to handle the [long tail] of failure modes. we generalize surprisingly well to unknown unknowns.

while models exhibit local generalization in environments similar to what they experience during training we are yet to see [global generalization](link to dwarkesh ilya interview and other local generalization research).

Labs are betting that . Even if this is true it will take a long time (literally long time horizon)
until we do rl on [every job](link to dario interview quote about how pretraining didnt generalize until you trained on everything and how that is their plan with rl, to train on every job)  

### sample efficiency

While LLMs are sample efficient [in context](link to gemini example where they put low resource language in context and it was able to translate it) they need [number with source] examples during [training](link to openai gpt4.5 podcast where they talk about data efficiency) to learn.


### generator verifier gap 

It is easier to verify the output than to generate it. Humans are good verifiers, leaders have been doing this for years and economics tells us they create more value because they get paid more for verification than we do for generation.
<!-- this sounds way too spiteful  -->

You can verify more than you can generate.

### human touch

Sometimes people want just to interact with another human. Teachers, coaches, customer service, all benefit from intangible human interaction.

One big piece of this is the ability to _maintain relationships_. 

Current models are ephemeral in many ways that make it hard for them to build, long horizon, multi-year relationships<sup>footnote here<sup>.

Even in current harnesses. each new conversation the model must [come up to speed](https://pashpashpash.substack.com/i/188846616/technical-retrospective). 

With new models coming out every day we will see more and more of this.



[^ ] You could argue GPT-4o as a counter point here. but market incentives that led openai to deprecate it will continue. It doesnt make sense for providers to serve old models for a human lifetime.

## examples
### radiology
https://worksinprogress.co/issue/the-algorithm-will-see-you-now/

To replace me as a coder your coding tool needs to be better than me using (overseeing) the coding tool.




## economics

### ABSOLUTE ADVANTAGE

you have an absolute advantage when you create more value, for the same cost, than ai alone.

<pre><code>value(you alone) - cost(you) <strong>&gt;</strong> value(ai alone) - cost(ai)

cost(you) = cost(ai) => value(you alone) > value(ai alone)
</code></pre>

Replacement would never happen at this stage. But excess value will be created as it has for many OOMs of compute.

This is the 

<figure>
<pre>
          ┌──────────────────────────────────────────────────┐
you alone │██████████                                        │
          │                                                  │
 ai alone │░░░░░                                             │
          └──────────────────────────────────────────────────┘
           value created ->

</pre>
<figcaption>_Absolute_ advantage: you create more value for the same cost</figcaption>
</figure>
<!-- REVIEW: should I do capitalization in figure for emphasis and because I hope they are screen shot? -->



using dario's 20% speedup numbers from podcast. 20% of 15 = 3?
<!-- even if it make your output a little lower. -->
notice ai alone is worse that ai when it has you. you unhobble ai making it even better. 

When you interrupt claude to stop them from going down the [wrong path](link to experienced users interrupt more).

This will continue to be true for some time...

but eventually ai alone will surpass the value you could create alone. this doesn't mean you will be replaced. instead you may be making even more money because you are creating more value than ever before.

but you still make ai better than if it was alone and on top of that ai + you are adding value to way out competes AI alone


<figure>
<pre>
          ┌──────────────────────────────────────────────────┐
you alone │██████████                                        │
          │                                                  │
 ai alone │░░░░░░░░░░░░                                      │
          └──────────────────────────────────────────────────┘
           value created ->
</pre>
<figcaption>AI has an absolute advantage over you _alone_</figcaption>
</figure>

you no longer have an absolute advantage when ai creates more value for the same cost: 

<pre><code>value(you alone) - cost(you) <strong>&lt;</strong> value(ai alone) - cost(ai)

cost(you) = cost(ai) => value(you alone) <strong>&lt;</strong> value(ai alone)</code></pre>

even in this future it is unlikely that you will be replaced...

### COMPARATIVE ADVANTAGE

> labor substitution is about comparative advantage, not absolute advantage. The question isn’t whether AI can do specific tasks that humans do. It’s whether the aggregate output of humans working with AI is inferior to what AI can produce alone: in other words, whether there is any way that the addition of a human to the production process can increase or improve the output of that process. That’s a very different question. AI can have an absolute advantage in every single task, but it would still make economic sense to combine AI with humans if the aggregate output is greater: that is to say, if humans have a comparative advantage in any step of the production process.
>-[David Oks](https://open.substack.com/pub/davidoks/p/why-im-not-worried-about-ai-job-loss?r=40r1cd&selection=5792c7cf-fde3-406a-b1b9-4be976a630d1)

> When a technology automates some of what a human does within an existing paradigm, even the vast majority of what a human does within it, it’s quite rare for it to actually get rid of the human, because the definition of the paradigm around human-shaped roles creates all sorts of bottlenecks and frictions that demand human involvement. It’s only when we see the construction of entirely new paradigms that the full power of a technology can be realized.
>-[David Oks](https://open.substack.com/pub/davidoks/p/why-the-atm-didnt-kill-bank-teller?r=40r1cd&selection=50505125-f441-44d5-862c-e42b17cc8420)


<figure>
<pre>
LEGEND
█: value created by you
░: value created by ai
+: excess value created by your combination with ai
-: dyssenergy 

          ┌──────────────────────────────────────────────────┐
you alone │██████████                                        │
          │                                                  │
 ai alone │░░░░░░░░░░░░                                      │
          │                                                  │
 ai + you │░░░░░░░░░░░░██████████+++                         │
          └──────────────────────────────────────────────────┘
           value created ->
</pre>
<figcaption>_Comparative_ but not absolute advantage: you create _excess value_ when paired with ai</figcaption>
</figure>

however you still have a comparative advantage paired with ai, as long as you create excess value.


[^ ] note that the 3rd bar is the the sum of the first two bars in terms of input. so companies will pay more. 
here is great part for the AI compute per oai researcher data point: (oai is 12 m gpu capex per researcher on average)
cost per head will increase but productivity (output per unit of input) will increase as well. making extra cost worth it.

<!-- ```
excess value = value(ai + you) - value(ai alone) - value(you alone)
```
 -->

<pre><code>value(ai + you) - cost(you) <strong>&gt;</strong> value(ai alone)</code></pre>







aside about agi definitions:

by some people's definitions this is clearly AGI.
capable of creating more economic value for the same cost. 

capable of doing all remote work and and having a meaningful impact / speedup on gdp since the size of the labor force is now proportional to the amount of compute.

but you will still have a job and be making more money than ever. as long as they create excess value for the same cost.

the bitter lesson tells us that those who win are the ones who best take advantage of the available compute.


the question we should be asking is: _does ai alone improve at a faster pace than ai assisted by an expert human?_

### Possible Futures

#### excess value stays the same

<!-- complex things like this almost never stay still should I include this one? -->

<figure>
<pre>
          ┌──────────────────────────────────────────────────┐
you alone │██████████                                        │
          │                                                  │
 ai alone │░░░░░░░░░░░░░░░░░░░░░░░░░░░░                      │
          │                                                  │
 ai + you │░░░░░░░░░░░░░░░░░░░░░░░░░░░░██████████+++         │
          └──────────────────────────────────────────────────┘
           value created ->
</pre>
<figcaption>Comparative advantage is _constant_</figcaption>
</figure>

the excess value you create is constant relative to your cost.

#### excess value compounds

In the best possible scenario, assisted productivity increases at a faster pace than unassisted ai. 

<figure>
<pre>
          ┌──────────────────────────────────────────────────┐
you alone │██████████                                        │
          │                                                  │
 ai alone │░░░░░░░░░░░░░░░░░░░░░░░░░░░░                      │
          │                                                  │
 ai + you │░░░░░░░░░░░░░░░░░░░░░░░░░░░░██████████++++++++++++│
          └──────────────────────────────────────────────────┘
           value created ->
</pre>
<figcaption>Comparative advantage _compounds_</figcaption>
</figure>


> The faster that AI capabilities advance, of course, the quicker we’ll tend to see complementarity diminish: I don’t think that the cyborg era is necessarily a permanent one. The world where human complementarity disappears entirely isn’t a realistic one: it’s a corner solution where AI is so superior at every conceivable task, under every conceivable condition, that there is literally nothing a human could do to improve any production process anywhere. That’s not a realistic scenario. It’s not hard to imagine that we move closer to such a world in an asymptotic way, approaching but never reaching. But serious human complementarity with AI will last much longer than people today seem to think.
> -David Oks

#### asymptote: excess value decays


todo how do I show this


#### phase change: excess value becomes negative

If ai alone increases productivity at a faster pace than ai assisted by an expert human then, in the limit, the expert will be replaced. 

<figure>
<pre>
          ┌──────────────────────────────────────────────────┐
you alone │██████████                                        │
          │                                                  │
 ai alone │░░░░░░░░░░░░░░░░░░░░░░░░░░░░                      │
          │                       -----                      │
 ai + you │░░░░░░░░░░░░░░░░░░░░░░░██████████                 │
          └──────────────────────────────────────────────────┘
           value created ->
</pre>
<figcaption>Combined you are less productive (create less output per unit of input) than ai alone. You no longer have a comparative advantage.</figcaption>
</figure>

replaced, but only because coordination costs exceed your contribution — you are actively making the system worse


### cases where replacement happens earlier

#### wages are sticky

If wages are sticky (and they are — people stay overpaid or underpaid for years due to contracts, inertia, negotiation asymmetry), then replacement can happen without negative synergy. You just need `value(you) + excess < cost(you)` where cost(you) is inflated above your true standalone value. This is actually the more realistic near-term threat for some roles. but that some people are overpaid relative to what they contribute.

#### skills atrophy

If `value(you alone)` shrinks over time because you've been leaning on AI and your standalone skills have degraded, then the efficient market recalibrates downward. Your salary drops, or you get replaced not because of negative synergy but because your baseline has collapsed.






## implications

how many tokens is your salary (TCO benefits + recruiting + etc) [worth](https://nonint.com/2024/01/06/go-rulesofthumb/)?

remember you are comparing your value + tokens your company is willing to spend on you. (oai is 12 m gpu capex per researcher on average)
would an extra xk tokens replace you?

cost of equally intelligent tokens is falling exponentially. 

soon the AI value bars are going to get bigger and bigger and making yours relatively small


the classic addage holds true. "you wont lose your job to AI. but to someone else using AI better than you."


_not having comparative advantage_ doesn't mean you have cannot make any money.

even without comparative advantage you can still create value.


like as long as ai + you creates more total value than any amount of ai alone. we will also have a job.

we clearly are willing to pay more for slightly more intelligence.

once a new model version comes out I can hardly stand to use the version that I was blown away by a few months ago.

these are things like the 'human touch', ...


the main takeaway: ensure ai compounds your value or you compound ai's value.
you need to be a [compute multiplier](https://nonint.com/2023/11/05/compute-multipliers/). 

you and AI must combine to be greater than the sum of your parts.
create value greator than the sum of your factors.



This point will be different for every person. It depends both on how much you unhobble ai relative to how much you hobble it.


once AI is better than you (alone) don't slow the ai down! (shrink the `ai +` bar relative to the `ai alone` bar). do not become [the bottleneck](https://x.com/thorstenball/status/2022310010391302259?ct=rw-null). do not get in the way. 
pipe someone elses agent output directly into yours (safely). no tickets or process. our jobs becomes removing hurdles and getting out of their way.

our job is to unhobbling these agents. unblock them. help them reach their true potential. answer their questions. just like good leaders do with us today





<!-- ending quote? -->

> "We always overestimate the change that will occur in the next two years and underestimate the change that will occur in the next ten."
> -Bill Gates











# review

send to david oks for feedback on economics parts



# archive

## predictions

or _humans make ai better_ and will for the forseeable future

### trends continue (wow what a hot take)

it has been human + tool for many OOMs of compute.

human + compiler
human + ide (excel, word processor)
human + linter
human + ci cd
human + auto scaling / k8 / slurm
human + autocomplete
human + cursor tab
human + claude code

if a trend has been true over meant OOMs expect it to still be true

we see this in art
human 
and
human + ai 
both outcompete just ai
**outcompete** here means _comparative advantage_ so you just have to win on cost-performance

people worried about AI taking their jobs are really worried about someone else using AI to create better art than them.


### companies invest more in harnesses

this is where the value extraction is. so this is where the money is.

aside: one cool side effect of the harness company (manus) being the best at this is that I think we will see a larger focus from these companies on building a good harness to extract maximum performance from their models. we already are seeing the start of this with investments in claude code and codex from anthropic and openai respectively.

this is a clear hint that there are still many more gains to come from [unhobbling] the models by putting them in better harnesses.
just like compute, data, algorithms, 
the harness is one of the 4 horsemen of smooth improvements.


### claude code will change its defaults

> Instead of always asking for permission, by default claude will decide when to prompt the user.

we already see that 20% of users do this right away and this number [rises to >50%](https://www.anthropic.com/research/measuring-agent-autonomy) as users gain experience with the tool. 
It would be silly to expect this to stop.


[^ ] btw I can totally understand why anthropic started thisi way. they were first. its in their culture. and it actually improved performance when models were worse since users could identify and correct incorrect actions before they occurred.


this will probably start by them adding as something you can shift tab to to get to without the extra flag. but will have a warning the first time you use it.

every second while the gpus aren’t hot (not generating tokens for you) is a waste of time. while you are distracted scrolling twitter or in another tmux window.

There is nothing worse than coming back


models will get smarter at knowing when to escalate.
- we see hints of this with he popularity of claude’s “AskUserQuestion” feature. link to tariq tweet
sandboxes will improve 


### notifications will improve

You will get notifications on your phone when claude has a question for you and needs your input. You will be able to select from multiple proposed options from your lock screen without even opening any app or returning to your computer.

This is all part of a larger shift we will see from _us prompting claude_, to **claude prompting us**.

### claude will explicitly ask you to do tasks

claude harness will improve to add tasks
