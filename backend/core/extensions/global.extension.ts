global.sleep = function(
  // duration
  ms: number,
) {
  return new Promise(resolve => setTimeout(resolve, ms));
};
