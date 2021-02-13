import db from 'infrastructure/db';

const handler = {
  'customer.subscription.created': (object: any) => console.log(object),
  'customer.subscription.deleted': (object: any) => console.log(object),
  'customer.subscription.trial_will_end': (object: any) => console.log(object),
  'payment_method.attached': (object: any) => console.log(object),
  'payment_method.detached': (object: any) => console.log(object),
  'invoice.created': (object: any) => console.log(object),
  'invoice.paid': (object: any) => console.log(object),
  'invoice.payment_failed': (object: any) => console.log(object),
  'customer.subscription.updated': (object: any) => console.log(object),
} as {[key: string]: (object: any) => void};

export default handler;
