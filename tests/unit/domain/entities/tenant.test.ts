import {createTenant} from 'modules/tenants/domain';

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

  describe('fixed properties', () => {
    it('drops unknown properties', () => {
      const params = {
        tenantName: 'IBM - CSR',
        unknownProp: 'unknownProp',
      } as any; // any to mimic runtime type error

      const tenant = createTenant(params) as any;
      expect(tenant.unknownProp).toBeUndefined();
    });
  });

  describe('validation', () => {
    it('throws on empty string as tenantName', () => {
      const _createTenant = () => createTenant({tenantName: ''});
      expect(_createTenant).toThrow();
    });

    it('drops null or undefined properties', () => {
      const tenant = createTenant({
        tenantName: 'Apple - CTO',
        stripeCustomerId: null as any,
        theme: null as any,
      });

      expect(tenant.stripeCustomerId).toBeUndefined();
      expect(tenant.theme).toBeUndefined();
    });
  });
});
