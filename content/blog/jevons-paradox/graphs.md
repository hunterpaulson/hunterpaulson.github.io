---
title: jevons graph scratchpad
---

# jevons graph scratchpad

working vocabulary:

- input resource: the underlying thing being used more efficiently, like coal, fuel, watts, or compute.
- service: the thing buyers actually experience, like travel, heat, work, or intelligence.
- efficiency: service per unit of input resource.
- effective price: input-resource cost per unit of service.

if efficiency rises, effective price falls. the rebound question is how far service quantity moves in response.

<figure class="mono-chart" style="--chart-cols: 48; --chart-rows: 18; --mono-chart-pad-left: 7; --mono-chart-pad-right: 13; --mono-chart-pad-top: 2; --mono-chart-pad-bottom: 4;" aria-label="efficiency shock drawn as a supply shift">
<div class="mono-chart__canvas" data-x-min="0" data-x-max="100" data-y-min="0" data-y-max="100">
<span class="mono-chart__axis mono-chart__axis--x" data-label="service quantity" data-label-col="31" data-label-row="20"></span>
<span class="mono-chart__axis mono-chart__axis--y" data-orientation="y" data-label="effective price" data-label-col="-7" data-label-row="-1"></span>
<span class="mono-chart__series mono-chart__series--warm" data-points="18,82;82,18" data-label="demand" data-label-col="39" data-label-row="15"></span>
<span class="mono-chart__series mono-chart__series--accent" data-points="18,18;82,82" data-label="old supply" data-label-col="32" data-label-row="2"></span>
<span class="mono-chart__series mono-chart__series--accent" data-points="36,11;96,71" data-label="new supply" data-label-col="36" data-label-row="6"></span>
<span class="mono-chart__arrow mono-chart__arrow--accent" data-from="57,67" data-to="73,55"></span>
<span class="mono-chart__guide" data-from="0,50" data-to="50,50" data-label="P0" data-label-col="-1" data-label-row="9" data-label-align="end"></span>
<span class="mono-chart__guide" data-from="50,0" data-to="50,50" data-label="Q0" data-label-col="23" data-label-row="19"></span>
<span class="mono-chart__guide" data-from="0,37.5" data-to="62.5,37.5" data-label="P1" data-label-col="-1" data-label-row="11" data-label-align="end"></span>
<span class="mono-chart__guide" data-from="62.5,0" data-to="62.5,37.5" data-label="Q1" data-label-col="30" data-label-row="19"></span>
<span class="mono-chart__point" data-x="50" data-y="50" data-label="E0" data-label-col="25" data-label-row="8"></span>
<span class="mono-chart__point mono-chart__point--accent" data-x="62.5" data-y="37.5" data-label="E1" data-label-col="32" data-label-row="10"></span>
</div>
<figcaption>an efficiency improvement looks like more service can be supplied at the same input-resource cost.</figcaption>
</figure>

## coal rebound walkthrough

I think the cleanest rebound section wants four panels. The first panel gives the baseline. The second shows the efficiency improvement as a supply shift. The third isolates the price fall. The fourth isolates the movement along the demand curve.

small language note: the demand curve does not shift in this story. lower price increases **quantity demanded** by moving along the same demand curve.

animated version:

<div id="coal-rebound-animation" class="mono-graph-animation" data-interval="1600">
<figure class="mono-chart mono-graph-animation__frame" style="--chart-cols: 48; --chart-rows: 16; --mono-chart-pad-left: 7; --mono-chart-pad-right: 14; --mono-chart-pad-top: 2; --mono-chart-pad-bottom: 5;" aria-label="coal rebound animation stage one baseline energy market">
<div class="mono-chart__canvas" data-x-min="0" data-x-max="20" data-y-min="0" data-y-max="100">
<span class="mono-chart__axis mono-chart__axis--x" data-label="energy quantity" data-label-col="17" data-label-row="19"></span>
<span class="mono-chart__axis mono-chart__axis--y" data-orientation="y" data-label="energy price" data-label-col="-7" data-label-row="-1"></span>
<span class="mono-chart__series mono-chart__series--accent" data-points="2.5,0;15,100" data-label="S0 supply" data-label-col="37" data-label-row="0"></span>
<span class="mono-chart__series mono-chart__series--warm" data-points="5,100;17.5,0" data-label="demand" data-label-col="14" data-label-row="0"></span>
<span class="mono-chart__guide" data-from="0,60" data-to="10,60" data-label="P0" data-label-col="-1" data-label-row="6" data-label-align="end"></span>
<span class="mono-chart__guide" data-from="10,0" data-to="10,60" data-label="Q0" data-label-col="23" data-label-row="17"></span>
<span class="mono-chart__point" data-x="10" data-y="60" data-label="E0" data-label-col="25" data-label-row="6"></span>
</div>
<figcaption>stage 1: old coal technology produces energy at equilibrium E0.</figcaption>
</figure>

<figure class="mono-chart mono-graph-animation__frame" style="--chart-cols: 48; --chart-rows: 16; --mono-chart-pad-left: 7; --mono-chart-pad-right: 14; --mono-chart-pad-top: 2; --mono-chart-pad-bottom: 5;" aria-label="coal rebound animation stage two efficiency shifts supply down and right">
<div class="mono-chart__canvas" data-x-min="0" data-x-max="20" data-y-min="0" data-y-max="100">
<span class="mono-chart__axis mono-chart__axis--x" data-label="energy quantity" data-label-col="17" data-label-row="19"></span>
<span class="mono-chart__axis mono-chart__axis--y" data-orientation="y" data-label="energy price" data-label-col="-7" data-label-row="-1"></span>
<span class="mono-chart__series mono-chart__series--muted" data-points="2.5,0;15,100" data-label="S0 supply" data-label-col="37" data-label-row="0"></span>
<span class="mono-chart__series mono-chart__series--accent" data-points="7.5,0;20,100" data-label="S1 supply" data-label-col="49" data-label-row="0"></span>
<span class="mono-chart__series mono-chart__series--warm" data-points="5,100;17.5,0" data-label="demand" data-label-col="14" data-label-row="0"></span>
<span class="mono-chart__arrow mono-chart__arrow--accent" data-from="12,76" data-to="14.5,56"></span>
<span class="mono-chart__guide" data-from="0,60" data-to="10,60" data-label="P0" data-label-col="-1" data-label-row="6" data-label-align="end"></span>
<span class="mono-chart__guide" data-from="10,0" data-to="10,60" data-label="Q0" data-label-col="23" data-label-row="17"></span>
<span class="mono-chart__point" data-x="10" data-y="60" data-label="E0" data-label-col="25" data-label-row="6"></span>
</div>
<figcaption>stage 2: the same coal input can supply more energy, so supply shifts down and right.</figcaption>
</figure>

<figure class="mono-chart mono-graph-animation__frame" style="--chart-cols: 48; --chart-rows: 16; --mono-chart-pad-left: 7; --mono-chart-pad-right: 14; --mono-chart-pad-top: 2; --mono-chart-pad-bottom: 5;" aria-label="coal rebound animation stage three energy price falls">
<div class="mono-chart__canvas" data-x-min="0" data-x-max="20" data-y-min="0" data-y-max="100">
<span class="mono-chart__axis mono-chart__axis--x" data-label="energy quantity" data-label-col="17" data-label-row="19"></span>
<span class="mono-chart__axis mono-chart__axis--y" data-orientation="y" data-label="energy price" data-label-col="-7" data-label-row="-1"></span>
<span class="mono-chart__series mono-chart__series--muted" data-points="2.5,0;15,100" data-label="S0" data-label-col="37" data-label-row="0"></span>
<span class="mono-chart__series mono-chart__series--accent" data-points="7.5,0;20,100" data-label="S1" data-label-col="49" data-label-row="0"></span>
<span class="mono-chart__series mono-chart__series--warm" data-points="5,100;17.5,0" data-label="demand" data-label-col="14" data-label-row="0"></span>
<span class="mono-chart__guide" data-from="0,60" data-to="10,60" data-label="P0" data-label-col="-1" data-label-row="6" data-label-align="end"></span>
<span class="mono-chart__guide" data-from="10,0" data-to="10,60" data-label="Q0" data-label-col="23" data-label-row="17"></span>
<span class="mono-chart__guide" data-from="0,40" data-to="12.5,40" data-label="P1" data-label-col="-1" data-label-row="10" data-label-align="end"></span>
<span class="mono-chart__guide" data-from="12.5,0" data-to="12.5,40" data-label="Q1" data-label-col="29" data-label-row="17"></span>
<span class="mono-chart__arrow mono-chart__arrow--accent" data-from="1.1,60" data-to="1.1,40"></span>
<span class="mono-chart__point mono-chart__point--muted" data-x="10" data-y="60" data-label="E0" data-label-col="25" data-label-row="6"></span>
<span class="mono-chart__point mono-chart__point--accent" data-x="12.5" data-y="40" data-label="E1" data-label-col="31" data-label-row="9"></span>
</div>
<figcaption>stage 3: the new equilibrium has a lower energy price.</figcaption>
</figure>

<figure class="mono-chart mono-graph-animation__frame" style="--chart-cols: 48; --chart-rows: 16; --mono-chart-pad-left: 7; --mono-chart-pad-right: 14; --mono-chart-pad-top: 2; --mono-chart-pad-bottom: 5;" aria-label="coal rebound animation stage four energy quantity rises">
<div class="mono-chart__canvas" data-x-min="0" data-x-max="20" data-y-min="0" data-y-max="100">
<span class="mono-chart__axis mono-chart__axis--x" data-label="energy quantity" data-label-col="17" data-label-row="19"></span>
<span class="mono-chart__axis mono-chart__axis--y" data-orientation="y" data-label="energy price" data-label-col="-7" data-label-row="-1"></span>
<span class="mono-chart__series mono-chart__series--muted" data-points="2.5,0;15,100" data-label="S0" data-label-col="37" data-label-row="0"></span>
<span class="mono-chart__series mono-chart__series--accent" data-points="7.5,0;20,100" data-label="S1" data-label-col="49" data-label-row="0"></span>
<span class="mono-chart__series mono-chart__series--warm" data-points="5,100;17.5,0" data-label="demand" data-label-col="14" data-label-row="0"></span>
<span class="mono-chart__guide" data-from="0,60" data-to="10,60" data-label="P0" data-label-col="-1" data-label-row="6" data-label-align="end"></span>
<span class="mono-chart__guide" data-from="10,0" data-to="10,60" data-label="Q0" data-label-col="23" data-label-row="17"></span>
<span class="mono-chart__guide" data-from="0,40" data-to="12.5,40" data-label="P1" data-label-col="-1" data-label-row="10" data-label-align="end"></span>
<span class="mono-chart__guide" data-from="12.5,0" data-to="12.5,40" data-label="Q1" data-label-col="29" data-label-row="17"></span>
<span class="mono-chart__arrow mono-chart__arrow--accent" data-from="10,8" data-to="12.5,8"></span>
<span class="mono-chart__label mono-chart__label--accent" data-col="25" data-row="13">rebound</span>
<span class="mono-chart__point mono-chart__point--muted" data-x="10" data-y="60" data-label="E0" data-label-col="25" data-label-row="6"></span>
<span class="mono-chart__point mono-chart__point--accent" data-x="12.5" data-y="40" data-label="E1" data-label-col="31" data-label-row="9"></span>
</div>
<figcaption>stage 4: cheaper energy raises quantity demanded. with a 25% efficiency gain, Q1 = 1.25 * Q0 is exactly 100% rebound.</figcaption>
</figure>
</div>

static panels:

<figure class="mono-chart" style="--chart-cols: 48; --chart-rows: 16; --mono-chart-pad-left: 7; --mono-chart-pad-right: 14; --mono-chart-pad-top: 2; --mono-chart-pad-bottom: 5;" aria-label="coal rebound stage one baseline energy market">
<div class="mono-chart__canvas" data-x-min="0" data-x-max="20" data-y-min="0" data-y-max="100">
<span class="mono-chart__axis mono-chart__axis--x" data-label="energy quantity" data-label-col="17" data-label-row="19"></span>
<span class="mono-chart__axis mono-chart__axis--y" data-orientation="y" data-label="energy price" data-label-col="-7" data-label-row="-1"></span>
<span class="mono-chart__series mono-chart__series--accent" data-points="2.5,0;15,100" data-label="S0 supply" data-label-col="37" data-label-row="0"></span>
<span class="mono-chart__series mono-chart__series--warm" data-points="5,100;17.5,0" data-label="demand" data-label-col="14" data-label-row="0"></span>
<span class="mono-chart__guide" data-from="0,60" data-to="10,60" data-label="P0" data-label-col="-1" data-label-row="6" data-label-align="end"></span>
<span class="mono-chart__guide" data-from="10,0" data-to="10,60" data-label="Q0" data-label-col="23" data-label-row="17"></span>
<span class="mono-chart__point" data-x="10" data-y="60" data-label="E0" data-label-col="25" data-label-row="6"></span>
</div>
<figcaption>stage 1: old coal technology produces energy at equilibrium E0.</figcaption>
</figure>

<figure class="mono-chart" style="--chart-cols: 48; --chart-rows: 16; --mono-chart-pad-left: 7; --mono-chart-pad-right: 14; --mono-chart-pad-top: 2; --mono-chart-pad-bottom: 5;" aria-label="coal rebound stage two efficiency shifts supply down and right">
<div class="mono-chart__canvas" data-x-min="0" data-x-max="20" data-y-min="0" data-y-max="100">
<span class="mono-chart__axis mono-chart__axis--x" data-label="energy quantity" data-label-col="17" data-label-row="19"></span>
<span class="mono-chart__axis mono-chart__axis--y" data-orientation="y" data-label="energy price" data-label-col="-7" data-label-row="-1"></span>
<span class="mono-chart__series mono-chart__series--muted" data-points="2.5,0;15,100" data-label="S0 supply" data-label-col="37" data-label-row="0"></span>
<span class="mono-chart__series mono-chart__series--accent" data-points="7.5,0;20,100" data-label="S1 supply" data-label-col="49" data-label-row="0"></span>
<span class="mono-chart__series mono-chart__series--warm" data-points="5,100;17.5,0" data-label="demand" data-label-col="14" data-label-row="0"></span>
<span class="mono-chart__arrow mono-chart__arrow--accent" data-from="12,76" data-to="14.5,56"></span>
<span class="mono-chart__guide" data-from="0,60" data-to="10,60" data-label="P0" data-label-col="-1" data-label-row="6" data-label-align="end"></span>
<span class="mono-chart__guide" data-from="10,0" data-to="10,60" data-label="Q0" data-label-col="23" data-label-row="17"></span>
<span class="mono-chart__point" data-x="10" data-y="60" data-label="E0" data-label-col="25" data-label-row="6"></span>
</div>
<figcaption>stage 2: the same coal input can supply more energy, so supply shifts down and right.</figcaption>
</figure>

<figure class="mono-chart" style="--chart-cols: 48; --chart-rows: 16; --mono-chart-pad-left: 7; --mono-chart-pad-right: 14; --mono-chart-pad-top: 2; --mono-chart-pad-bottom: 5;" aria-label="coal rebound stage three energy price falls">
<div class="mono-chart__canvas" data-x-min="0" data-x-max="20" data-y-min="0" data-y-max="100">
<span class="mono-chart__axis mono-chart__axis--x" data-label="energy quantity" data-label-col="17" data-label-row="19"></span>
<span class="mono-chart__axis mono-chart__axis--y" data-orientation="y" data-label="energy price" data-label-col="-7" data-label-row="-1"></span>
<span class="mono-chart__series mono-chart__series--muted" data-points="2.5,0;15,100" data-label="S0" data-label-col="37" data-label-row="0"></span>
<span class="mono-chart__series mono-chart__series--accent" data-points="7.5,0;20,100" data-label="S1" data-label-col="49" data-label-row="0"></span>
<span class="mono-chart__series mono-chart__series--warm" data-points="5,100;17.5,0" data-label="demand" data-label-col="14" data-label-row="0"></span>
<span class="mono-chart__guide" data-from="0,60" data-to="10,60" data-label="P0" data-label-col="-1" data-label-row="6" data-label-align="end"></span>
<span class="mono-chart__guide" data-from="10,0" data-to="10,60" data-label="Q0" data-label-col="23" data-label-row="17"></span>
<span class="mono-chart__guide" data-from="0,40" data-to="12.5,40" data-label="P1" data-label-col="-1" data-label-row="10" data-label-align="end"></span>
<span class="mono-chart__guide" data-from="12.5,0" data-to="12.5,40" data-label="Q1" data-label-col="29" data-label-row="17"></span>
<span class="mono-chart__arrow mono-chart__arrow--accent" data-from="1.1,60" data-to="1.1,40"></span>
<span class="mono-chart__point mono-chart__point--muted" data-x="10" data-y="60" data-label="E0" data-label-col="25" data-label-row="6"></span>
<span class="mono-chart__point mono-chart__point--accent" data-x="12.5" data-y="40" data-label="E1" data-label-col="31" data-label-row="9"></span>
</div>
<figcaption>stage 3: the new equilibrium has a lower energy price.</figcaption>
</figure>

<figure class="mono-chart" style="--chart-cols: 48; --chart-rows: 16; --mono-chart-pad-left: 7; --mono-chart-pad-right: 14; --mono-chart-pad-top: 2; --mono-chart-pad-bottom: 5;" aria-label="coal rebound stage four energy quantity rises">
<div class="mono-chart__canvas" data-x-min="0" data-x-max="20" data-y-min="0" data-y-max="100">
<span class="mono-chart__axis mono-chart__axis--x" data-label="energy quantity" data-label-col="17" data-label-row="19"></span>
<span class="mono-chart__axis mono-chart__axis--y" data-orientation="y" data-label="energy price" data-label-col="-7" data-label-row="-1"></span>
<span class="mono-chart__series mono-chart__series--muted" data-points="2.5,0;15,100" data-label="S0" data-label-col="37" data-label-row="0"></span>
<span class="mono-chart__series mono-chart__series--accent" data-points="7.5,0;20,100" data-label="S1" data-label-col="49" data-label-row="0"></span>
<span class="mono-chart__series mono-chart__series--warm" data-points="5,100;17.5,0" data-label="demand" data-label-col="14" data-label-row="0"></span>
<span class="mono-chart__guide" data-from="0,60" data-to="10,60" data-label="P0" data-label-col="-1" data-label-row="6" data-label-align="end"></span>
<span class="mono-chart__guide" data-from="10,0" data-to="10,60" data-label="Q0" data-label-col="23" data-label-row="17"></span>
<span class="mono-chart__guide" data-from="0,40" data-to="12.5,40" data-label="P1" data-label-col="-1" data-label-row="10" data-label-align="end"></span>
<span class="mono-chart__guide" data-from="12.5,0" data-to="12.5,40" data-label="Q1" data-label-col="29" data-label-row="17"></span>
<span class="mono-chart__arrow mono-chart__arrow--accent" data-from="10,8" data-to="12.5,8"></span>
<span class="mono-chart__label mono-chart__label--accent" data-col="25" data-row="13">rebound</span>
<span class="mono-chart__point mono-chart__point--muted" data-x="10" data-y="60" data-label="E0" data-label-col="25" data-label-row="6"></span>
<span class="mono-chart__point mono-chart__point--accent" data-x="12.5" data-y="40" data-label="E1" data-label-col="31" data-label-row="9"></span>
</div>
<figcaption>stage 4: cheaper energy raises quantity demanded. with a 25% efficiency gain, Q1 = 1.25 * Q0 is exactly 100% rebound.</figcaption>
</figure>

<figure class="mono-chart" style="--chart-cols: 48; --chart-rows: 14; --mono-chart-pad-left: 7; --mono-chart-pad-right: 12; --mono-chart-pad-top: 2; --mono-chart-pad-bottom: 5;" aria-label="coal accounting as rectangle area">
<div class="mono-chart__canvas" data-x-min="0" data-x-max="16" data-y-min="0" data-y-max="1.2">
<span class="mono-chart__area mono-chart__area--accent" data-from="0,0" data-to="12.5,0.8"></span>
<span class="mono-chart__area mono-chart__area--muted" data-from="0,0" data-to="10,1" data-fill="none"></span>
<span class="mono-chart__axis mono-chart__axis--x" data-label="energy quantity" data-label-col="17" data-label-row="17"></span>
<span class="mono-chart__axis mono-chart__axis--y" data-orientation="y" data-label="coal per energy" data-label-col="-7" data-label-row="-1"></span>
<span class="mono-chart__guide" data-from="0,1" data-to="10,1" data-label="1.0" data-label-col="-1" data-label-row="2" data-label-align="end"></span>
<span class="mono-chart__guide" data-from="0,0.8" data-to="12.5,0.8" data-label="0.8" data-label-col="-1" data-label-row="5" data-label-align="end"></span>
<span class="mono-chart__guide" data-from="10,0" data-to="10,1" data-label="Q0" data-label-col="29" data-label-row="15"></span>
<span class="mono-chart__guide" data-from="12.5,0" data-to="12.5,0.8" data-label="Q1" data-label-col="37" data-label-row="15"></span>
<span class="mono-chart__label mono-chart__label--muted" data-col="3" data-row="3">old coal use</span>
<span class="mono-chart__label mono-chart__label--accent" data-col="20" data-row="6">new coal use</span>
<span class="mono-chart__label mono-chart__label--accent" data-col="18" data-row="10">same area at 100% rebound</span>
</div>
<figcaption>coal use is area: energy quantity times coal required per unit of energy.</figcaption>
</figure>

the part that decides jevons is not whether service demand rises. it does. the deciding question is whether service quantity rises faster than efficiency.

for a 25% efficiency gain, each service unit uses 20% less input resource. baseline resource use is `Q0`. after the efficiency gain, resource use is `0.8 * Q1`. jevons begins only after `Q1 > 1.25 * Q0`.

<figure class="mono-chart" style="--chart-cols: 46; --chart-rows: 16; --mono-chart-pad-left: 7; --mono-chart-pad-right: 14; --mono-chart-pad-top: 2; --mono-chart-pad-bottom: 4;" aria-label="inelastic demand causes rebound without jevons paradox">
<div class="mono-chart__canvas" data-x-min="8" data-x-max="16" data-y-min="70" data-y-max="110">
<span class="mono-chart__axis mono-chart__axis--x" data-label="service quantity" data-label-col="30" data-label-row="19"></span>
<span class="mono-chart__axis mono-chart__axis--y" data-orientation="y" data-label="effective price" data-label-col="-7" data-label-row="-1"></span>
<span class="mono-chart__series mono-chart__series--warm" data-points="9.5,110;11.5,70" data-label="inelastic demand" data-label-col="23" data-label-row="8"></span>
<span class="mono-chart__guide" data-from="8,100" data-to="10,100" data-label="P0" data-label-col="-1" data-label-row="4" data-label-align="end"></span>
<span class="mono-chart__guide" data-from="10,70" data-to="10,100" data-label="Q0" data-label-col="11" data-label-row="17"></span>
<span class="mono-chart__guide" data-from="8,80" data-to="11,80" data-label="P1" data-label-col="-1" data-label-row="12" data-label-align="end"></span>
<span class="mono-chart__guide" data-from="11,70" data-to="11,80" data-label="Q1" data-label-col="17" data-label-row="17"></span>
<span class="mono-chart__point" data-x="10" data-y="100" data-label="A" data-label-col="13" data-label-row="3"></span>
<span class="mono-chart__point mono-chart__point--accent" data-x="11" data-y="80" data-label="B" data-label-col="19" data-label-row="11"></span>
<span class="mono-chart__label mono-chart__label--muted" data-col="21" data-row="14">Q1 &lt; break-even</span>
</div>
<figcaption>inelastic demand: service quantity rises, but input-resource consumption still falls.</figcaption>
</figure>

<figure class="mono-chart" style="--chart-cols: 46; --chart-rows: 16; --mono-chart-pad-left: 7; --mono-chart-pad-right: 14; --mono-chart-pad-top: 2; --mono-chart-pad-bottom: 4;" aria-label="elastic demand produces jevons paradox">
<div class="mono-chart__canvas" data-x-min="8" data-x-max="16" data-y-min="70" data-y-max="110">
<span class="mono-chart__axis mono-chart__axis--x" data-label="service quantity" data-label-col="30" data-label-row="19"></span>
<span class="mono-chart__axis mono-chart__axis--y" data-orientation="y" data-label="effective price" data-label-col="-7" data-label-row="-1"></span>
<span class="mono-chart__series mono-chart__series--warm" data-points="8,110;16,70" data-label="elastic demand" data-label-col="26" data-label-row="9"></span>
<span class="mono-chart__guide" data-from="8,100" data-to="10,100" data-label="P0" data-label-col="-1" data-label-row="4" data-label-align="end"></span>
<span class="mono-chart__guide" data-from="10,70" data-to="10,100" data-label="Q0" data-label-col="11" data-label-row="17"></span>
<span class="mono-chart__guide" data-from="8,80" data-to="14,80" data-label="P1" data-label-col="-1" data-label-row="12" data-label-align="end"></span>
<span class="mono-chart__guide" data-from="14,70" data-to="14,80" data-label="Q1" data-label-col="34" data-label-row="17"></span>
<span class="mono-chart__point" data-x="10" data-y="100" data-label="A" data-label-col="13" data-label-row="3"></span>
<span class="mono-chart__point mono-chart__point--accent" data-x="14" data-y="80" data-label="B" data-label-col="36" data-label-row="11"></span>
<span class="mono-chart__label mono-chart__label--muted" data-col="21" data-row="14">Q1 &gt; break-even</span>
</div>
<figcaption>elastic demand: service quantity rises enough that total input-resource consumption also rises.</figcaption>
</figure>
