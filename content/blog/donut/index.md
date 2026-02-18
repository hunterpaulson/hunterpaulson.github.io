---
title: donut.js
date: 2025-10-15
---

this is my attempt to recreate [aikon's donut.c](https://www.a1k0n.net/2011/07/20/donut-math.html) animation on the web with obfuscated javascript.

```js
             (()=>{w=80;;h=
         45;l=".,-~:;=!*#$@";;A
       =B=0;setInterval(_=>{s =(
     document.getElementById("d"));
   if(!s)return;z=[];b=[];A+=.07;B+=
  .03;cA=Math.cos(A);sA=Math.sin(A);cB=
  Math.cos(B);sB=Math.sin(B);for(j=0;j<
 6.28;j+=.07){cT=Math.cos(j);sT=Math.sin
(j);for(i=0;i<6.28      ;i+=.02){sP=Math
.sin(i);cP=Math.         cos(i);H=cT+2;I
=1/(sP*H*sA+sT            *cA+5);t=sP*H*
cA-sT*sA;x=w/2+          w*.375*I*(cP*H*
 cB-t*sB)|0;y=h/        2+h*.35*I*(cP*H
 *sB+t*cB)|0;if(x>=0&&x<w&&y>=0&&y<h&&I
 >(z[o=x+w*y]||0)){N=8*((sT*sA-sP*cT*cA
  )*cB-sP*cT*sA-sT*cA-cP*cT*sB)|0;z[o]
   =I;b[o]=l[N<0?0:N]}}}for(o="",k=0
     ;k<w*h;k++)o+=b[k]||"\x20",k%w
       ==w-1&&k<w*h-1&&(o+="\n");
         s.textContent=o},50)})
             ();;;;;;;;;;;;
```

here is [proof](https://raw.githubusercontent.com/hunterpaulson/hunterpaulson.github.io/refs/heads/main/content/blog/donut/index.md) that the above code renders the torus below

::: {=html}
<pre
  id="d"
  style="
    width:80ch;
    height:calc(40 * var(--line-height));
    margin:calc(var(--line-height) * 2) auto;
    white-space:pre;
    overflow:hidden;
  "
  aria-live="off"
>
(loading donut...)
</pre>
<script>
             (()=>{w=80;;h=
         45;l=".,-~:;=!*#$@";;A
       =B=0;setInterval(_=>{s =(
     document.getElementById("d"));
   if(!s)return;z=[];b=[];A+=.07;B+=
  .03;cA=Math.cos(A);sA=Math.sin(A);cB=
  Math.cos(B);sB=Math.sin(B);for(j=0;j<
 6.28;j+=.07){cT=Math.cos(j);sT=Math.sin
(j);for(i=0;i<6.28      ;i+=.02){sP=Math
.sin(i);cP=Math.         cos(i);H=cT+2;I
=1/(sP*H*sA+sT            *cA+5);t=sP*H*
cA-sT*sA;x=w/2+          w*.375*I*(cP*H*
 cB-t*sB)|0;y=h/        2+h*.35*I*(cP*H
 *sB+t*cB)|0;if(x>=0&&x<w&&y>=0&&y<h&&I
 >(z[o=x+w*y]||0)){N=8*((sT*sA-sP*cT*cA
  )*cB-sP*cT*sA-sT*cA-cP*cT*sB)|0;z[o]
   =I;b[o]=l[N<0?0:N]}}}for(o="",k=0
     ;k<w*h;k++)o+=b[k]||"\x20",k%w
       ==w-1&&k<w*h-1&&(o+="\n");
         s.textContent=o},50)})
             ();;;;;;;;;;;;

</script>
:::

try 'debug mode' below