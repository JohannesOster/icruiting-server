export const removePrefix = (attribute: string, prefix: string) => {
  return attribute.split(prefix).slice(-1)[0];
};
