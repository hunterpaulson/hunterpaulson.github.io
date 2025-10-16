---
title: donut.c
subtitle: NOT by hunter paulson
date: 2025-10-15
---

::: {=html}
<pre
  id="donut-screen"
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
(function () {
  const screen = document.getElementById("donut-screen");
  if (!screen) return;

  const width = 80;
  const height = 45;
  const luminanceMap = ".,-~:;=!*#$@";
  const z = new Array(width * height);
  const buffer = new Array(width * height);

  let A = 0;
  let B = 0;

  function clamp(value, min, max) {
    if (value < min) return min;
    if (value > max) return max;
    return value;
  }

  function frame() {
    z.fill(0);
    buffer.fill(" ");

    A += 0.07;
    B += 0.03;

    const cA = Math.cos(A);
    const sA = Math.sin(A);
    const cB = Math.cos(B);
    const sB = Math.sin(B);

    for (let j = 0; j < 6.28; j += 0.07) {
      const cT = Math.cos(j);
      const sT = Math.sin(j);
      for (let i = 0; i < 6.28; i += 0.02) {
        const sP = Math.sin(i);
        const cP = Math.cos(i);
        const h = cT + 2;
        const invZ = 1 / (sP * h * sA + sT * cA + 5);
        const t = sP * h * cA - sT * sA;

        const x = Math.floor(width / 2 + (width * 0.375) * invZ * (cP * h * cB - t * sB));
        const y = Math.floor(height / 2 + (height * 0.35) * invZ * (cP * h * sB + t * cB));
        if (y < 0 || y >= height || x < 0 || x >= width) continue;

        const idx = x + width * y;

        const luminance = clamp(
          Math.floor(
            8 * (
              (sT * sA - sP * cT * cA) * cB -
              sP * cT * sA -
              sT * cA -
              cP * cT * sB
            )
          ),
          0,
          luminanceMap.length - 1
        );

        if (invZ > z[idx]) {
          z[idx] = invZ;
          buffer[idx] = luminanceMap[luminance];
        }
      }
    }

    let output = "";
    for (let k = 0; k < buffer.length; k++) {
      output += buffer[k];
      if ((k + 1) % width === 0 && k !== buffer.length - 1) output += "\n";
    }
    screen.textContent = output;
  }

  frame();
  setInterval(frame, 50);
})();
</script>
:::

[aikon's donut.c](https://www.a1k0n.net/2011/07/20/donut-math.html)

```c
             k;double sin()
         ,cos();main(){float A=
       0,B=0,i,j,z[1760];char b[
     1760];printf("\x1b[2J");for(;;
  ){memset(b,32,1760);memset(z,0,7040)
  ;for(j=0;6.28>j;j+=0.07)for(i=0;6.28
 >i;i+=0.02){float c=sin(i),d=cos(j),e=
 sin(A),f=sin(j),g=cos(A),h=d+2,D=1/(c*
 h*e+f*g+5),l=cos      (i),m=cos(B),n=s\
in(B),t=c*h*g-f*        e;int x=40+30*D*
(l*h*m-t*n),y=            12+15*D*(l*h*n
+t*m),o=x+80*y,          N=8*((f*e-c*d*g
 )*m-c*d*e-f*g-l        *d*n);if(22>y&&
 y>0&&x>0&&80>x&&D>z[o]){z[o]=D;;;b[o]=
 ".,-~:;=!*#$@"[N>0?N:0];}}/*#****!!-*/
  printf("\x1b[H");for(k=0;1761>k;k++)
   putchar(k%80?b[k]:10);A+=0.04;B+=
     0.02;}}/*****####*******!!=;:~
       ~::==!!!**********!!!==::-
         .,~~;;;========;;;:~-.
             ..,--------,*/
```

try 'debug mode' below