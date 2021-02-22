import {compareArrays} from 'infrastructure/db/utils';

describe('db-utils', () => {
  describe('compareArrays', () => {
    it('returns correct intersection', () => {
      type T = {id: string};
      const first = [{id: 'a'}, {id: 'b'}];
      const sec = [{id: 'a'}];
      const compare = (a: T, b: T) => a.id === b.id;

      const res = compareArrays(first, sec, compare);
      expect(res.intersection).toStrictEqual([{id: 'a'}]);
    });

    it('returns empty intersection if no equal elements exist', () => {
      type T = {id: string};
      const first = [{id: 'a'}, {id: 'b'}];
      const sec = [{id: 'c'}];
      const compare = (a: T, b: T) => a.id === b.id;

      const res = compareArrays(first, sec, compare);
      expect(res.intersection).toStrictEqual([]);
    });

    it('returns correct firstMinusSecond', () => {
      type T = {id: string};
      const first = [{id: 'a'}, {id: 'b'}];
      const sec = [{id: 'a'}];
      const compare = (a: T, b: T) => a.id === b.id;

      const res = compareArrays(first, sec, compare);
      expect(res.firstMinusSecond).toStrictEqual([{id: 'b'}]);
    });

    it('returns empty firstMinusSecond if all elements of first are in second', () => {
      type T = {id: string};
      const first = [{id: 'a'}];
      const sec = [{id: 'a'}, {id: 'b'}];
      const compare = (a: T, b: T) => a.id === b.id;

      const res = compareArrays(first, sec, compare);
      expect(res.firstMinusSecond).toStrictEqual([]);
    });

    it('returns correct secondMinusFirst', () => {
      type T = {id: string};
      const first = [{id: 'a'}];
      const sec = [{id: 'a'}, {id: 'b'}];
      const compare = (a: T, b: T) => a.id === b.id;

      const res = compareArrays(first, sec, compare);
      expect(res.secondMinusFirst).toStrictEqual([{id: 'b'}]);
    });

    it('returns empty secondMinusFirst if all elements of second are in first', () => {
      type T = {id: string};
      const first = [{id: 'a'}, {id: 'b'}];
      const sec = [{id: 'a'}];
      const compare = (a: T, b: T) => a.id === b.id;

      const res = compareArrays(first, sec, compare);
      expect(res.secondMinusFirst).toStrictEqual([]);
    });
  });
});
