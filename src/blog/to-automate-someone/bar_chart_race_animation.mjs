import { mountAsciiBarChartRace } from "./bar_chart_race.mjs";

const FIELD_ELEMENT_ID = "bar-chart-race";

const SAMPLE_POINTS = [
  { name: "python", time: 0, value: 120 },
  { name: "python", time: 2, value: 80 },
  { name: "python", time: 4, value: 50 },
  { name: "python", time: 6, value: 30 },
  { name: "typescript", time: 0, value: 20 },
  { name: "typescript", time: 2, value: 40 },
  { name: "typescript", time: 4, value: 70 },
  { name: "typescript", time: 6, value: 110 },
  { name: "go", time: 0, value: 15 },
  { name: "go", time: 2, value: 30 },
  { name: "go", time: 4, value: 50 },
  { name: "go", time: 6, value: 75 },
  { name: "java", time: 0, value: 100 },
  { name: "java", time: 2, value: 60 },
  { name: "java", time: 4, value: 35 },
  { name: "java", time: 6, value: 20 },
  { name: "rust", time: 0, value: 5 },
  { name: "rust", time: 2, value: 15 },
  { name: "rust", time: 4, value: 35 },
  { name: "rust", time: 6, value: 60 },
  { name: "zig", time: 0, value: 2 },
  { name: "zig", time: 2, value: 7 },
  { name: "zig", time: 4, value: 18 },
  { name: "zig", time: 6, value: 30 },
];

function bootBarChartRace() {
  const fieldElement = document.getElementById(FIELD_ELEMENT_ID);
  if (!fieldElement) {
    return;
  }

  const chartController = mountAsciiBarChartRace({
    element: fieldElement,
    points: SAMPLE_POINTS,
    fps: 12,
    framesPerTimeUnit: 6,
    topN: 6,
    rowSpeed: 1,
    gapRows: 1,
    rankEpsilon: 0.3,
    xAxisTickCount: 6,
    showXAxisValues: true,
    showXAxisTicks: true,
    showTimeAxis: true,
    xScaleMode: "frame",
    loop: true,
  });

  window.addEventListener("beforeunload", () => {
    chartController.destroy();
  }, { once: true });
}

void bootBarChartRace();
