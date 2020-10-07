const sum = (values: number[]) => values.reduce((sum, curr) => sum + curr, 0);

const squaredDiff = (val1: number, val2: number) => Math.pow(val1 - val2, 2);

export const mean = (values: number[]) => sum(values) / values.length;

export const standardDeviation = (values: number[]) => {
  const avg = mean(values);
  const squaredDiffs = values.map((val) => squaredDiff(val, avg));

  return Math.sqrt(sum(squaredDiffs) / (values.length - 1));
};

export const round = (number: number, digits: number = 2) => {
  const factor = Math.pow(10, digits);
  return Math.round(factor * number) / factor;
};
