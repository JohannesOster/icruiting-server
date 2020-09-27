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

export const round = (number: number, digits: number = 2) => {
  const factor = Math.pow(10, digits);
  return Math.round(factor * number) / factor;
};
