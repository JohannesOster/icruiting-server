import {filterNotNullAndDefined} from 'utils/filterNotNullAndDefined';

describe('filterNotNullAndDefined', () => {
  it('filters null', () => {
    expect([1, null, 2].filter(filterNotNullAndDefined)).toStrictEqual([1, 2]);
  });
  it('filters undefined', () => {
    expect([1, undefined, 2].filter(filterNotNullAndDefined)).toStrictEqual([
      1,
      2,
    ]);
  });
});
