---
title: hunter paulson
subtitle: ml engineer & researcher
lang: en
---

hello explorer, welcome to my light cone.

if you have made it here, feel free to take a look around or reach out.

<pre id="bh" aria-label="blackhole ascii" style="line-height:1; margin:1rem 0;">loading…</pre>
<script>
(async function(){
  const pre = document.getElementById('bh');
  try{
    const res = await fetch('assets/blackhole_frames.txt');
    const txt = await res.text();
    const frames = txt.split('\f');
    let i = 0;
    const fps = 30;
    function tick(){ pre.textContent = frames[i]; i=(i+1)%frames.length; }
    tick();
    setInterval(tick, 1000/fps);
  }catch(e){ pre.textContent = 'failed to load animation'; }
})();
</script>
