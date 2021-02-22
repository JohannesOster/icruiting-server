import {QueryFile} from 'pg-promise';

export const sql = (path: string) => {
  const qf = new QueryFile(path, {minify: true});
  if (qf.error) console.error(qf.error);
  return qf;
};

export const rawText = (text: string) => ({
  toPostgres: () => text,
  rawType: true,
});

export const compareArrays = <T>(
  first: T[],
  second: T[],
  compare: (first: T, second: T) => boolean,
): {intersection: T[]; firstMinusSecond: T[]; secondMinusFirst: T[]} => {
  const resp = {
    intersection: [],
    firstMinusSecond: [],
    secondMinusFirst: [],
  } as {intersection: T[]; firstMinusSecond: T[]; secondMinusFirst: T[]};

  first.forEach((item) => {
    const inters = second.find((elem) => compare(item, elem));
    if (inters) return resp.intersection.push(item);
    resp.firstMinusSecond.push(item);
  });

  second.forEach((item) => {
    const inters = first.find((elem) => compare(item, elem));
    if (inters) return;
    resp.secondMinusFirst.push(item);
  });

  return resp;
};
