const calSessionValidationScore = (stored, current) => {
  let score = 0;

  // if (stored.visitorId === current.visitorId) score += 5;
  if (stored.deviceIp === current.deviceIp) score += 1;
  if (stored.browserName === current.browserName) score += 3;
  if (stored.browserVersion === current.browserVersion) score += 2;
  if (stored.oSName === current.oSName) score += 2;
  if (stored.oSVersion === current.oSVersion) score += 1;
  if (stored.uA === current.uA) score += 2;
  if (stored.deviceModal === current.deviceModal) score += 1;
  if (stored.deviceVender === current.deviceVender) score += 1;
  if (stored.language === current.language) score += 1;
  if (stored.resolution === current.resolution) score += 1;

  return score;
};

export default calSessionValidationScore;
