import config from 'config';
import Stripe from 'stripe';

export const PaymentService = () => {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) throw new Error('Missing STRIPE_SECRET_KEY');
  const stripe = new Stripe(stripeKey, {apiVersion: '2020-08-27'});

  const customers = {
    create: async (email: string, subscriptionId: string) => {
      const {id} = await stripe.customers.create({email});
      await subscriptions.create(id, subscriptionId);
      return {customerId: id};
    },
    del: (customerId: string) => {
      return stripe.customers.del(customerId);
    },
    retrieve: (customerId: string) => {
      return stripe.customers.retrieve(customerId) as Promise<
        Stripe.Response<Stripe.Customer>
      >;
    },
  };

  const subscriptions = {
    create: (
      customerId: string,
      subscriptionId: string,
      trial: number = 14,
    ) => {
      return stripe.subscriptions.create({
        customer: customerId,
        items: [{price: subscriptionId}],
        trial_period_days: trial,
      });
    },
    listActive: (customerId: string) => {
      return Promise.all([
        stripe.subscriptions.list({
          customer: customerId,
          status: 'active',
          expand: ['data.plan.product'],
        }),
        stripe.subscriptions.list({
          customer: customerId,
          status: 'trialing',
          expand: ['data.plan.product'],
        }),
      ]).then(([active, trialing]) => active.data.concat(trialing.data));
    },
    cancel: (subscriptionId: string) => {
      return stripe.subscriptions.del(subscriptionId);
    },
    // List all products / possible subscriptions that exist
    list: () => {
      return stripe.prices
        .list({
          limit: 3,
          expand: ['data.product'],
        })
        .then(({data}) => {
          return data.filter((price) => {
            const isFriendsAndFamiliy =
              (price.product as any).id === config.freeStripeProducId;
            const isActive = price.active;
            return isActive && !isFriendsAndFamiliy;
          });
        });
    },
  };

  const paymentMethods = {
    list: async (customerId: string) => {
      return Promise.all([
        customers.retrieve(customerId),
        stripe.paymentMethods.list({
          customer: customerId,
          type: 'sepa_debit',
        }),
      ]).then(([customer, {data}]) => {
        if (!data) return [];
        const paymentMethods = data.map((paymentMethod) => {
          if (
            paymentMethod.id !==
            customer.invoice_settings.default_payment_method
          )
            return paymentMethod;
          return {is_default: true, ...paymentMethod};
        });

        return paymentMethods;
      });
    },
    del: async (customerId: string, paymentMethodId: string) => {
      await stripe.paymentMethods.detach(paymentMethodId);

      const _paymentMethods = await paymentMethods.list(customerId);
      if (!_paymentMethods.length) return;
      const customer = await customers.retrieve(customerId);
      if (customer.invoice_settings.default_payment_method) return;

      await stripe.customers.update(customerId, {
        invoice_settings: {default_payment_method: _paymentMethods[0].id},
      });
    },
    setDefault: (customerId: string, paymentMethodId: string) => {
      return stripe.customers.update(customerId, {
        invoice_settings: {default_payment_method: paymentMethodId},
      });
    },
  };

  const payment = {
    initialize: (customerId: string) => {
      return stripe.setupIntents.create({
        payment_method_types: ['sepa_debit'],
        customer: customerId,
      });
    },
  };

  return {customers, subscriptions, paymentMethods, payment};
};
