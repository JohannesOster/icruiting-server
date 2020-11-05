import db from 'db';

const handler = {
  'customer.subscription.created': async (object: any) => {
    console.log(`
      Created new subscription;
      subscriptionId: ${object.id}
      customerId: ${object.customer}
    `);

    await db.tenants.updateSubscription(
      object.customer,
      object.id,
      object.status,
    );
  },
  'customer.subscription.deleted': async (object: any) => {
    console.log(`
      Deleted subscription;
      subscriptionId: ${object.id}
      customerId: ${object.customer}
    `);

    await db.tenants.updateSubscription(object.customer, null, null);
  },
  'customer.subscription.trial_will_end': (object: any) => console.log(object),
  'payment_method.attached': (object: any) => console.log(object),
  'payment_method.detached': (object: any) => console.log(object),
  'invoice.created': (object: any) => console.log(object),
  'invoice.paid': (object: any) => console.log(object),
  'invoice.payment_failed': (object: any) => console.log(object),
  'customer.subscription.updated': (object: any) => console.log(object),
} as {[key: string]: (object: any) => void};

export default handler;
