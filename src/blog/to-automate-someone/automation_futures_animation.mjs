import { mountSegmentedAsciiScenarioChart } from "./automation_futures_simulation.mjs";

const HUMAN_VALUE = 10;
const TIMES = [0, 2, 4, 6];
const AI_ALONE_SERIES = [6, 10, 16, 24];
const SHOW_Y_VALUES = false;
const SHOW_X_AXIS_VALUES = false;
const SHOW_TIME_VALUES = false;

const FUTURE_SCENARIOS = [
  {
    elementId: "future-comparative-constant",
    synergySeries: [3, 3, 3, 3],
  },
  {
    elementId: "future-comparative-compounds",
    synergySeries: [2, 5, 9, 14],
  },
  {
    elementId: "future-comparative-decays",
    pairedAiSeries: [10, 9, 8, 7],
    synergySeries: [12, 10, 9, 8],
  },
  {
    elementId: "future-phase-change",
    pairedAiSeries: [10, 8, 6, 4],
    synergySeries: [8, 5, 2, 0],
  },
];

function buildScenarioPoints(scenario) {
  const { synergySeries, pairedAiSeries } = scenario;
  const points = [];

  for (let index = 0; index < TIMES.length; index += 1) {
    const time = TIMES[index];
    const aiValue = AI_ALONE_SERIES[index];
    const pairedAiValue = Array.isArray(pairedAiSeries)
      ? pairedAiSeries[index]
      : aiValue;
    const positiveSynergy = Math.max(0, synergySeries[index]);

    points.push(
      {
        name: "you alone",
        time,
        segments: [
          { key: "human", character: "█", value: HUMAN_VALUE },
        ],
      },
      {
        name: "ai alone",
        time,
        segments: [
          { key: "ai", character: "░", value: aiValue },
        ],
      },
      {
        name: "ai + you",
        time,
        segments: [
          { key: "ai", character: "░", value: pairedAiValue },
          { key: "human", character: "█", value: HUMAN_VALUE },
          { key: "synergy_positive", character: "+", value: positiveSynergy },
        ],
      },
    );
  }

  return points;
}

function mountFutureScenario(scenario) {
  const element = document.getElementById(scenario.elementId);
  if (!element) {
    return null;
  }

  return mountSegmentedAsciiScenarioChart({
    element,
    points: buildScenarioPoints(scenario),
    fps: 12,
    framesPerTimeUnit: 8,
    rowOrder: ["you alone", "ai alone", "ai + you"],
    xScaleMode: "global",
    xAxisTickCount: 7,
    showRowValues: SHOW_Y_VALUES,
    showXAxisValues: SHOW_X_AXIS_VALUES,
    showXAxisTicks: true,
    showTimeAxis: true,
    showTimeValues: SHOW_TIME_VALUES,
    loop: true,
  });
}

function bootAutomationFuturesAnimation() {
  const controllers = FUTURE_SCENARIOS
    .map((scenario) => mountFutureScenario(scenario))
    .filter((controller) => controller !== null);

  if (controllers.length === 0) {
    return;
  }

  window.addEventListener("beforeunload", () => {
    for (const controller of controllers) {
      controller.destroy();
    }
  }, { once: true });
}

void bootAutomationFuturesAnimation();
