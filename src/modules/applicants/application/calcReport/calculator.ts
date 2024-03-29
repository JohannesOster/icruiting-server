import _ from 'lodash';

type KV<T> = {[key: string]: T};
const deepScore = <T>(obj: KV<T>, path: string) => {
  const data = Object.values(obj)
    .map((sub) => +_.get(sub, path))
    .filter((val) => !isNaN(val));

  return score(data);
};

const sum = (data: number[]) => {
  return data.reduce((acc, curr) => acc + curr);
};

const mean = (data: number[]) => {
  return sum(data) / data.length;
};

const squareDiffs = (data: number[], mean: number) => {
  return data.map((value) => Math.pow(value - mean, 2));
};

const stdDev = (data: number[]) => {
  const _mean = mean(data);
  const _squareDiffs = squareDiffs(data, _mean);
  return Math.sqrt(mean(_squareDiffs));
};

const score = (data: number[]) => {
  const _mean = mean(data);
  const _squareDiffs = squareDiffs(data, _mean);
  const stdDev = Math.sqrt(mean(_squareDiffs));

  return [_mean, stdDev] as const;
};

const round = (number: number, digits: number = 2) => {
  if (digits <= 0) return Math.round(number);
  const factor = Math.pow(10, digits);
  return Math.round(factor * number) / factor;
};

export {deepScore, score, stdDev, mean, sum, round};
