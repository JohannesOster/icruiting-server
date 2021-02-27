import _ from 'lodash';

export const deepReplace = (obj: any, replace: {[value: string]: string}) => {
  return _.cloneDeepWith(obj, (value) => replace[value]);
};
