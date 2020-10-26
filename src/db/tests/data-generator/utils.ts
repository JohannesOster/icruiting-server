type KeyVal<T> = {[key: string]: T};
const columns = (data: KeyVal<any>) => Object.keys(data).join(',');
const values = (data: KeyVal<any>) =>
  Object.values(data)
    .map((val) => `'${val}'`)
    .join(',');

export const generateInsert = (table: string, data: any) => {
  if (!Array.isArray(data)) data = [data];
  const vals = data
    .map((entry: KeyVal<any>) => `(${values(entry)})`)
    .join(',\n\t');

  return `INSERT INTO ${table}(${columns(data[0])}) VALUES\n\t${vals};\n`;
};

export const flatten = (arr: any[]) =>
  arr.reduce((acc, val) => acc.concat(val), []);
