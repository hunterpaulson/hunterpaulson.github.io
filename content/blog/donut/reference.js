(function () {
  const screen = document.getElementById("d");
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
