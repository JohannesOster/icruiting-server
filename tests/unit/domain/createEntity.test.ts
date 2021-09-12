import {createEntity} from 'shared/domain';

describe('createTenant', () => {
  describe('immutability', () => {
    it('returns immutable object', () => {
      type Car = {color: string};
      const car = createEntity<Car>({color: 'blue'});
      const setColor = () => {
        car.color = 'green';
      };

      expect(setColor).toThrow();
    });
  });

  describe('validation', () => {
    it('drops null or undefined properties', () => {
      type Car = {color: string; numberOfSeats?: number};
      const car = createEntity<Car>({color: 'blue', numberOfSeats: null});
      expect(Object.keys(car).length).toBe(2); // color and id
    });
  });
});
