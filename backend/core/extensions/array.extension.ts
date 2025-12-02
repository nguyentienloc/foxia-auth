interface Array<T> {
    hasMin: (attrib: keyof T) => T;
    hasMax: (attrib: keyof T) => T;
  }

Array.prototype.hasMin = function (attrib) {
  const checker = (obj: any, key: string | number | symbol) =>
    typeof obj === 'object' && obj[key];
  return (
    (this.length &&
      this.reduce(function (prev, curr) {
        const isPrevHasAttrib = checker(prev, attrib);
        const isCurrHasAttrib = checker(curr, attrib);
        if (!isPrevHasAttrib && !isCurrHasAttrib) return {};
        if (!isPrevHasAttrib) return curr;
        if (!isCurrHasAttrib) return prev;
        return prev[attrib] < curr[attrib] ? prev : curr;
      })) ||
    null
  );
};

Array.prototype.hasMax = function (attrib) {
  const checker = (obj: any, key: string | number | symbol) =>
    typeof obj === 'object' && obj[key];
  return (
    (this.length &&
      this.reduce(function (prev, curr) {
        const isPrevHasAttrib = checker(prev, attrib);
        const isCurrHasAttrib = checker(curr, attrib);
        if (!isPrevHasAttrib && !isCurrHasAttrib) return {};
        if (!isPrevHasAttrib) return curr;
        if (!isCurrHasAttrib) return prev;
        return prev[attrib] > curr[attrib] ? prev : curr;
      })) ||
    null
  );
};