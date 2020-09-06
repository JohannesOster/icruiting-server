export const removePrefixFromUserAttribute = (
  attribute: string,
  separator: string = ':',
) => {
  return attribute.split(separator).slice(-1)[0];
};
