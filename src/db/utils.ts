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
