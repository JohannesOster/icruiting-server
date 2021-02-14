import {httpReqHandler} from 'adapters/errorHandling';
import payment from 'infrastructure/payment';

export const SubscriptionsAdapter = () => {
  const getSubscriptions = httpReqHandler(async (req) => {
    const resp = payment.subscriptions.list();
    return {status: 201, body: resp};
  });

  return {getSubscriptions};
};