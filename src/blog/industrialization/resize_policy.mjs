export function shouldRecreateFarmingSimulation(options) {
  const { currentDimensions, nextDimensions, narrowViewport } = options;

  if (currentDimensions === null) {
    return true;
  }

  if (nextDimensions.columns !== currentDimensions.columns) {
    return true;
  }

  if (nextDimensions.lineHeight !== currentDimensions.lineHeight) {
    return true;
  }

  if (nextDimensions.rows === currentDimensions.rows) {
    return false;
  }

  return !narrowViewport;
}
