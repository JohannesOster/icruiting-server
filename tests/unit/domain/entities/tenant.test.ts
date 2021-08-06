import {createTenant} from 'domain/entities/tenant';

describe('createTenant', () => {
  describe('immutability', () => {
    it('returns immutable object', () => {
      const tenant = createTenant({tenantName: 'IBM - HR'});
      const setName = () => {
        tenant.tenantName = 'IBM - Sales';
      };

      expect(setName).toThrow();
    });
  });

  describe('validation', () => {
    it('throws on empty string as tenantName', () => {
      const _createTenant = () => createTenant({tenantName: ''});
      expect(_createTenant).toThrow();
    });
  });
});
